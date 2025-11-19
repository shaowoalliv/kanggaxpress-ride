-- Add platform settings for fare tip/bonus quick-select options
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES 
  ('tip_option_1', 20, 'First quick-select tip amount in pesos'),
  ('tip_option_2', 50, 'Second quick-select tip amount in pesos'),
  ('tip_option_3', 100, 'Third quick-select tip amount in pesos'),
  ('enable_fare_tips', 1, 'Enable or disable fare tip feature (1=enabled, 0=disabled)')
ON CONFLICT (setting_key) DO NOTHING;