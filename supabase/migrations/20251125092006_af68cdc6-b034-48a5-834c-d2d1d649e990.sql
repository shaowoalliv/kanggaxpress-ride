-- Adjust RLS on rides to allow drivers to accept and manage rides without violating policies

-- Remove the previous update policies we added
DROP POLICY IF EXISTS "Passengers can update their own rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can accept and manage assigned rides" ON public.rides;

-- Passengers can update only their own rides (for cancelling, etc.)
CREATE POLICY "Passengers can update their own rides"
ON public.rides
FOR UPDATE
USING (passenger_id = auth.uid())
WITH CHECK (passenger_id = auth.uid());

-- Drivers can ACCEPT rides: from requested + no driver to assigned
CREATE POLICY "Drivers can accept rides"
ON public.rides
FOR UPDATE
USING (
  -- Must be a driver (has a driver_profile row)
  EXISTS (
    SELECT 1 FROM public.driver_profiles dp
    WHERE dp.user_id = auth.uid()
  )
  AND status = 'requested'
  AND driver_id IS NULL
)
-- After update, we just require that the user is still a driver
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.driver_profiles dp
    WHERE dp.user_id = auth.uid()
  )
);

-- Drivers can manage rides that are ALREADY assigned to them (status changes)
CREATE POLICY "Drivers can manage assigned rides"
ON public.rides
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.driver_profiles dp
    WHERE dp.user_id = auth.uid()
      AND dp.id = driver_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.driver_profiles dp
    WHERE dp.user_id = auth.uid()
      AND dp.id = driver_id
  )
);
