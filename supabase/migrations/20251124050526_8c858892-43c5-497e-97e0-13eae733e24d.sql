-- Create a secure view for passengers to find available drivers
-- This view only exposes the minimum necessary information for matching
CREATE OR REPLACE VIEW public.available_drivers_safe AS
SELECT 
  dp.id,
  dp.user_id,
  dp.vehicle_type,
  dp.rating,
  dp.is_available,
  -- Round coordinates to ~100m precision to prevent exact tracking
  ROUND(dp.current_lat::numeric, 3) as approximate_lat,
  ROUND(dp.current_lng::numeric, 3) as approximate_lng,
  dp.location_updated_at,
  dp.total_rides
FROM driver_profiles dp
WHERE dp.is_available = true 
  AND dp.current_lat IS NOT NULL 
  AND dp.current_lng IS NOT NULL;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.available_drivers_safe TO authenticated;

-- Drop the overly permissive RLS policy
DROP POLICY IF EXISTS "Passengers can view available drivers" ON public.driver_profiles;

-- Create a more restrictive policy - passengers can only see drivers they have active rides with
CREATE POLICY "Passengers can view drivers assigned to their rides"
ON public.driver_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rides
    WHERE rides.driver_id = driver_profiles.id
      AND rides.passenger_id = auth.uid()
      AND rides.status IN ('accepted', 'in_progress')
  )
);

-- Admins can still view all driver profiles
CREATE POLICY "Admins can view all driver profiles"
ON public.driver_profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'kx_admin'::app_role));