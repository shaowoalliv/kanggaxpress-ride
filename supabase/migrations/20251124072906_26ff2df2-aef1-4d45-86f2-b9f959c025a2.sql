-- ===================================================================
-- ENCRYPTION KEY ROTATION WITH ZERO-DOWNTIME SUPPORT
-- Implements multi-key support and gradual re-encryption
-- ===================================================================

-- 1. Add key version tracking to kyc_documents
-- ===================================================================

-- Add column to track which encryption key version was used
ALTER TABLE public.kyc_documents 
ADD COLUMN IF NOT EXISTS encryption_key_version integer DEFAULT 1 NOT NULL;

-- Add column to track rotation status
ALTER TABLE public.kyc_documents
ADD COLUMN IF NOT EXISTS needs_reencryption boolean DEFAULT false NOT NULL;

-- Create index for efficient rotation queries
CREATE INDEX IF NOT EXISTS idx_kyc_needs_reencryption 
ON public.kyc_documents(needs_reencryption, encryption_key_version)
WHERE needs_reencryption = true;

-- 2. Create key version management table
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.kyc_encryption_keys (
  version integer PRIMARY KEY,
  key_identifier text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  deprecated_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT false,
  rotation_started_at timestamp with time zone,
  rotation_completed_at timestamp with time zone,
  notes text
);

-- Enable RLS on key management table
ALTER TABLE public.kyc_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can view key metadata (not actual keys!)
CREATE POLICY "Only admins can manage encryption keys"
ON public.kyc_encryption_keys
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'kx_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'kx_admin'::app_role));

-- Insert current key as version 1
INSERT INTO public.kyc_encryption_keys (version, key_identifier, is_active, notes)
VALUES (1, 'kyc_salt_2024', true, 'Initial encryption key')
ON CONFLICT (version) DO NOTHING;

-- 3. Enhanced encryption key derivation with version support
-- ===================================================================

CREATE OR REPLACE FUNCTION public.get_kyc_encryption_key(key_version integer DEFAULT NULL)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_identifier text;
  v_active_version integer;
BEGIN
  -- If no version specified, use the active key
  IF key_version IS NULL THEN
    SELECT version, key_identifier 
    INTO v_active_version, v_key_identifier
    FROM kyc_encryption_keys
    WHERE is_active = true
    ORDER BY version DESC
    LIMIT 1;
    
    IF v_key_identifier IS NULL THEN
      RAISE EXCEPTION 'No active encryption key found';
    END IF;
  ELSE
    -- Get specific key version
    SELECT key_identifier INTO v_key_identifier
    FROM kyc_encryption_keys
    WHERE version = key_version;
    
    IF v_key_identifier IS NULL THEN
      RAISE EXCEPTION 'Encryption key version % not found', key_version;
    END IF;
  END IF;
  
  -- Derive key from identifier + JWT secret
  -- In production, use vault.get_secret() or dedicated key management
  RETURN digest(
    current_setting('app.settings.jwt_secret', true) || v_key_identifier,
    'sha256'
  );
END;
$$;

-- 4. Update encryption function to use active key version
-- ===================================================================

CREATE OR REPLACE FUNCTION public.encrypt_kyc_data(data jsonb)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_version integer;
BEGIN
  IF data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get active key version
  SELECT version INTO v_active_version
  FROM kyc_encryption_keys
  WHERE is_active = true
  ORDER BY version DESC
  LIMIT 1;
  
  -- Encrypt with active key
  RETURN pgp_sym_encrypt(
    data::text,
    encode(get_kyc_encryption_key(v_active_version), 'hex')
  );
END;
$$;

-- 5. Enhanced decryption with fallback support
-- ===================================================================

CREATE OR REPLACE FUNCTION public.decrypt_kyc_data(
  encrypted_data bytea,
  key_version integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Try to decrypt with specified key version
  BEGIN
    RETURN pgp_sym_decrypt(
      encrypted_data,
      encode(get_kyc_encryption_key(key_version), 'hex')
    )::jsonb;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log decryption failures for monitoring
      RAISE WARNING 'KYC decryption failed for key version %: %', key_version, SQLERRM;
      RETURN NULL;
  END;
END;
$$;

-- 6. Update trigger to use active key and track version
-- ===================================================================

CREATE OR REPLACE FUNCTION public.kyc_encrypt_on_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_version integer;
BEGIN
  -- Get active key version
  SELECT version INTO v_active_version
  FROM kyc_encryption_keys
  WHERE is_active = true
  ORDER BY version DESC
  LIMIT 1;
  
  -- Encrypt the parsed field if it's being set
  IF NEW.parsed IS NOT NULL THEN
    NEW.parsed_encrypted := encrypt_kyc_data(NEW.parsed);
    NEW.encryption_key_version := v_active_version;
    NEW.needs_reencryption := false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Key rotation initiation function
-- ===================================================================

CREATE OR REPLACE FUNCTION public.initiate_key_rotation(
  new_key_identifier text,
  rotation_notes text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_version integer;
  v_old_version integer;
  v_records_to_rotate integer;
BEGIN
  -- Only admins can rotate keys
  IF NOT has_role(auth.uid(), 'kx_admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can rotate encryption keys';
  END IF;
  
  -- Get current active version
  SELECT version INTO v_old_version
  FROM kyc_encryption_keys
  WHERE is_active = true
  ORDER BY version DESC
  LIMIT 1;
  
  -- Create new key version
  v_new_version := v_old_version + 1;
  
  INSERT INTO kyc_encryption_keys (
    version, 
    key_identifier, 
    is_active, 
    rotation_started_at,
    notes
  )
  VALUES (
    v_new_version, 
    new_key_identifier, 
    true,
    now(),
    rotation_notes
  );
  
  -- Mark old key as deprecated
  UPDATE kyc_encryption_keys
  SET is_active = false,
      deprecated_at = now()
  WHERE version = v_old_version;
  
  -- Mark all records encrypted with old key for re-encryption
  UPDATE kyc_documents
  SET needs_reencryption = true
  WHERE encryption_key_version < v_new_version
    AND parsed_encrypted IS NOT NULL;
  
  GET DIAGNOSTICS v_records_to_rotate = ROW_COUNT;
  
  RAISE NOTICE 'Key rotation initiated: version % -> %. Records to rotate: %',
    v_old_version, v_new_version, v_records_to_rotate;
  
  RETURN v_new_version;
END;
$$;

-- 8. Gradual re-encryption function (batch processing)
-- ===================================================================

CREATE OR REPLACE FUNCTION public.rotate_kyc_encryption_batch(
  batch_size integer DEFAULT 100
)
RETURNS TABLE (
  rotated_count integer,
  remaining_count integer,
  rotation_complete boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_version integer;
  v_record RECORD;
  v_rotated integer := 0;
  v_remaining integer;
  v_decrypted_data jsonb;
BEGIN
  -- Get active key version
  SELECT version INTO v_active_version
  FROM kyc_encryption_keys
  WHERE is_active = true
  ORDER BY version DESC
  LIMIT 1;
  
  -- Process batch of records needing re-encryption
  FOR v_record IN
    SELECT id, parsed_encrypted, encryption_key_version
    FROM kyc_documents
    WHERE needs_reencryption = true
    ORDER BY updated_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      -- Decrypt with old key
      v_decrypted_data := decrypt_kyc_data(
        v_record.parsed_encrypted,
        v_record.encryption_key_version
      );
      
      IF v_decrypted_data IS NOT NULL THEN
        -- Re-encrypt with new key
        UPDATE kyc_documents
        SET parsed = v_decrypted_data,
            parsed_encrypted = encrypt_kyc_data(v_decrypted_data),
            encryption_key_version = v_active_version,
            needs_reencryption = false,
            updated_at = now()
        WHERE id = v_record.id;
        
        v_rotated := v_rotated + 1;
      ELSE
        -- Mark as failed for manual review
        RAISE WARNING 'Failed to decrypt record % with key version %', 
          v_record.id, v_record.encryption_key_version;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error rotating record %: %', v_record.id, SQLERRM;
    END;
  END LOOP;
  
  -- Count remaining records
  SELECT COUNT(*) INTO v_remaining
  FROM kyc_documents
  WHERE needs_reencryption = true;
  
  -- Mark rotation as complete if done
  IF v_remaining = 0 THEN
    UPDATE kyc_encryption_keys
    SET rotation_completed_at = now()
    WHERE version = v_active_version
      AND rotation_completed_at IS NULL;
  END IF;
  
  RETURN QUERY SELECT v_rotated, v_remaining, (v_remaining = 0);
END;
$$;

-- 9. Update decrypted view to use versioned decryption
-- ===================================================================

CREATE OR REPLACE VIEW public.kyc_documents_decrypted
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  doc_type,
  -- Decrypt using the key version stored with the record
  CASE 
    WHEN parsed_encrypted IS NOT NULL 
    THEN decrypt_kyc_data(parsed_encrypted, encryption_key_version)
    ELSE parsed
  END as parsed,
  confidence,
  status,
  image_path,
  created_at,
  updated_at,
  encryption_key_version,
  needs_reencryption
FROM public.kyc_documents;

-- 10. Monitoring and status functions
-- ===================================================================

-- Get rotation status
CREATE OR REPLACE FUNCTION public.get_key_rotation_status()
RETURNS TABLE (
  current_version integer,
  total_records bigint,
  rotated_records bigint,
  pending_records bigint,
  rotation_progress numeric,
  rotation_started timestamp with time zone,
  estimated_completion timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_version integer;
  v_started_at timestamp with time zone;
  v_total bigint;
  v_pending bigint;
  v_rotated bigint;
BEGIN
  -- Get active version
  SELECT version, rotation_started_at 
  INTO v_active_version, v_started_at
  FROM kyc_encryption_keys
  WHERE is_active = true
  ORDER BY version DESC
  LIMIT 1;
  
  -- Get counts
  SELECT COUNT(*) INTO v_total FROM kyc_documents;
  SELECT COUNT(*) INTO v_pending FROM kyc_documents WHERE needs_reencryption = true;
  v_rotated := v_total - v_pending;
  
  RETURN QUERY SELECT
    v_active_version,
    v_total,
    v_rotated,
    v_pending,
    CASE WHEN v_total > 0 
      THEN ROUND((v_rotated::numeric / v_total::numeric) * 100, 2)
      ELSE 100
    END as rotation_progress,
    v_started_at,
    CASE 
      WHEN v_pending > 0 AND v_rotated > 0
      THEN v_started_at + ((now() - v_started_at) * v_pending / v_rotated)
      ELSE NULL
    END as estimated_completion;
END;
$$;

-- 11. Grant permissions
-- ===================================================================

GRANT EXECUTE ON FUNCTION public.initiate_key_rotation TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_kyc_encryption_batch TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_key_rotation_status TO authenticated;

-- 12. Add security documentation
-- ===================================================================

COMMENT ON FUNCTION public.initiate_key_rotation IS 
'Admin-only: Initiates encryption key rotation. Creates new key version and marks all records for re-encryption.
Returns: New key version number.';

COMMENT ON FUNCTION public.rotate_kyc_encryption_batch IS 
'Processes a batch of KYC records for re-encryption with the new key.
Call repeatedly until rotation_complete = true for zero-downtime migration.
Returns: (rotated_count, remaining_count, rotation_complete)';

COMMENT ON FUNCTION public.get_key_rotation_status IS 
'Returns current status of encryption key rotation including progress percentage.';

COMMENT ON TABLE public.kyc_encryption_keys IS 
'Tracks encryption key versions for KYC data. Does NOT store actual keys.
Keys are derived from key_identifier + JWT secret.';

COMMENT ON COLUMN public.kyc_documents.encryption_key_version IS 
'Version of encryption key used for this record. Used for key rotation.';

COMMENT ON COLUMN public.kyc_documents.needs_reencryption IS 
'Flag indicating record needs re-encryption with current key version.';

-- 13. Create admin helper view
-- ===================================================================

CREATE OR REPLACE VIEW public.kyc_encryption_admin_status
WITH (security_invoker = true)
AS
SELECT
  k.version,
  k.key_identifier,
  k.is_active,
  k.created_at,
  k.deprecated_at,
  k.rotation_started_at,
  k.rotation_completed_at,
  COUNT(CASE WHEN d.encryption_key_version = k.version THEN 1 END) as records_with_this_key,
  COUNT(CASE WHEN d.encryption_key_version = k.version AND d.needs_reencryption THEN 1 END) as pending_rotation
FROM kyc_encryption_keys k
LEFT JOIN kyc_documents d ON true
GROUP BY k.version, k.key_identifier, k.is_active, k.created_at, k.deprecated_at, 
         k.rotation_started_at, k.rotation_completed_at
ORDER BY k.version DESC;

COMMENT ON VIEW public.kyc_encryption_admin_status IS 
'Admin view showing encryption key versions and rotation status.';

-- Final verification
DO $$
DECLARE
  v_total integer;
  v_encrypted integer;
BEGIN
  SELECT COUNT(*) INTO v_total FROM kyc_documents;
  SELECT COUNT(*) INTO v_encrypted FROM kyc_documents WHERE parsed_encrypted IS NOT NULL;
  
  RAISE NOTICE 'Key rotation system ready. Total KYC records: %, Encrypted: %', v_total, v_encrypted;
END $$;