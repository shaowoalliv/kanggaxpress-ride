import { supabase } from '@/integrations/supabase/client';
import { Ride, RideType, RideStatus } from '@/types';

export interface CreateRideData {
  pickup_location: string;
  dropoff_location: string;
  ride_type: RideType;
  passenger_count?: number;
  notes?: string;
  fare_estimate?: number;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
  base_fare?: number;
  app_fee?: number;
}

export const ridesService = {
  // Create a new ride request
  async createRide(passengerId: string, data: CreateRideData) {
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

  // Update ride status
  async updateRideStatus(rideId: string, status: RideStatus) {
    const updates: any = { status };
    
    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('rides')
      .update(updates)
      .eq('id', rideId)
      .select()
      .single();

    if (error) throw error;
    return data as Ride;
  },

  // Cancel a ride
  async cancelRide(rideId: string) {
    return this.updateRideStatus(rideId, 'cancelled');
  },
};
