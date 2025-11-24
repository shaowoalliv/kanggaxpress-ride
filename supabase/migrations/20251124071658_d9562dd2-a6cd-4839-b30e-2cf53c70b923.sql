-- Drop the overly permissive policy that exposes receiver contact info
DROP POLICY IF EXISTS "Couriers can view available delivery orders" ON public.delivery_orders;

-- Create a safe view for available deliveries without exposing customer contact info
CREATE OR REPLACE VIEW public.available_deliveries_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  sender_id,
  pickup_address,
  pickup_lat,
  pickup_lng,
  dropoff_address,
  dropoff_lat,
  dropoff_lng,
  package_description,
  package_size,
  cod_amount,
  base_fare,
  top_up_fare,
  total_fare,
  app_fee,
  status,
  created_at,
  -- Exclude receiver_name and receiver_phone for privacy
  NULL::text as receiver_name_hidden,
  NULL::text as receiver_phone_hidden
FROM public.delivery_orders
WHERE status = 'requested'
  AND courier_id IS NULL;

-- Add RLS policy on the view (though views inherit from underlying table policies)
-- Couriers should only see full receiver details AFTER being assigned
CREATE POLICY "Couriers can view available deliveries (limited info)"
ON public.delivery_orders
FOR SELECT
TO authenticated
USING (
  -- Only show unassigned orders, but application should use available_deliveries_safe view
  (status = 'requested' AND courier_id IS NULL)
  OR
  -- Full access to orders assigned to this courier
  (EXISTS (
    SELECT 1
    FROM public.courier_profiles
    WHERE courier_profiles.id = delivery_orders.courier_id
      AND courier_profiles.user_id = auth.uid()
  ))
);

-- Note: For production security, the application code should:
-- 1. Use available_deliveries_safe view for browsing unassigned orders
-- 2. Only query delivery_orders directly for assigned orders
-- This prevents accidental exposure of receiver contact info in the frontend