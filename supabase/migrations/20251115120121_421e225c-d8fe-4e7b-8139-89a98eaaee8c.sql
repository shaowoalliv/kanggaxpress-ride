-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('passenger', 'driver');

-- Create enum for ride types
CREATE TYPE public.ride_type AS ENUM ('motor', 'tricycle', 'car');

-- Create enum for ride status
CREATE TYPE public.ride_status AS ENUM ('requested', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create driver_profiles table
CREATE TABLE public.driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  vehicle_type ride_type NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_model TEXT,
  vehicle_color TEXT,
  license_number TEXT,
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 5.00,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on driver_profiles
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

-- Driver profiles policies
CREATE POLICY "Drivers can view their own profile"
  ON public.driver_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update their own profile"
  ON public.driver_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can insert their own profile"
  ON public.driver_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Passengers can view available drivers"
  ON public.driver_profiles FOR SELECT
  USING (is_available = true);

-- Create rides table
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE SET NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  ride_type ride_type NOT NULL,
  status ride_status DEFAULT 'requested',
  fare_estimate DECIMAL(10, 2),
  fare_final DECIMAL(10, 2),
  passenger_count INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on rides
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Rides policies
CREATE POLICY "Passengers can view their own rides"
  ON public.rides FOR SELECT
  USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view rides assigned to them"
  ON public.rides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.driver_profiles
      WHERE driver_profiles.id = rides.driver_id
      AND driver_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can view available rides"
  ON public.rides FOR SELECT
  USING (status = 'requested' AND driver_id IS NULL);

CREATE POLICY "Passengers can create rides"
  ON public.rides FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Drivers can update rides assigned to them"
  ON public.rides FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.driver_profiles
      WHERE driver_profiles.id = rides.driver_id
      AND driver_profiles.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_profiles_updated_at
  BEFORE UPDATE ON public.driver_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'passenger')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();