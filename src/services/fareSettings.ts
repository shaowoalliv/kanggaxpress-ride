import { supabase } from '@/integrations/supabase/client';

export interface FareSetting {
  id: string;
  service_type: string;
  display_name: string;
  base_fare: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: number;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export const fareSettingsService = {
  async getFareSettings() {
    const { data, error } = await supabase
      .from('fare_settings')
      .select('*')
      .eq('is_active', true)
      .order('service_type');

    if (error) throw error;
    return data as FareSetting[];
  },

  async updateFareSetting(id: string, updates: Partial<FareSetting>) {
    const { data, error } = await supabase
      .from('fare_settings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FareSetting;
  },

  async getPlatformSettings() {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*');

    if (error) throw error;
    return data as PlatformSetting[];
  },

  async getAppUsageFee(): Promise<number> {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'app_usage_fee')
      .single();

    if (error) throw error;
    return data?.setting_value || 5;
  },

  async updatePlatformSetting(settingKey: string, settingValue: number) {
    const { data, error } = await supabase
      .from('platform_settings')
      .update({ setting_value: settingValue })
      .eq('setting_key', settingKey)
      .select()
      .single();

    if (error) throw error;
    return data as PlatformSetting;
  },
};
