-- Fix encrypt_kyc_data to use fully qualified table name
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
  
  -- Get active key version with fully qualified table name
  SELECT version INTO v_active_version
  FROM public.kyc_encryption_keys
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

-- Fix kyc_encrypt_on_write trigger function
CREATE OR REPLACE FUNCTION public.kyc_encrypt_on_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_active_version integer;
BEGIN
  -- Get active key version with fully qualified table name
  SELECT version INTO v_active_version
  FROM public.kyc_encryption_keys
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