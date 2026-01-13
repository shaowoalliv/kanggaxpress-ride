import { supabase } from '@/integrations/supabase/client';
import { Ride, RideType, RideStatus } from '@/types';
import { canTransition } from '@/lib/rideStateMachine';

export interface CreateRideData {
  pickup_location: string;
  dropoff_location: string;
  ride_type: RideType;
  passenger_count?: number;
  notes?: string;
  fare_estimate?: number;
}

export const ridesService = {
  // Create a new ride request with location coordinates
  async createRide(passengerId: string, data: CreateRideData & { 
    pickup_lat?: number; 
    pickup_lng?: number;
    dropoff_lat?: number;
    dropoff_lng?: number;
  }) {
    const payload = {
      passenger_id: passengerId,
      ...data,
      status: 'requested' as RideStatus,
    };
    
    console.log('[createRide] Payload:', payload);
    
    const { data: ride, error } = await supabase
      .from('rides')
      .insert(payload)
      .select()
      .single();

    console.log('[createRide] Result:', { ride, error });
    
    if (error) throw error;
    return ride as Ride;
  },

  // Get rides for a passenger
  async getPassengerRides(passengerId: string) {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('passenger_id', passengerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Ride[];
  },

  // Get available rides (for drivers)
  async getAvailableRides() {
    const { data, error } = await supabase
      .from('rides')
      .select('*, passenger:profiles(*)')
      .eq('status', 'requested')
      .is('driver_id', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get rides assigned to a driver
  async getDriverRides(driverId: string) {
    const { data, error } = await supabase
      .from('rides')
      .select('*, passenger:profiles(*)')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Accept a ride (driver) - SOT: charge ₱5 fee ONCE at assignment
  async acceptRide(rideId: string, driverUserId: string) {
    // Always resolve the driver profile ID from the user ID to satisfy FK rides.driver_id -> driver_profiles.id
    const { data: driverProfile, error: driverError } = await supabase
      .from('driver_profiles')
      .select('id')
      .eq('user_id', driverUserId)
      .maybeSingle();

    if (driverError) throw driverError;
    if (!driverProfile) {
      throw new Error('Driver profile not found. Please complete driver setup.');
    }

    const driverProfileId = (driverProfile as any).id as string;

    const { data, error } = await supabase
      .from('rides')
      .update({
        driver_id: driverProfileId,
        status: 'accepted' as RideStatus,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .eq('status', 'requested')
      .is('driver_id', null)
      .select()
      .maybeSingle();

    if (error) throw error;
    
    // If no data returned, ride was already accepted by another driver or cancelled
    if (!data) {
      throw new Error('This ride is no longer available. It may have been accepted by another driver.');
    }

    // SOT RULE: Charge ₱5 platform fee ONCE at assignment (not completion)
    try {
      const { platformFeeService } = await import('./platformFee');
      const feeResult = await platformFeeService.chargePlatformFeeForRide(rideId, driverProfileId);
      console.log('[Platform Fee]', feeResult.reason);
    } catch (feeError) {
      console.error('[Platform Fee] Failed to charge fee at assignment:', feeError);
      // Ride accepted successfully, but fee failed - log for admin review
    }

    return data as Ride;
  },

  // Update ride status - SOT: NO fee charged here (fee charged at assignment)
  async updateRideStatus(
    rideId: string, 
    status: RideStatus, 
    cancellationReason?: string | null,
    actorUserId?: string | null
  ) {

    const { data: ride, error: fetchError} = await supabase
    .from('rides')
    .select('status')
    .eq('id', rideId)
    .single();

    if (fetchError) throw fetchError;
    if (!ride) throw new Error('Ride not found');

    // Enforce centralized ride state machine transitions
    if (!canTransition(ride.status as RideStatus, status)) {
      throw new Error(
        `Invalid ride status transition: ${ride.status} -> ${status}`
      );
    }


    const updates: any = { status };
    
    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    if (cancellationReason !== undefined) {
      updates.cancellation_reason = cancellationReason;
    }

    const { data, error } = await supabase
      .from('rides')
      .update(updates)
      .eq('id', rideId)
      .eq('status', ride.status)
      .select()
      .single();

    if (error) throw error;

    // SOT RULE: Platform fee charged at ASSIGNMENT (acceptRide), NOT at completion
    // No fee logic here

    return data as Ride;
  },

  // Cancel a ride with reason tracking
  async cancelRide(rideId: string, reason?: string, actorUserId?: string) {
    return this.updateRideStatus(rideId, 'cancelled', reason || null, actorUserId || null);
  },

  // Driver proposes bonus fare
  async proposeFareNegotiation(rideId: string, driverId: string, topUpFare: number, notes: string) {
    const { data, error } = await supabase
      .from('rides')
      .update({
        driver_id: driverId,
        proposed_top_up_fare: topUpFare,
        negotiation_status: 'pending',
        negotiation_notes: notes,
      })
      .eq('id', rideId)
      .eq('status', 'requested')
      .is('driver_id', null)
      .select()
      .single();

    if (error) throw error;
    return data as Ride;
  },

  // Passenger accepts negotiated fare
  async acceptFareNegotiation(rideId: string) {
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('rides')
      .update({
        top_up_fare: ride.proposed_top_up_fare,
        total_fare: (ride.base_fare || 0) + (ride.proposed_top_up_fare || 0),
        negotiation_status: 'accepted',
        status: 'accepted' as RideStatus,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .eq('negotiation_status', 'pending')
      .select()
      .single();

    if (error) throw error;
    return data as Ride;
  },

  // Passenger rejects negotiated fare
  async rejectFareNegotiation(rideId: string) {
    const { data, error } = await supabase
      .from('rides')
      .update({
        driver_id: null,
        proposed_top_up_fare: 0,
        negotiation_status: 'rejected',
        negotiation_notes: null,
      })
      .eq('id', rideId)
      .eq('negotiation_status', 'pending')
      .select()
      .single();

    if (error) throw error;
    return data as Ride;
  },
};


