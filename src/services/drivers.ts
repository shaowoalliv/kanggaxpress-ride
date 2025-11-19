import { supabase } from '@/integrations/supabase/client';
import { DriverProfile, RideType } from '@/types';

export interface CreateDriverProfileData {
  vehicle_type: RideType;
  vehicle_plate: string;
  vehicle_model?: string;
  vehicle_color?: string;
  license_number?: string;
}

export const driversService = {
  // Create driver profile
  async createDriverProfile(userId: string, data: CreateDriverProfileData) {
    const { data: profile, error } = await supabase
      .from('driver_profiles')
      .insert({
        user_id: userId,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;
    return profile as DriverProfile;
  },

  // Get driver profile by user ID
  async getDriverProfile(userId: string) {
    const { data, error } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as DriverProfile | null;
  },

  // Update driver availability with location tracking
  async updateAvailability(userId: string, isAvailable: boolean, coords?: { lat: number; lng: number }) {
    const updates: any = { is_available: isAvailable };
    
    // Update location when toggling availability
    if (coords) {
      updates.current_lat = coords.lat;
      updates.current_lng = coords.lng;
      updates.location_updated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('driver_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as DriverProfile;
  },

  // Update driver profile
  async updateDriverProfile(userId: string, updates: Partial<CreateDriverProfileData>) {
    const { data, error } = await supabase
      .from('driver_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as DriverProfile;
  },
};
