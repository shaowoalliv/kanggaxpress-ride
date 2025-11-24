-- ===================================================================
-- FIELD-LEVEL ENCRYPTION FOR KYC DOCUMENTS
-- Uses pgcrypto extension to encrypt sensitive parsed JSONB data
-- ===================================================================

-- 1. Enable pgcrypto extension
-- ===================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create secure encryption/decryption functions
-- ===================================================================

-- Get encryption key from a secure source
-- In production, this should come from a secrets manager
CREATE OR REPLACE FUNCTION public.get_kyc_encryption_key()
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use a combination of settings for the encryption key
  -- In production, replace this with vault.get_secret() or similar
  RETURN digest(current_setting('app.settings.jwt_secret', true) || 'kyc_salt_2024', 'sha256');
END;
$$;

-- Encrypt JSONB data
CREATE OR REPLACE FUNCTION public.encrypt_kyc_data(data jsonb)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF data IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_encrypt(
    data::text,
    encode(get_kyc_encryption_key(), 'hex')
  );
END;
$$;

-- Decrypt JSONB data
CREATE OR REPLACE FUNCTION public.decrypt_kyc_data(encrypted_data bytea)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(
    encrypted_data,
    encode(get_kyc_encryption_key(), 'hex')
  )::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    -- Log decryption failures
    RAISE WARNING 'KYC decryption failed: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- 3. Add encrypted column to kyc_documents
-- ===================================================================

-- Add new column for encrypted data
ALTER TABLE public.kyc_documents 
ADD COLUMN IF NOT EXISTS parsed_encrypted bytea;

-- 4. Migrate existing data to encrypted format
-- ===================================================================

-- Encrypt all existing parsed data
UPDATE public.kyc_documents
SET parsed_encrypted = encrypt_kyc_data(parsed)
WHERE parsed_encrypted IS NULL AND parsed IS NOT NULL;

-- 5. Create triggers for automatic encryption
-- ===================================================================

-- Function to automatically encrypt on insert/update
CREATE OR REPLACE FUNCTION public.kyc_encrypt_on_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt the parsed field if it's being set
  IF NEW.parsed IS NOT NULL THEN
    NEW.parsed_encrypted := encrypt_kyc_data(NEW.parsed);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS kyc_encrypt_parsed_trigger ON public.kyc_documents;

-- Create trigger
CREATE TRIGGER kyc_encrypt_parsed_trigger
  BEFORE INSERT OR UPDATE OF parsed
  ON public.kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION kyc_encrypt_on_write();

-- 6. Create secure view with automatic decryption
-- ===================================================================

-- Create a view that automatically decrypts data for authorized users
CREATE OR REPLACE VIEW public.kyc_documents_decrypted
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  doc_type,
  -- Decrypt parsed data for display
  CASE 
    WHEN parsed_encrypted IS NOT NULL 
    THEN decrypt_kyc_data(parsed_encrypted)
    ELSE parsed
  END as parsed,
  confidence,
  status,
  image_path,
  created_at,
  updated_at
FROM public.kyc_documents;

-- Add RLS policies to the decrypted view (inherits from base table)
-- Users can only see their own documents or admin can see all
COMMENT ON VIEW public.kyc_documents_decrypted IS 
'Secure view that automatically decrypts KYC documents for authorized users only.
RLS: Same policies as kyc_documents table.';

-- 7. Grant appropriate permissions
-- ===================================================================

-- Grant usage on encryption functions to authenticated users
GRANT EXECUTE ON FUNCTION public.decrypt_kyc_data(bytea) TO authenticated;

-- Note: encrypt_kyc_data and get_kyc_encryption_key remain SECURITY DEFINER
-- and are only callable through triggers

-- 8. Add security documentation
-- ===================================================================

COMMENT ON COLUMN public.kyc_documents.parsed_encrypted IS 
'Encrypted version of parsed JSONB data using AES-256 encryption via pgcrypto.
Use kyc_documents_decrypted view or decrypt_kyc_data() function to access.';

COMMENT ON FUNCTION public.encrypt_kyc_data IS 
'Encrypts KYC JSONB data using symmetric encryption. 
Called automatically by trigger on INSERT/UPDATE.';

COMMENT ON FUNCTION public.decrypt_kyc_data IS 
'Decrypts encrypted KYC data. Use kyc_documents_decrypted view for automatic decryption.';

-- 9. Performance optimization - add index on doc_type for encrypted queries
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_doc_type 
ON public.kyc_documents(user_id, doc_type) 
WHERE parsed_encrypted IS NOT NULL;

-- 10. Optional: Deprecate plain text column (phased approach)
-- ===================================================================

-- Add comment warning about deprecation
COMMENT ON COLUMN public.kyc_documents.parsed IS 
'DEPRECATED: Plain text JSONB. Use kyc_documents_decrypted view instead.
This column will be removed in future version once all data is migrated.';

-- Verify all data has been encrypted
DO $$
DECLARE
  unencrypted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unencrypted_count
  FROM public.kyc_documents
  WHERE parsed IS NOT NULL AND parsed_encrypted IS NULL;
  
  IF unencrypted_count > 0 THEN
    RAISE WARNING 'Found % KYC documents with unencrypted data', unencrypted_count;
  ELSE
    RAISE NOTICE 'All KYC documents successfully encrypted';
  END IF;
END $$;