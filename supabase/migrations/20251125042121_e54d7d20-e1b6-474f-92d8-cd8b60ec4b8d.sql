-- Add admin policy for courier_profiles (it's missing!)
CREATE POLICY "Admins can view all courier profiles"
  ON courier_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'kx_admin'
    )
  );