-- FINAL FIX: Drop all admin policies and recreate without recursion

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all driver profiles" ON driver_profiles;
DROP POLICY IF EXISTS "Admins can view all courier profiles" ON courier_profiles;

-- Create new policies that directly check user_roles table
-- This avoids recursion by NOT using has_role() function
CREATE POLICY "Admins can view all driver profiles"
  ON driver_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'kx_admin'
    )
  );

CREATE POLICY "Admins can view all courier profiles"
  ON courier_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'kx_admin'
    )
  );