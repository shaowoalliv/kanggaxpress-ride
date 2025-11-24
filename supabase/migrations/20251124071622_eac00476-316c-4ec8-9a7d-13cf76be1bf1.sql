-- Recreate the view without SECURITY DEFINER to fix the security warning
-- This view is SECURITY INVOKER by default, which is the secure option
DROP VIEW IF EXISTS public.available_couriers_safe;

CREATE VIEW public.available_couriers_safe 
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  vehicle_type,
  rating,
  total_deliveries,
  is_available,
  -- Round coordinates to ~1km precision (2 decimal places) for privacy
  ROUND(current_lat::numeric, 2) as approximate_lat,
  ROUND(current_lng::numeric, 2) as approximate_lng,
  location_updated_at
FROM public.courier_profiles
WHERE is_available = true
  AND current_lat IS NOT NULL
  AND current_lng IS NOT NULL
  AND location_updated_at > NOW() - INTERVAL '10 minutes';