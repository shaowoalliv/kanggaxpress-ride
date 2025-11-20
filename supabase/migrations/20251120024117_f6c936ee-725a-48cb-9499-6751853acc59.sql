-- Allow admins to view all user profiles for management features like wallet search
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'kx_admin'::app_role));