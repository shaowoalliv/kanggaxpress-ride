-- Enable RLS on the underlying driver_profiles table (already done)
-- Views inherit RLS from their base tables

-- Ensure the view uses security invoker mode
-- This makes the view use the permissions of the calling user
ALTER VIEW public.available_drivers_safe SET (security_invoker = on);

-- Grant SELECT on the view to authenticated users only
REVOKE SELECT ON public.available_drivers_safe FROM anon;
GRANT SELECT ON public.available_drivers_safe TO authenticated;