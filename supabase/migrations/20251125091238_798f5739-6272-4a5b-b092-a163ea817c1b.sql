-- Fix RLS so drivers can accept and manage rides

-- Drop the old overly-restrictive / incorrect UPDATE policy
DROP POLICY IF EXISTS "Update own rides" ON public.rides;

-- Passengers can update only their own rides
CREATE POLICY "Passengers can update their own rides"
ON public.rides
FOR UPDATE
USING (passenger_id = auth.uid())
WITH CHECK (passenger_id = auth.uid());

-- Drivers can accept requested rides and manage rides assigned to them
CREATE POLICY "Drivers can accept and manage assigned rides"
ON public.rides
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.driver_profiles dp
    WHERE dp.user_id = auth.uid()
      AND (dp.id = rides.driver_id OR rides.driver_id IS NULL)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.driver_profiles dp
    WHERE dp.user_id = auth.uid()
      AND dp.id = rides.driver_id
  )
);