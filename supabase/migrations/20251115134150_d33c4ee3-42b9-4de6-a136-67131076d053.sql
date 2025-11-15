-- Create KYC documents table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('GOVT_ID','PRIVATE_ID','DRIVER_LICENSE','OR','CR','SELFIE')),
  parsed jsonb NOT NULL,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','REVIEW','APPROVED','REJECTED')),
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS kyc_documents_user_type_idx ON public.kyc_documents(user_id, doc_type);
CREATE INDEX IF NOT EXISTS kyc_documents_parsed_gin ON public.kyc_documents USING gin (parsed);
CREATE INDEX IF NOT EXISTS kyc_documents_status_idx ON public.kyc_documents(status);

-- Enable RLS
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own documents
CREATE POLICY "Owner can read own KYC docs"
ON public.kyc_documents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS: Users can insert PENDING or REVIEW documents
CREATE POLICY "Owner insert PENDING or REVIEW only"
ON public.kyc_documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status IN ('PENDING','REVIEW'));

-- RLS: Users can update only while PENDING/REVIEW
CREATE POLICY "Owner update only while PENDING/REVIEW"
ON public.kyc_documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status IN ('PENDING','REVIEW'))
WITH CHECK (auth.uid() = user_id AND status IN ('PENDING','REVIEW'));

-- RLS: Admins can manage all KYC documents
CREATE POLICY "Admin can manage all KYC docs"
ON public.kyc_documents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'kx_admin'))
WITH CHECK (public.has_role(auth.uid(), 'kx_admin'));

-- Trigger to update updated_at
CREATE TRIGGER update_kyc_documents_updated_at
BEFORE UPDATE ON public.kyc_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();