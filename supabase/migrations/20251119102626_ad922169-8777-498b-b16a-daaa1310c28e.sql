-- Add current_session_token to profiles table
ALTER TABLE public.profiles 
ADD COLUMN current_session_token text;

-- Add index for faster lookups
CREATE INDEX idx_profiles_session_token ON public.profiles(current_session_token);

COMMENT ON COLUMN public.profiles.current_session_token IS 'Token representing the currently active device/session. Only one session per user is allowed.';