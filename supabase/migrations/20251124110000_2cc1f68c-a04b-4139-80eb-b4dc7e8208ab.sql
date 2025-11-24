-- Recreate encrypt_kyc_data with proper schema search path
CREATE OR REPLACE FUNCTION public.encrypt_kyc_data(data jsonb)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, extensions'
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
  
  -- Encrypt with active key using pgcrypto from extensions schema
  RETURN pgp_sym_encrypt(
    data::text,
    encode(get_kyc_encryption_key(v_active_version), 'hex')
  );
END;
$$;