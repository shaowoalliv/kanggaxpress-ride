import { supabase } from '@/integrations/supabase/client';
import { walletService } from './wallet';

/**
 * Centralized Platform Fee Service
 * 
 * Business Rule: KanggaXpress charges ₱5 per completed transaction (ride or delivery)
 * 
 * Fee IS charged when:
 * - Job completed successfully
 * - Cancelled by passenger/sender AFTER acceptance
 * - Cancelled by driver/courier
 * - Timed out / no-show (driver/courier accepted but did not complete)
 * 
 * Fee NOT charged when:
 * - Cancelled BEFORE any driver/courier accepts
 * - Cancelled by system/admin due to technical issues
 */

const PLATFORM_FEE = 5;

export type CancellationReason =
  | 'cancelled_by_passenger_before_accept'
  | 'cancelled_by_passenger_after_accept'
  | 'cancelled_by_sender_before_accept'
  | 'cancelled_by_sender_after_accept'
  | 'cancelled_by_driver'
  | 'cancelled_by_courier'
  | 'timed_out_driver_no_show'
  | 'timed_out_courier_no_show'
  | 'cancelled_by_system';

/**
 * Determines if platform fee should be charged based on status and cancellation reason
 */
function shouldChargeFee(
  status: string,
  cancellationReason: string | null,
  hasProvider: boolean
): boolean {
  // No provider assigned = no fee
  if (!hasProvider) {
    return false;
  }

  // Completed = always charge
  if (status === 'completed' || status === 'delivered') {
    return true;
  }

  // Cancelled - check reason
  if (status === 'cancelled' && cancellationReason) {
    const noFeeReasons = [
      'cancelled_by_passenger_before_accept',
      'cancelled_by_sender_before_accept',
      'cancelled_by_system',
    ];
    
    return !noFeeReasons.includes(cancellationReason);
  }

  return false;
}

/**
 * Charge platform fee for a ride (if eligible and not already charged)
 */
export async function chargePlatformFeeForRide(
  rideId: string,
  actorUserId: string | null = null
): Promise<{ charged: boolean; reason: string }> {
  try {
    // Load ride with current state
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('id, driver_id, status, cancellation_reason, platform_fee_charged')
      .eq('id', rideId)
      .single();

    if (fetchError) throw fetchError;
    if (!ride) throw new Error('Ride not found');

    // Already charged?
    if (ride.platform_fee_charged) {
      return { charged: false, reason: 'Fee already charged for this ride' };
    }

    // Should we charge?
    const hasDriver = ride.driver_id !== null;
    const shouldCharge = shouldChargeFee(ride.status, ride.cancellation_reason, hasDriver);

    if (!shouldCharge) {
      return {
        charged: false,
        reason: `No fee for status=${ride.status}, reason=${ride.cancellation_reason}, hasDriver=${hasDriver}`,
      };
    }

    // Get driver's user_id
    const { data: driver, error: driverError } = await supabase
      .from('driver_profiles')
      .select('user_id')
      .eq('id', ride.driver_id!)
      .single();

    if (driverError) throw driverError;
    if (!driver) throw new Error('Driver not found');

    // Charge the fee via centralized wallet service
    await walletService.applyTransaction({
      userId: driver.user_id,
      amount: -PLATFORM_FEE,
      type: 'deduct',
      reference: 'KanggaXpress platform fee (ride)',
      rideId: rideId,
      actorUserId: actorUserId,
    });

    // Mark as charged
    const { error: updateError } = await supabase
      .from('rides')
      .update({ platform_fee_charged: true })
      .eq('id', rideId);

    if (updateError) throw updateError;

    return { charged: true, reason: `₱${PLATFORM_FEE} platform fee charged` };
  } catch (error: any) {
    console.error('Error charging platform fee for ride:', error);
    throw error;
  }
}

/**
 * Charge platform fee for a delivery (if eligible and not already charged)
 */
export async function chargePlatformFeeForDelivery(
  deliveryId: string,
  actorUserId: string | null = null
): Promise<{ charged: boolean; reason: string }> {
  try {
    // Load delivery with current state
    const { data: delivery, error: fetchError } = await supabase
      .from('delivery_orders')
      .select('id, courier_id, status, cancellation_reason, platform_fee_charged')
      .eq('id', deliveryId)
      .single();

    if (fetchError) throw fetchError;
    if (!delivery) throw new Error('Delivery not found');

    // Already charged?
    if (delivery.platform_fee_charged) {
      return { charged: false, reason: 'Fee already charged for this delivery' };
    }

    // Should we charge?
    const hasCourier = delivery.courier_id !== null;
    const shouldCharge = shouldChargeFee(delivery.status, delivery.cancellation_reason, hasCourier);

    if (!shouldCharge) {
      return {
        charged: false,
        reason: `No fee for status=${delivery.status}, reason=${delivery.cancellation_reason}, hasCourier=${hasCourier}`,
      };
    }

    // Get courier's user_id
    const { data: courier, error: courierError } = await supabase
      .from('courier_profiles')
      .select('user_id')
      .eq('id', delivery.courier_id!)
      .single();

    if (courierError) throw courierError;
    if (!courier) throw new Error('Courier not found');

    // Charge the fee via centralized wallet service
    await walletService.applyTransaction({
      userId: courier.user_id,
      amount: -PLATFORM_FEE,
      type: 'deduct',
      reference: 'KanggaXpress platform fee (delivery)',
      deliveryId: deliveryId,
      actorUserId: actorUserId,
    });

    // Mark as charged
    const { error: updateError } = await supabase
      .from('delivery_orders')
      .update({ platform_fee_charged: true })
      .eq('id', deliveryId);

    if (updateError) throw updateError;

    return { charged: true, reason: `₱${PLATFORM_FEE} platform fee charged` };
  } catch (error: any) {
    console.error('Error charging platform fee for delivery:', error);
    throw error;
  }
}

export const platformFeeService = {
  chargePlatformFeeForRide,
  chargePlatformFeeForDelivery,
  PLATFORM_FEE,
};
