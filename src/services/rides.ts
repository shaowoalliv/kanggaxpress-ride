import { supabase } from '@/integrations/supabase/client';
import { Ride, RideType, RideStatus } from '@/types';

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
    const { data: ride, error } = await supabase
      .from('rides')
      .insert({
        passenger_id: passengerId,
        ...data,
        status: 'requested' as RideStatus,
      })
      .select()
      .single();

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

  // Accept a ride (driver)
  async acceptRide(rideId: string, driverId: string) {
    const { data, error } = await supabase
      .from('rides')
      .update({
        driver_id: driverId,
        status: 'accepted' as RideStatus,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .eq('status', 'requested')
      .is('driver_id', null)
      .select()
      .single();

    if (error) throw error;
    return data as Ride;
  },

  // Update ride status (now with centralized fee logic)
  async updateRideStatus(
    rideId: string, 
    status: RideStatus, 
    cancellationReason?: string | null,
    actorUserId?: string | null
  ) {
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
      .select()
      .single();

    if (error) throw error;

    // Charge platform fee if applicable (centralized logic)
    if (status === 'completed' || status === 'cancelled') {
      const { platformFeeService } = await import('./platformFee');
      try {
        await platformFeeService.chargePlatformFeeForRide(rideId, actorUserId || null);
      } catch (feeError) {
        console.error('Platform fee error (non-blocking):', feeError);
        // Don't block status update if fee charge fails
      }
    }

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
