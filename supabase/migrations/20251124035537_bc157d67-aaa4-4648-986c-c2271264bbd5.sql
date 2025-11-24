-- Create provinces table
CREATE TABLE IF NOT EXISTS public.provinces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cities table with geofencing
CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  province_id uuid NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  geofence_lat numeric NOT NULL,
  geofence_lng numeric NOT NULL,
  geofence_radius_km numeric NOT NULL DEFAULT 15,
  is_active boolean NOT NULL DEFAULT false,
  activation_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, province_id)
);

-- Add city_id to fare_configs and make region_code nullable for migration
ALTER TABLE public.fare_configs 
ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provinces
CREATE POLICY "Anyone can view provinces"
  ON public.provinces FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage provinces"
  ON public.provinces FOR ALL
  USING (has_role(auth.uid(), 'kx_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'kx_admin'::app_role));

-- RLS Policies for cities
CREATE POLICY "Anyone can view active cities"
  ON public.cities FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all cities"
  ON public.cities FOR SELECT
  USING (has_role(auth.uid(), 'kx_admin'::app_role));

CREATE POLICY "Admins can manage cities"
  ON public.cities FOR ALL
  USING (has_role(auth.uid(), 'kx_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'kx_admin'::app_role));

-- Function to check if coordinates are within any active city's geofence
CREATE OR REPLACE FUNCTION public.is_within_service_area(
  p_lat numeric,
  p_lng numeric
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_distance numeric;
  v_city_active boolean;
BEGIN
  -- Check if coordinates fall within any active city's geofence
  SELECT EXISTS (
    SELECT 1
    FROM public.cities c
    INNER JOIN public.provinces p ON c.province_id = p.id
    WHERE c.is_active = true 
      AND p.is_active = true
      AND calculate_distance(p_lat, p_lng, c.geofence_lat, c.geofence_lng) <= (c.geofence_radius_km * 1000)
  ) INTO v_city_active;
  
  RETURN v_city_active;
END;
$$;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_provinces_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_cities_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS update_provinces_updated_at ON public.provinces;
CREATE TRIGGER update_provinces_updated_at
  BEFORE UPDATE ON public.provinces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provinces_updated_at();

DROP TRIGGER IF EXISTS update_cities_updated_at ON public.cities;
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cities_updated_at();

-- Create index for geofence queries
CREATE INDEX IF NOT EXISTS idx_cities_active ON public.cities(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cities_province ON public.cities(province_id);
CREATE INDEX IF NOT EXISTS idx_cities_geofence ON public.cities(geofence_lat, geofence_lng);