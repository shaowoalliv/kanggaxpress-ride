-- Create ride_ratings table for driver ratings and reviews
CREATE TABLE public.ride_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ride_id) -- One rating per ride
);

-- Enable RLS
ALTER TABLE public.ride_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Passengers can insert ratings for their own rides"
ON public.ride_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = passenger_id AND
  EXISTS (
    SELECT 1 FROM public.rides
    WHERE rides.id = ride_id
    AND rides.passenger_id = auth.uid()
    AND rides.status = 'completed'
  )
);

CREATE POLICY "Passengers can view their own ratings"
ON public.ride_ratings
FOR SELECT
TO authenticated
USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view ratings for their rides"
ON public.ride_ratings
FOR SELECT
TO authenticated
USING (auth.uid() = driver_id);

CREATE POLICY "Admins can view all ratings"
ON public.ride_ratings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'kx_admin'::app_role));

-- Create function to update driver average rating
CREATE OR REPLACE FUNCTION public.update_driver_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_profile_id UUID;
  v_avg_rating NUMERIC;
  v_total_ratings INTEGER;
BEGIN
  -- Get driver profile id
  SELECT dp.id INTO v_driver_profile_id
  FROM public.driver_profiles dp
  WHERE dp.user_id = NEW.driver_id;

  IF v_driver_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate new average rating and count
  SELECT 
    AVG(rating)::NUMERIC(3,2),
    COUNT(*)
  INTO v_avg_rating, v_total_ratings
  FROM public.ride_ratings
  WHERE driver_id = NEW.driver_id;

  -- Update driver profile
  UPDATE public.driver_profiles
  SET 
    rating = v_avg_rating,
    total_rides = v_total_ratings,
    updated_at = now()
  WHERE id = v_driver_profile_id;

  RETURN NEW;
END;
$$;

-- Create trigger to update driver rating automatically
CREATE TRIGGER update_driver_rating_trigger
AFTER INSERT OR UPDATE ON public.ride_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_driver_rating();

-- Create trigger for updated_at
CREATE TRIGGER update_ride_ratings_updated_at
BEFORE UPDATE ON public.ride_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_ride_ratings_driver_id ON public.ride_ratings(driver_id);
CREATE INDEX idx_ride_ratings_passenger_id ON public.ride_ratings(passenger_id);
CREATE INDEX idx_ride_ratings_ride_id ON public.ride_ratings(ride_id);