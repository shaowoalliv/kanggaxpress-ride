-- Allow all logged-in users to read driver and courier profiles (test environment convenience)
CREATE POLICY "Authenticated users can view driver profiles (test-wide)"
ON public.driver_profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view courier profiles (test-wide)"
ON public.courier_profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);