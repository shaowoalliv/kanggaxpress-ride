import { supabase } from '@/integrations/supabase/client';
import { CourierProfile, RideType } from '@/types';

export interface CreateCourierProfileData {
  vehicle_type: RideType;
  vehicle_plate: string;
  vehicle_model?: string;
  vehicle_color?: string;
  license_number?: string;
}

export const couriersService = {
  // Create courier profile
  async createCourierProfile(userId: string, data: CreateCourierProfileData) {
    const { data: profile, error } = await supabase
      .from('courier_profiles')
      .insert({
        user_id: userId,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;
    return profile as CourierProfile;
  },

  // Get courier profile by user ID
  async getCourierProfile(userId: string) {
    const { data, error } = await supabase
      .from('courier_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as CourierProfile | null;
  },

  // Update courier availability
  async updateAvailability(userId: string, isAvailable: boolean) {
    const { data, error } = await supabase
      .from('courier_profiles')
      .update({ is_available: isAvailable })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as CourierProfile;
  },

  // Update courier profile
  async updateCourierProfile(userId: string, updates: Partial<CreateCourierProfileData>) {
    const { data, error } = await supabase
      .from('courier_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as CourierProfile;
  },
};
