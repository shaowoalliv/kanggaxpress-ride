-- Create passenger_ratings table
CREATE TABLE public.passenger_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ride_id, driver_id)
);

-- Enable RLS
ALTER TABLE public.passenger_ratings ENABLE ROW LEVEL SECURITY;

-- Drivers can insert ratings for their completed rides
CREATE POLICY "Drivers can insert ratings for their passengers"
ON public.passenger_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = driver_id
  AND EXISTS (
    SELECT 1 FROM public.rides
    WHERE rides.id = passenger_ratings.ride_id
    AND rides.driver_id IN (
      SELECT id FROM public.driver_profiles WHERE user_id = auth.uid()
    )
    AND rides.status = 'completed'
  )
);

-- Drivers can view ratings they submitted
CREATE POLICY "Drivers can view their own ratings"
ON public.passenger_ratings
FOR SELECT
TO authenticated
USING (auth.uid() = driver_id);

-- Passengers can view ratings they received
CREATE POLICY "Passengers can view ratings they received"
ON public.passenger_ratings
FOR SELECT
TO authenticated
USING (auth.uid() = passenger_id);

-- Admins can view all ratings
CREATE POLICY "Admins can view all passenger ratings"
ON public.passenger_ratings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'kx_admin'));

-- Create trigger to update updated_at
CREATE TRIGGER update_passenger_ratings_updated_at
BEFORE UPDATE ON public.passenger_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();