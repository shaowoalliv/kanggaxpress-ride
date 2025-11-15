-- Extend user roles to include delivery roles
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'sender';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'courier';

-- Create enum for package sizes
CREATE TYPE public.package_size AS ENUM ('small', 'medium', 'large');

-- Create enum for delivery status
CREATE TYPE public.delivery_status AS ENUM ('requested', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled');

-- Create courier_profiles table (similar to driver_profiles)
CREATE TABLE public.courier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  vehicle_type ride_type NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_model TEXT,
  vehicle_color TEXT,
  license_number TEXT,
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 5.00,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on courier_profiles
ALTER TABLE public.courier_profiles ENABLE ROW LEVEL SECURITY;

-- Courier profiles policies
CREATE POLICY "Couriers can view their own profile"
  ON public.courier_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Couriers can update their own profile"
  ON public.courier_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Couriers can insert their own profile"
  ON public.courier_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Senders can view available couriers"
  ON public.courier_profiles FOR SELECT
  USING (is_available = true);

-- Create delivery_orders table
CREATE TABLE public.delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  courier_id UUID REFERENCES public.courier_profiles(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  package_description TEXT NOT NULL,
  package_size package_size NOT NULL,
  cod_amount DECIMAL(10, 2),
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  status delivery_status DEFAULT 'requested',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on delivery_orders
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

-- Delivery orders policies
CREATE POLICY "Senders can view their own delivery orders"
  ON public.delivery_orders FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Couriers can view delivery orders assigned to them"
  ON public.delivery_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courier_profiles
      WHERE courier_profiles.id = delivery_orders.courier_id
      AND courier_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Couriers can view available delivery orders"
  ON public.delivery_orders FOR SELECT
  USING (status = 'requested' AND courier_id IS NULL);

CREATE POLICY "Senders can create delivery orders"
  ON public.delivery_orders FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Couriers can update delivery orders assigned to them"
  ON public.delivery_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.courier_profiles
      WHERE courier_profiles.id = delivery_orders.courier_id
      AND courier_profiles.user_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_courier_profiles_updated_at
  BEFORE UPDATE ON public.courier_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_orders_updated_at
  BEFORE UPDATE ON public.delivery_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();