-- Create app_role enum for admin roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('kx_admin', 'kx_moderator');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table for role assignments
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  unique (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'kx_admin'))
WITH CHECK (public.has_role(auth.uid(), 'kx_admin'));

-- Create fare_configs table
CREATE TABLE IF NOT EXISTS public.fare_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code text NOT NULL DEFAULT 'CALAPAN',
  service_type text NOT NULL CHECK (service_type IN ('TRICYCLE','MOTORCYCLE','CAR','SEND_PACKAGE')),
  base_fare numeric NOT NULL DEFAULT 20,
  per_km numeric NOT NULL DEFAULT 10,
  per_min numeric NOT NULL DEFAULT 0,
  min_fare numeric NOT NULL DEFAULT 40,
  platform_fee_type text NOT NULL DEFAULT 'FLAT' CHECK (platform_fee_type IN ('FLAT','PCT')),
  platform_fee_value numeric NOT NULL DEFAULT 5,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(region_code, service_type)
);

-- Index for fare lookups
CREATE INDEX IF NOT EXISTS fare_configs_region_service_idx 
ON public.fare_configs(region_code, service_type);

-- Enable RLS on fare_configs
ALTER TABLE public.fare_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies for fare_configs
CREATE POLICY "Anyone can view fare configs"
ON public.fare_configs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage fare configs"
ON public.fare_configs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'kx_admin'))
WITH CHECK (public.has_role(auth.uid(), 'kx_admin'));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_fare_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_fare_configs_timestamp
BEFORE UPDATE ON public.fare_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_fare_configs_updated_at();

-- Insert default fare configs
INSERT INTO public.fare_configs (region_code, service_type, base_fare, per_km, per_min, min_fare, platform_fee_type, platform_fee_value)
VALUES 
  ('CALAPAN', 'TRICYCLE', 20, 8, 0, 40, 'FLAT', 5),
  ('CALAPAN', 'MOTORCYCLE', 25, 10, 0, 50, 'FLAT', 5),
  ('CALAPAN', 'CAR', 40, 15, 2, 80, 'PCT', 10),
  ('CALAPAN', 'SEND_PACKAGE', 30, 12, 0, 60, 'FLAT', 8)
ON CONFLICT (region_code, service_type) DO NOTHING;