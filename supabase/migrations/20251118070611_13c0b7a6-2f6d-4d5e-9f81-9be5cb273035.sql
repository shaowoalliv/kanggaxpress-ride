-- Create fare_settings table for base fares per service
CREATE TABLE IF NOT EXISTS public.fare_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  base_fare NUMERIC NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default fare settings
INSERT INTO public.fare_settings (service_type, display_name, base_fare, is_active) VALUES
  ('MOTOR', 'Motorcycle', 40, true),
  ('TRICYCLE', 'Tricycle', 50, true),
  ('CAR', 'Car', 80, true),
  ('DELIVERY', 'Send Package', 45, true)
ON CONFLICT (service_type) DO NOTHING;

-- Create platform_settings table for app-wide settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value NUMERIC NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default platform fee
INSERT INTO public.platform_settings (setting_key, setting_value, description) VALUES
  ('app_usage_fee', 5, 'KanggaXpress app usage fee per completed ride')
ON CONFLICT (setting_key) DO NOTHING;

-- Add new fare fields to rides table
ALTER TABLE public.rides 
ADD COLUMN IF NOT EXISTS base_fare NUMERIC,
ADD COLUMN IF NOT EXISTS top_up_fare NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_fare NUMERIC,
ADD COLUMN IF NOT EXISTS app_fee NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS pickup_lat NUMERIC,
ADD COLUMN IF NOT EXISTS pickup_lng NUMERIC,
ADD COLUMN IF NOT EXISTS dropoff_lat NUMERIC,
ADD COLUMN IF NOT EXISTS dropoff_lng NUMERIC;

-- Add new fare fields to delivery_orders table
ALTER TABLE public.delivery_orders
ADD COLUMN IF NOT EXISTS base_fare NUMERIC,
ADD COLUMN IF NOT EXISTS top_up_fare NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_fare NUMERIC,
ADD COLUMN IF NOT EXISTS app_fee NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS pickup_lat NUMERIC,
ADD COLUMN IF NOT EXISTS pickup_lng NUMERIC,
ADD COLUMN IF NOT EXISTS dropoff_lat NUMERIC,
ADD COLUMN IF NOT EXISTS dropoff_lng NUMERIC;

-- Enable RLS on fare_settings
ALTER TABLE public.fare_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view fare settings
CREATE POLICY "Anyone can view fare settings"
  ON public.fare_settings
  FOR SELECT
  USING (true);

-- Only admins can manage fare settings
CREATE POLICY "Admins can manage fare settings"
  ON public.fare_settings
  FOR ALL
  USING (has_role(auth.uid(), 'kx_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'kx_admin'::app_role));

-- Enable RLS on platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view platform settings
CREATE POLICY "Anyone can view platform settings"
  ON public.platform_settings
  FOR SELECT
  USING (true);

-- Only admins can manage platform settings
CREATE POLICY "Admins can manage platform settings"
  ON public.platform_settings
  FOR ALL
  USING (has_role(auth.uid(), 'kx_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'kx_admin'::app_role));

-- Create trigger for fare_settings updated_at
CREATE OR REPLACE FUNCTION public.update_fare_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_fare_settings_updated_at
  BEFORE UPDATE ON public.fare_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fare_settings_updated_at();

-- Create trigger for platform_settings updated_at
CREATE OR REPLACE FUNCTION public.update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_platform_settings_updated_at();