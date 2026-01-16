-- Add arrived_at and platform_fee_refunded columns to rides table
ALTER TABLE public.rides
ADD COLUMN arrived_at timestamp with time zone,
ADD COLUMN platform_fee_refunded boolean NOT NULL DEFAULT false;