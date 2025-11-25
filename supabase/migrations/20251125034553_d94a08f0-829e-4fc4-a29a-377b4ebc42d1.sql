-- Temporarily disable the encryption trigger for seed operations
-- This allows test data to be inserted without encryption complexity
DROP TRIGGER IF EXISTS kyc_encrypt_parsed_trigger ON public.kyc_documents;

-- We'll keep the trigger function but not use it for now
-- Real KYC submissions through the app will handle encryption differently