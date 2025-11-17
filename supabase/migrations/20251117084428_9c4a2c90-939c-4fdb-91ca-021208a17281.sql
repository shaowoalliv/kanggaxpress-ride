-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for requesting reset)
CREATE POLICY "Anyone can request password reset"
ON public.password_reset_tokens
FOR INSERT
WITH CHECK (true);

-- Policy: Only the service role can read/update
CREATE POLICY "Service role can manage tokens"
ON public.password_reset_tokens
FOR ALL
USING (auth.role() = 'service_role');

-- Add index for faster lookups
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens(email);