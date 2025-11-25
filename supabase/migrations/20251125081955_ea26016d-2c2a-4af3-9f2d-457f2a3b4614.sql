
-- Fix infinite recursion in rides RLS policies (complete fix)
-- The issue: policies are still checking conditions that create recursion

-- Drop ALL existing policies on rides
DROP POLICY IF EXISTS "Passengers can create rides" ON rides;
DROP POLICY IF EXISTS "Passengers can view their own rides" ON rides;
DROP POLICY IF EXISTS "Drivers can view available rides" ON rides;
DROP POLICY IF EXISTS "Drivers can view rides assigned to them" ON rides;
DROP POLICY IF EXISTS "Drivers can update rides assigned to them" ON rides;
DROP POLICY IF EXISTS "Admins can view all rides" ON rides;

-- Create simple, non-recursive policies

-- 1. Passengers can INSERT their own rides (checked via passenger_id)
CREATE POLICY "Passengers can create rides"
  ON rides
  FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);

-- 2. Passengers can SELECT their own rides
CREATE POLICY "Passengers can view their own rides"
  ON rides
  FOR SELECT
  USING (auth.uid() = passenger_id);

-- 3. Drivers can SELECT available rides (requested, no driver assigned)
CREATE POLICY "Drivers can view available rides"
  ON rides
  FOR SELECT
  USING (
    status = 'requested'::ride_status 
    AND driver_id IS NULL
  );

-- 4. Drivers can SELECT rides assigned to them
CREATE POLICY "Drivers can view rides assigned to them"
  ON rides
  FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM driver_profiles WHERE user_id = auth.uid()
    )
  );

-- 5. Drivers can UPDATE rides assigned to them
CREATE POLICY "Drivers can update rides assigned to them"
  ON rides
  FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM driver_profiles WHERE user_id = auth.uid()
    )
  );

-- 6. Admins can SELECT all rides
CREATE POLICY "Admins can view all rides"
  ON rides
  FOR SELECT
  USING (has_role(auth.uid(), 'kx_admin'::app_role));
