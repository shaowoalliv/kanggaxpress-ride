
-- Drop ALL existing policies on driver_profiles and courier_profiles
DROP POLICY IF EXISTS "Admins can view all driver profiles" ON driver_profiles;
DROP POLICY IF EXISTS "Admins can manage all driver profiles" ON driver_profiles;
DROP POLICY IF EXISTS "Users can view own driver profile" ON driver_profiles;
DROP POLICY IF EXISTS "Users can update own driver profile" ON driver_profiles;
DROP POLICY IF EXISTS "Drivers can view own profile" ON driver_profiles;
DROP POLICY IF EXISTS "Drivers can update own profile" ON driver_profiles;

DROP POLICY IF EXISTS "Admins can view all courier profiles" ON courier_profiles;
DROP POLICY IF EXISTS "Admins can manage all courier profiles" ON courier_profiles;
DROP POLICY IF EXISTS "Users can view own courier profile" ON courier_profiles;
DROP POLICY IF EXISTS "Users can update own courier profile" ON courier_profiles;
DROP POLICY IF EXISTS "Couriers can view own profile" ON courier_profiles;
DROP POLICY IF EXISTS "Couriers can update own profile" ON courier_profiles;

-- Create simple admin-only policies without recursion
CREATE POLICY "Admin full access to driver profiles"
ON driver_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'kx_admin'
  )
);

CREATE POLICY "Admin full access to courier profiles"
ON courier_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'kx_admin'
  )
);

-- Add policies for users to access their own profiles
CREATE POLICY "Users can view own driver profile"
ON driver_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own driver profile"
ON driver_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view own courier profile"
ON courier_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own courier profile"
ON courier_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
