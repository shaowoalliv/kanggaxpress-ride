-- Fix infinite recursion in rides RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Passengers can create rides" ON rides;
DROP POLICY IF EXISTS "Passengers can view their own rides" ON rides;
DROP POLICY IF EXISTS "Drivers can view available rides" ON rides;
DROP POLICY IF EXISTS "Drivers can view rides assigned to them" ON rides;
DROP POLICY IF EXISTS "Drivers can update rides assigned to them" ON rides;
DROP POLICY IF EXISTS "Admins can view all rides" ON rides;

-- Recreate policies without recursion
CREATE POLICY "Passengers can create rides"
  ON rides
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Passengers can view their own rides"
  ON rides
  FOR SELECT
  TO authenticated
  USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view available rides"
  ON rides
  FOR SELECT
  TO authenticated
  USING (
    status = 'requested' 
    AND driver_id IS NULL
  );

CREATE POLICY "Drivers can view rides assigned to them"
  ON rides
  FOR SELECT
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM driver_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can update rides assigned to them"
  ON rides
  FOR UPDATE
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM driver_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all rides"
  ON rides
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'kx_admin'::app_role));