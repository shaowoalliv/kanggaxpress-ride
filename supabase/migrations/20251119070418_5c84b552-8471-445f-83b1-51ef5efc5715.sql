-- Add location tracking to driver_profiles
ALTER TABLE driver_profiles
ADD COLUMN IF NOT EXISTS current_lat numeric,
ADD COLUMN IF NOT EXISTS current_lng numeric,
ADD COLUMN IF NOT EXISTS location_updated_at timestamp with time zone;

-- Add search tracking to rides table
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS search_radius numeric DEFAULT 200,
ADD COLUMN IF NOT EXISTS drivers_notified jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS max_radius_reached boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS proposals jsonb DEFAULT '[]'::jsonb;

-- Create index for faster geo-queries on driver location
CREATE INDEX IF NOT EXISTS idx_driver_profiles_location ON driver_profiles(current_lat, current_lng) WHERE is_available = true;

-- Create index for ride search tracking
CREATE INDEX IF NOT EXISTS idx_rides_search_status ON rides(status, search_radius);

-- Create function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 numeric, lng1 numeric,
  lat2 numeric, lng2 numeric
) RETURNS numeric AS $$
DECLARE
  earth_radius numeric := 6371000; -- Earth's radius in meters
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlng/2) * sin(dlng/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c; -- Distance in meters
END;
$$ LANGUAGE plpgsql IMMUTABLE;