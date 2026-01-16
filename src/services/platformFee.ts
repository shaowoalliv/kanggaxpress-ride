import { supabase } from '@/integrations/supabase/client';
import { walletService } from './wallet';

/**
 * Centralized Platform Fee Service (ALIGNED WITH SOT)
 * 
 * Business Rule: KanggaXpress charges ₱5 per job ONCE at ASSIGNMENT
 * 
 * Fee IS charged when:
 * - Ride: status changes from 'requested' → 'accepted' and driver_id is set
 * - Delivery: status changes from 'requested' → 'assigned' and courier_id is set
 * 
 * Fee NOT charged when:
 * - Job never assigned (cancelled before acceptance)
 * - Cancelled by system/admin due to technical issues
 * 
 * Fee NOT refunded when:
 * - Job cancelled after assignment (by passenger/sender/driver/courier)
 * - Driver/courier no-show after acceptance
 */

const PLATFORM_FEE = 5;

/**
 * Charge platform fee for a ride AT ASSIGNMENT (when driver accepts)
 */
export async function chargePlatformFeeForRide(
  rideId: string,
  driverId: string
): Promise<{ charged: boolean; reason: string }> {
  try {
    // Load ride with current state
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('id, driver_id, platform_fee_charged')
      .eq('id', rideId)
      .single();

    if (fetchError) throw fetchError;
    if (!ride) throw new Error('Ride not found');

    // Already charged?
    if (ride.platform_fee_charged) {
      return { charged: false, reason: 'Fee already charged for this ride' };
    }

    // Get driver's user_id
    const { data: driver, error: driverError } = await supabase
      .from('driver_profiles')
      .select('user_id')
      .eq('id', driverId)
      .single();

    if (driverError) throw driverError;
    if (!driver) throw new Error('Driver not found');

    // Charge the fee via centralized wallet service
    await walletService.applyTransaction({
      userId: driver.user_id,
      amount: -PLATFORM_FEE,
      type: 'deduct',
      reference: `KX platform fee for ride ${rideId}`,
      rideId: rideId,
      actorUserId: driver.user_id,
    });

    // Mark as charged
    const { error: updateError } = await supabase
      .from('rides')
      .update({ platform_fee_charged: true })
      .eq('id', rideId);

    if (updateError) throw updateError;

    return { charged: true, reason: `₱${PLATFORM_FEE} platform fee charged at assignment` };
  } catch (error: any) {
    console.error('Error charging platform fee for ride:', error);
    throw error;
  }
}

/**
 * Charge platform fee for a delivery AT ASSIGNMENT (when courier accepts)
 */
export async function chargePlatformFeeForDelivery(
  deliveryId: string,
  courierId: string
): Promise<{ charged: boolean; reason: string }> {
  try {
    // Load delivery with current state
    const { data: delivery, error: fetchError } = await supabase
      .from('delivery_orders')
      .select('id, courier_id, platform_fee_charged')
      .eq('id', deliveryId)
      .single();

    if (fetchError) throw fetchError;
    if (!delivery) throw new Error('Delivery not found');

    // Already charged?
    if (delivery.platform_fee_charged) {
      return { charged: false, reason: 'Fee already charged for this delivery' };
    }

    // Get courier's user_id
    const { data: courier, error: courierError } = await supabase
      .from('courier_profiles')
      .select('user_id')
      .eq('id', courierId)
      .single();

    if (courierError) throw courierError;
    if (!courier) throw new Error('Courier not found');

    // Charge the fee via centralized wallet service
    await walletService.applyTransaction({
      userId: courier.user_id,
      amount: -PLATFORM_FEE,
      type: 'deduct',
      reference: `KX platform fee for delivery ${deliveryId}`,
      deliveryId: deliveryId,
      actorUserId: courier.user_id,
    });

    // Mark as charged
    const { error: updateError } = await supabase
      .from('delivery_orders')
      .update({ platform_fee_charged: true })
      .eq('id', deliveryId);

    if (updateError) throw updateError;

    return { charged: true, reason: `₱${PLATFORM_FEE} platform fee charged at assignment` };
  } catch (error: any) {
    console.error('Error charging platform fee for delivery:', error);
    throw error;
  }
}

export async function refundPlatformFee(rideId: string): Promise<{refunded: boolean; reason: string}> {
  const {data: ride, error} = await supabase
  .from('rides')
  .select('id, driver_id, status, cancellation_reason, platform_fee_charged, platform_fee_refunded')
  .eq('id', rideId)
  .single();
  
  if (error) throw error;
  if (!ride) throw new Error('Ride not found');

  if (ride.status !== 'cancelled') {
    return {refunded: false, reason: 'Ride is not cancelled'};
  }

  if (ride.cancellation_reason !== 'Driver no-show timeout') {
    return {refunded: false, reason: 'Reason for cancellation is not driver no-show timeout'};
  }

  if(!ride.platform_fee_charged) {
    return {refunded: false, reason: 'Platform fee was never chraged'};
  }

  // this block prevents double refund
  if (ride.platform_fee_refunded) {
    return {refunded: false, reason: 'Platform fee already refunded'};
  }

  const {data: driver} = await supabase
  .from('driver_profiles')
  .select('user_id')
  .eq('id', ride.driver_id)
  .single();

  if (!driver) throw new Error('Driver not found');

  // Refund
  await walletService.applyTransaction({
    userId: driver.user_id!,
    amount: PLATFORM_FEE,
    type:'adjust',
    reference: 'Driver no-show refund',
    rideId: rideId,
    actorUserId: driver.user_id,
  });

  const {error: updateError} = await supabase
  .from('rides')
  .update({platform_fee_refunded: true})
  .eq('id', rideId);

  if (updateError) throw updateError;

  return {
    refunded: true,
    reason: 'Platform fee refunded for ride',
  };
}

export const platformFeeService = {
  chargePlatformFeeForRide,
  chargePlatformFeeForDelivery,
  refundPlatformFee,
  PLATFORM_FEE,
};
