-- Add outcome tracking and fee charge flag to rides
ALTER TABLE public.rides 
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS platform_fee_charged boolean NOT NULL DEFAULT false;

-- Add outcome tracking and fee charge flag to delivery_orders
ALTER TABLE public.delivery_orders 
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS platform_fee_charged boolean NOT NULL DEFAULT false;

-- Create enum-like check constraint for cancellation reasons (both tables use same values)
-- Valid values:
-- - cancelled_by_passenger_before_accept
-- - cancelled_by_passenger_after_accept  
-- - cancelled_by_sender_before_accept
-- - cancelled_by_sender_after_accept
-- - cancelled_by_driver
-- - cancelled_by_courier
-- - timed_out_driver_no_show
-- - timed_out_courier_no_show
-- - cancelled_by_system
-- - NULL (not cancelled)

COMMENT ON COLUMN public.rides.cancellation_reason IS 'Tracks how/why a ride ended. Used to determine if ₱5 platform fee should be charged. Fee charged when: cancelled after acceptance by any party, or timed out/no-show. NOT charged when: cancelled before acceptance or by system.';

COMMENT ON COLUMN public.rides.platform_fee_charged IS 'Prevents double-charging. Set to true once ₱5 platform fee has been deducted from driver wallet.';

COMMENT ON COLUMN public.delivery_orders.cancellation_reason IS 'Tracks how/why a delivery ended. Used to determine if ₱5 platform fee should be charged. Fee charged when: cancelled after acceptance by any party, or timed out/no-show. NOT charged when: cancelled before acceptance or by system.';

COMMENT ON COLUMN public.delivery_orders.platform_fee_charged IS 'Prevents double-charging. Set to true once ₱5 platform fee has been deducted from courier wallet.';

-- Add index for admin queries filtering by cancellation reasons
CREATE INDEX IF NOT EXISTS idx_rides_cancellation_reason ON public.rides(cancellation_reason) WHERE cancellation_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deliveries_cancellation_reason ON public.delivery_orders(cancellation_reason) WHERE cancellation_reason IS NOT NULL;