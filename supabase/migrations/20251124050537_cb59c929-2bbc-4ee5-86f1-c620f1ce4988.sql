-- Drop the previous view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.available_drivers_safe;

-- Create the view with SECURITY INVOKER (default, safer)
CREATE VIEW public.available_drivers_safe 
WITH (security_invoker = true) AS
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

-- RLS policy for the view - allow authenticated users to see it
CREATE POLICY "Authenticated users can view available drivers"
ON public.driver_profiles
FOR SELECT
TO authenticated
USING (
  is_available = true 
  AND current_lat IS NOT NULL 
  AND current_lng IS NOT NULL
);

-- But limit what columns they can actually see through application logic