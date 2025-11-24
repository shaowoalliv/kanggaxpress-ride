-- Ensure kyc_encryption_keys table exists for KYC encryption
CREATE TABLE IF NOT EXISTS public.kyc_encryption_keys (
  version integer PRIMARY KEY,
  key_identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  notes text NULL,
  deprecated_at timestamptz NULL,
  is_active boolean NOT NULL DEFAULT false,
  rotation_completed_at timestamptz NULL,
  rotation_started_at timestamptz NULL
);

-- Ensure at least one active encryption key exists
INSERT INTO public.kyc_encryption_keys (version, key_identifier, is_active)
SELECT 1, 'default_kx_key_v1', true
WHERE NOT EXISTS (SELECT 1 FROM public.kyc_encryption_keys);
