-- Add negotiation fields to delivery_orders
ALTER TABLE delivery_orders 
  ADD COLUMN IF NOT EXISTS negotiation_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS negotiation_notes TEXT,
  ADD COLUMN IF NOT EXISTS proposed_top_up_fare NUMERIC DEFAULT 0;

-- Add location tracking fields to courier_profiles
ALTER TABLE courier_profiles
  ADD COLUMN IF NOT EXISTS current_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS current_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.courier_profiles;