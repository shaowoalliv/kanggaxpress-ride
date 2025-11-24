-- Allow admins to view all rides for dashboard analytics
CREATE POLICY "Admins can view all rides"
ON public.rides
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'kx_admin'::app_role));

-- Allow admins to view all delivery orders for dashboard analytics
CREATE POLICY "Admins can view all delivery orders"
ON public.delivery_orders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'kx_admin'::app_role));