import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';

export const profilesService = {
  // Get profile by ID
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as Profile;
  },

  // Update profile
  async updateProfile(userId: string, updates: Partial<Pick<Profile, 'full_name' | 'phone'>>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },
};
