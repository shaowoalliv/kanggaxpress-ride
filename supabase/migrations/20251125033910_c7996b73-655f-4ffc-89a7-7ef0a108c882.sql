-- Initialize KYC encryption keys table with first version
INSERT INTO public.kyc_encryption_keys (version, key_identifier, is_active, notes)
VALUES (1, 'kyc_key_v1_2024', true, 'Initial encryption key for KYC documents')
ON CONFLICT (version) DO NOTHING;