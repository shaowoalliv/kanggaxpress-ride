-- Fix search_path for calculate_distance function
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
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;