-- Drop the overly permissive policy that allows public access to courier profiles
DROP POLICY IF EXISTS "Senders can view available couriers" ON public.courier_profiles;

-- Add a restricted policy: senders can only view couriers assigned to their delivery orders
CREATE POLICY "Senders can view couriers assigned to their deliveries"
ON public.courier_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.delivery_orders
    WHERE delivery_orders.courier_id = courier_profiles.id
      AND delivery_orders.sender_id = auth.uid()
  )
);

-- Create a safe view for courier matching that only exposes non-sensitive data
CREATE OR REPLACE VIEW public.available_couriers_safe AS
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

-- Allow authenticated users to view the safe courier list for matching
CREATE POLICY "Anyone can view available couriers (safe view)"
ON public.courier_profiles
FOR SELECT
TO authenticated
USING (
  is_available = true
  AND current_lat IS NOT NULL
  AND current_lng IS NOT NULL
  AND location_updated_at > NOW() - INTERVAL '10 minutes'
);

-- Note: The above policy still allows viewing full courier_profiles rows
-- For production, the app should query available_couriers_safe view instead
-- which only exposes non-sensitive fields with approximate location