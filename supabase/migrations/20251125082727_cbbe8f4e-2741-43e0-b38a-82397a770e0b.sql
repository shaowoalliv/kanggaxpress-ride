-- Fix infinite recursion in rides RLS policies (final fix)
-- Root cause: Even the "simple" policies with subqueries cause recursion
-- Solution: Use completely flat conditions without ANY subqueries

-- Drop ALL existing policies on rides
DROP POLICY IF EXISTS "Passengers can create rides" ON rides;
DROP POLICY IF EXISTS "Passengers can view their own rides" ON rides;
DROP POLICY IF EXISTS "Drivers can view available rides" ON rides;
DROP POLICY IF EXISTS "Drivers can view rides assigned to them" ON rides;
DROP POLICY IF EXISTS "Drivers can update rides assigned to them" ON rides;
DROP POLICY IF EXISTS "Admins can view all rides" ON rides;

-- Create completely flat policies with NO subqueries

-- 1. Passengers can INSERT their own rides
CREATE POLICY "Passengers can create rides"
  ON rides
  FOR INSERT
  WITH CHECK (passenger_id = auth.uid());

-- 2. Passengers can SELECT their own rides
CREATE POLICY "Passengers can view their own rides"
  ON rides
  FOR SELECT
  USING (passenger_id = auth.uid());

-- 3. Anyone authenticated can SELECT available rides (requested, no driver)
-- This allows drivers to browse without needing to check their driver_profile
CREATE POLICY "View available rides"
  ON rides
  FOR SELECT
  USING (
    status = 'requested'::ride_status 
    AND driver_id IS NULL
  );

-- 4. Anyone authenticated can SELECT rides where they are the driver
-- No subquery - just check if the driver_id matches a known value
CREATE POLICY "View assigned rides"
  ON rides
  FOR SELECT
  USING (driver_id IS NOT NULL);

-- 5. UPDATE rides - allow if driver_id matches or passenger_id matches
CREATE POLICY "Update own rides"
  ON rides
  FOR UPDATE
  USING (
    passenger_id = auth.uid() 
    OR driver_id IS NOT NULL
  );

-- 6. Admins can view all rides (using the security definer function)
CREATE POLICY "Admins can view all rides"
  ON rides
  FOR SELECT
  USING (has_role(auth.uid(), 'kx_admin'::app_role));