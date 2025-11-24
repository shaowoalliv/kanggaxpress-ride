-- ===================================================================
-- FIX CRITICAL SECURITY ISSUES
-- 1. Profiles table - prevent unauthorized access
-- 2. KYC documents decrypted view - add RLS policies
-- ===================================================================

-- 1. PROFILES TABLE - STRICTER ACCESS CONTROL
-- ===================================================================

-- Drop all existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Prevent cross-user profile access" ON public.profiles;

-- Explicitly block anonymous/public access
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- Users can only SELECT their own profile
CREATE POLICY "Users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can only INSERT their own profile
CREATE POLICY "Users can insert only their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can only UPDATE their own profile
CREATE POLICY "Users can update only their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins have full access to all profiles
CREATE POLICY "Admins have full access to all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'kx_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'kx_admin'::app_role));

-- Add security documentation
COMMENT ON TABLE public.profiles IS 
'User profiles containing PII (email, phone, full_name, account_number).
SECURITY: RLS enforced. Users can only access their own profile. Admins can access all.
Anonymous access explicitly blocked.';

-- 2. KYC DOCUMENTS DECRYPTED VIEW - ADD RLS PROTECTION
-- ===================================================================

-- Note: Views in PostgreSQL don't have RLS by default, they inherit from underlying tables
-- However, we need to ensure the view is created with proper security settings

-- Recreate view with security_invoker to enforce RLS from underlying table
DROP VIEW IF EXISTS public.kyc_documents_decrypted;

CREATE VIEW public.kyc_documents_decrypted
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

-- Add security documentation for the view
COMMENT ON VIEW public.kyc_documents_decrypted IS 
'Secure view that automatically decrypts KYC documents.
SECURITY: security_invoker=true ensures RLS policies from kyc_documents table are enforced.
Access restricted to document owners and admins only via underlying table RLS policies.';

-- 3. VERIFY KYC_DOCUMENTS TABLE HAS PROPER RLS
-- ===================================================================

-- The kyc_documents table should already have these policies, but let's verify and strengthen them

-- Drop and recreate to ensure they're correct
DROP POLICY IF EXISTS "Admin can manage all KYC docs" ON public.kyc_documents;
DROP POLICY IF EXISTS "Owner can read own KYC docs" ON public.kyc_documents;
DROP POLICY IF EXISTS "Owner insert PENDING or REVIEW only" ON public.kyc_documents;
DROP POLICY IF EXISTS "Owner update only while PENDING/REVIEW" ON public.kyc_documents;
DROP POLICY IF EXISTS "Owner or Admin can delete KYC docs" ON public.kyc_documents;

-- Block anonymous access to KYC documents
CREATE POLICY "Block anonymous access to KYC docs"
ON public.kyc_documents
FOR ALL
TO anon
USING (false);

-- Owner can SELECT their own KYC documents
CREATE POLICY "Owner can view own KYC docs"
ON public.kyc_documents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Owner can INSERT their own KYC docs (only PENDING or REVIEW status)
CREATE POLICY "Owner can insert own KYC docs"
ON public.kyc_documents
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND status IN ('PENDING', 'REVIEW')
);

-- Owner can UPDATE their own docs only while PENDING/REVIEW
CREATE POLICY "Owner can update own KYC docs while pending"
ON public.kyc_documents
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND status IN ('PENDING', 'REVIEW')
)
WITH CHECK (
  auth.uid() = user_id 
  AND status IN ('PENDING', 'REVIEW')
);

-- Owner or Admin can DELETE KYC docs
CREATE POLICY "Owner or Admin can delete KYC docs"
ON public.kyc_documents
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'kx_admin'::app_role)
);

-- Admins have full access to all KYC documents
CREATE POLICY "Admins have full access to KYC docs"
ON public.kyc_documents
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'kx_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'kx_admin'::app_role));

-- 4. VERIFY RLS IS ENABLED
-- ===================================================================

DO $$
BEGIN
  -- Verify profiles table has RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on profiles table!';
  END IF;
  
  -- Verify kyc_documents table has RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'kyc_documents' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on kyc_documents table!';
  END IF;
  
  RAISE NOTICE 'Security hardening complete: RLS verified on profiles and kyc_documents';
END $$;

-- 5. ADDITIONAL SECURITY MEASURES
-- ===================================================================

-- Ensure service role bypasses RLS (for admin functions)
-- This is default behavior, but we document it for clarity
COMMENT ON TABLE public.profiles IS 
'SECURITY MODEL:
- Anonymous users: NO ACCESS (explicitly blocked)
- Authenticated users: Can only view/edit their OWN profile
- Admins (kx_admin role): Full access to all profiles
- Service role: Bypasses RLS for system operations';

COMMENT ON TABLE public.kyc_documents IS 
'SECURITY MODEL:
- Anonymous users: NO ACCESS (explicitly blocked)
- Document owners: Can view/edit their own documents (PENDING/REVIEW status only)
- Admins (kx_admin role): Full access to all documents
- Decryption: Automatic via kyc_documents_decrypted view using versioned keys
- Storage: Encrypted at rest using pgcrypto AES-256';

-- Final security audit
DO $$
DECLARE
  v_profiles_policies integer;
  v_kyc_policies integer;
BEGIN
  -- Count policies on profiles
  SELECT COUNT(*) INTO v_profiles_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles';
  
  -- Count policies on kyc_documents
  SELECT COUNT(*) INTO v_kyc_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'kyc_documents';
  
  RAISE NOTICE 'Profiles table has % RLS policies', v_profiles_policies;
  RAISE NOTICE 'KYC documents table has % RLS policies', v_kyc_policies;
  
  IF v_profiles_policies < 4 THEN
    RAISE WARNING 'Profiles table should have at least 4 policies';
  END IF;
  
  IF v_kyc_policies < 6 THEN
    RAISE WARNING 'KYC documents table should have at least 6 policies';
  END IF;
END $$;