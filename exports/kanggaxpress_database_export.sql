-- KanggaXpress Database Export
-- Generated: 2025-12-08
-- Import this into your Supabase SQL Editor

-- ============================================
-- ENUMS (Create these first)
-- ============================================

CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'sender', 'courier');
CREATE TYPE ride_type AS ENUM ('motor', 'tricycle', 'car');
CREATE TYPE ride_status AS ENUM ('requested', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE delivery_status AS ENUM ('requested', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE package_size AS ENUM ('small', 'medium', 'large');
CREATE TYPE app_role AS ENUM ('kx_admin', 'kx_moderator');

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL,
  account_number TEXT,
  current_session_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO profiles (id, email, full_name, phone, role, account_number, current_session_token, created_at, updated_at) VALUES
('ba2d6b9d-8acb-4feb-ba08-2be185863473', 'courier1@test.com', 'Pedro Ramos', '09204567890', 'courier', 'KXC-89099108', '284378cd-52ef-472f-a207-ffbc37e063e9', '2025-11-25 04:49:14.97422+00', '2025-11-25 07:22:18.269868+00'),
('e8ff1e84-81e8-45ab-be54-a76ff3882215', 'admin@kanggaxpress.com', 'User', NULL, 'passenger', NULL, NULL, '2025-11-15 15:24:28.459525+00', '2025-11-15 15:24:28.459525+00'),
('1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', 'driver1@test.com', 'Juan Dela Cruz', '09171234567', 'driver', 'KXD-91102403', '739125cf-c5d6-4fc9-9a6f-63c78c382220', '2025-11-25 04:49:18.267486+00', '2025-12-04 22:45:59.128266+00'),
('abe417b9-2d80-4ab4-a774-1e8099f0ba77', 'passenger1@test.com', 'Anna Reyes', '09211234567', 'passenger', NULL, '90d5b5ec-4609-47b2-a3a4-a5055f6a1db0', '2025-11-25 04:49:30.924614+00', '2025-12-04 22:47:00.695489+00'),
('e3fa2541-c82d-4343-8eb1-e8cbd7020131', 'driver2@test.com', 'Maria Santos', '09182345678', 'driver', 'KXD-92283434', NULL, '2025-11-25 04:49:21.502401+00', '2025-11-25 04:49:23.654173+00'),
('f7b0df77-72ff-4bcb-b3c8-ce8ae1e83def', 'driver3@test.com', 'Roberto Garcia', '09193456789', 'driver', 'KXD-27334057', NULL, '2025-11-25 04:49:24.637124+00', '2025-11-25 04:49:26.80333+00'),
('66c8014c-3c92-40fa-81ca-21ded578fc09', 'yourit.head@gmail.com', 'Yourit Head', '09195678901', 'driver', 'KXD-91616492', NULL, '2025-11-25 04:49:27.790137+00', '2025-11-25 04:49:29.931916+00'),
('f4b2c431-6196-4e59-8691-d40d4b191e96', 'passenger2@test.com', 'Carlos Mendoza', '09222345678', 'passenger', NULL, NULL, '2025-11-25 04:49:31.632897+00', '2025-11-25 04:49:31.936389+00');

-- ============================================
-- USER_ROLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO user_roles (id, user_id, role, created_at) VALUES
('86242338-ee57-419d-8e07-3c436a4d62a9', 'e8ff1e84-81e8-45ab-be54-a76ff3882215', 'kx_admin', '2025-11-15 15:29:27.103946+00');

-- ============================================
-- DRIVER_PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  vehicle_type ride_type NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_model TEXT,
  vehicle_color TEXT,
  license_number TEXT,
  is_available BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 5.00,
  total_rides INTEGER DEFAULT 0,
  current_lat NUMERIC,
  current_lng NUMERIC,
  location_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO driver_profiles (id, user_id, vehicle_type, vehicle_plate, vehicle_model, vehicle_color, license_number, is_available, rating, total_rides, current_lat, current_lng, location_updated_at, created_at, updated_at) VALUES
('c0a42146-7816-4cfd-9e2c-ea8eb0c6cd87', 'e3fa2541-c82d-4343-8eb1-e8cbd7020131', 'tricycle', 'XYZ-5678', 'Honda TMX 155', 'Blue', 'N02-13-456789', true, 5.00, 0, NULL, NULL, NULL, '2025-11-25 04:49:22.132518+00', '2025-11-25 04:49:22.132518+00'),
('ace1667a-8f09-4976-a8f8-f894741b035b', 'f7b0df77-72ff-4bcb-b3c8-ce8ae1e83def', 'car', 'GHI-3456', 'Toyota Vios', 'White', 'N03-14-678901', true, 5.00, 0, NULL, NULL, NULL, '2025-11-25 04:49:25.237407+00', '2025-11-25 04:49:25.237407+00'),
('31363b70-5396-46c8-b638-4ae6e3caff8f', '66c8014c-3c92-40fa-81ca-21ded578fc09', 'car', 'JKL-7890', 'Honda City', 'Silver', 'N05-16-890123', true, 5.00, 0, NULL, NULL, NULL, '2025-11-25 04:49:28.399472+00', '2025-11-25 04:49:28.399472+00'),
('6d065185-f8cc-4ffb-ba3c-2e4bb814f350', '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', 'motor', 'ABC-1234', 'Honda Wave 110', 'Red', 'N01-12-345678', true, 5.00, 0, 14.5695236, 121.022614, '2025-12-04 22:46:10.537+00', '2025-11-25 04:49:18.877574+00', '2025-12-04 22:46:10.868267+00');

-- ============================================
-- COURIER_PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS courier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  vehicle_type ride_type NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_model TEXT,
  vehicle_color TEXT,
  license_number TEXT,
  is_available BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 5.00,
  total_deliveries INTEGER DEFAULT 0,
  current_lat NUMERIC,
  current_lng NUMERIC,
  location_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO courier_profiles (id, user_id, vehicle_type, vehicle_plate, vehicle_model, vehicle_color, license_number, is_available, rating, total_deliveries, current_lat, current_lng, location_updated_at, created_at, updated_at) VALUES
('6a63278e-7857-4468-b981-c088704be5e5', 'ba2d6b9d-8acb-4feb-ba08-2be185863473', 'motor', 'DEF-9012', 'Yamaha Mio', 'Black', 'N04-15-789012', true, 5.00, 0, NULL, NULL, NULL, '2025-11-25 04:49:15.693139+00', '2025-11-25 04:49:15.693139+00');

-- ============================================
-- WALLET_ACCOUNTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS wallet_accounts (
  user_id UUID PRIMARY KEY,
  role TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO wallet_accounts (user_id, role, balance, created_at, updated_at) VALUES
('ba2d6b9d-8acb-4feb-ba08-2be185863473', 'courier', 30.00, '2025-11-25 04:49:17.564074+00', '2025-11-25 04:49:17.564074+00'),
('e3fa2541-c82d-4343-8eb1-e8cbd7020131', 'driver', 30.00, '2025-11-25 04:49:23.958265+00', '2025-11-25 04:49:23.958265+00'),
('f7b0df77-72ff-4bcb-b3c8-ce8ae1e83def', 'driver', 30.00, '2025-11-25 04:49:27.104588+00', '2025-11-25 04:49:27.104588+00'),
('66c8014c-3c92-40fa-81ca-21ded578fc09', 'driver', 30.00, '2025-11-25 04:49:30.232981+00', '2025-11-25 04:49:30.232981+00'),
('1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', 'driver', 100.00, '2025-11-25 04:49:20.808405+00', '2025-11-27 08:44:37.983791+00');

-- ============================================
-- WALLET_TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  reference TEXT,
  related_ride_id UUID,
  related_delivery_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO wallet_transactions (id, user_id, amount, type, reference, related_ride_id, related_delivery_id, created_by, created_at) VALUES
('9419b7da-355e-452d-883a-8679606ccbb0', 'ba2d6b9d-8acb-4feb-ba08-2be185863473', 30.00, 'load', 'Initial test account load', NULL, NULL, NULL, '2025-11-25 04:49:17.880551+00'),
('ccf5c83f-006b-43e8-80d7-cdf03b8b6032', '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', 30.00, 'load', 'Initial test account load', NULL, NULL, NULL, '2025-11-25 04:49:21.115692+00'),
('e755182d-1ff5-43f0-942e-b6644d5d003c', 'e3fa2541-c82d-4343-8eb1-e8cbd7020131', 30.00, 'load', 'Initial test account load', NULL, NULL, NULL, '2025-11-25 04:49:24.254982+00'),
('ed6049a3-9e46-4df9-8fea-3d8c4688573f', 'f7b0df77-72ff-4bcb-b3c8-ce8ae1e83def', 30.00, 'load', 'Initial test account load', NULL, NULL, NULL, '2025-11-25 04:49:27.402+00'),
('3bb59e94-a62e-401d-b736-e3082a8116fd', '66c8014c-3c92-40fa-81ca-21ded578fc09', 30.00, 'load', 'Initial test account load', NULL, NULL, NULL, '2025-11-25 04:49:30.53744+00'),
('cbd0aee2-0868-4fc9-afb1-2496b1e72ccd', '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', -5.00, 'deduct', 'KX platform fee for ride 93e4ba64-dab5-481b-8eea-abce2312d920', '93e4ba64-dab5-481b-8eea-abce2312d920', NULL, '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', '2025-11-25 10:10:03.068202+00'),
('ccfa5570-bc3e-48c7-9984-a7bd694ae53b', '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', -5.00, 'deduct', 'KX platform fee for ride 3d8a41c4-51fa-45f3-b429-27dcee4db975', '3d8a41c4-51fa-45f3-b429-27dcee4db975', NULL, '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', '2025-11-25 10:10:41.149489+00'),
('cd7b0d05-65fd-4c17-aabd-b90037531c8d', '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', -5.00, 'deduct', 'KX platform fee for ride e15f21ba-f897-4a4a-9004-f94cfcdb7ba7', 'e15f21ba-f897-4a4a-9004-f94cfcdb7ba7', NULL, '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', '2025-11-25 10:19:25.246972+00'),
('7958ae88-0336-47bf-8452-189b410eb966', '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', -5.00, 'deduct', 'KX platform fee for ride 13564825-577a-413b-ac01-4025f65ba91f', '13564825-577a-413b-ac01-4025f65ba91f', NULL, '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', '2025-11-25 10:24:07.605783+00'),
('08fc143a-7f53-4be4-aeca-9d1f1d570389', '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', -5.00, 'deduct', 'KX platform fee for ride 58efd74a-7aa4-4a7f-908b-2e86169b0cef', '58efd74a-7aa4-4a7f-908b-2e86169b0cef', NULL, '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', '2025-11-25 10:36:41.340973+00'),
('33ba7e89-8170-4c2c-9c3f-2642156237cb', '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', -5.00, 'deduct', 'KX platform fee for ride 7646ecbd-d20a-49e1-bbad-c26342343219', '7646ecbd-d20a-49e1-bbad-c26342343219', NULL, '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', '2025-11-25 11:12:59.434976+00'),
('fd901908-4707-4408-ab8e-cc7f651cddda', '1fdf9e04-65c0-4cd3-b994-440c8e4c28ab', 100.00, 'load', 'Manual load', NULL, NULL, 'e8ff1e84-81e8-45ab-be54-a76ff3882215', '2025-11-27 08:44:37.983791+00');

-- ============================================
-- PROVINCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO provinces (id, name, code, is_active, created_at, updated_at) VALUES
('b466d666-d25d-4d7d-b1e7-39f4364f2ea4', 'Metro Manila', 'NCR', true, '2025-11-24 04:03:29.21197+00', '2025-11-24 04:03:29.21197+00'),
('98328e14-7aba-4059-b730-1b030b0c5a72', 'Oriental Mindoro', 'MIMAROPA', true, '2025-11-24 04:03:29.21197+00', '2025-11-24 04:03:29.21197+00'),
('c718392c-359b-4287-9f47-6b0268cb3310', 'Cordillera Administrative Region', 'CAR', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('2a642c9e-fcd1-46fb-90a8-f28b58d600e8', 'Ilocos Region', 'R01', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('8056705c-eeee-4b0b-bddb-7fb2cf50a0d4', 'Cagayan Valley', 'R02', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('a4048b62-278b-4bd3-8979-3dabdf3f7e0f', 'Central Luzon', 'R03', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('3ed97506-7039-49a3-8f2d-cbcb89185c7a', 'CALABARZON', 'R4A', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('f96018e0-07b2-4072-80ea-198e080f4ff2', 'MIMAROPA', 'R4B', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('2cda49a9-6108-47d7-894d-5ec7c74ae5ef', 'Bicol Region', 'R05', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('500d28cd-a7d2-4b60-8e92-d0e141dbba43', 'Western Visayas', 'R06', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('c3501e8c-1239-4011-8305-711e17df3f6e', 'Central Visayas', 'R07', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('d5283fe8-0ad5-4b0a-80ae-23e77bee2aeb', 'Eastern Visayas', 'R08', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('c066c39f-e8ed-40d6-81be-f344ee16e360', 'Zamboanga Peninsula', 'R09', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('747279fa-547f-4bc0-a3ce-83a517a5c205', 'Northern Mindanao', 'R10', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('9a09cde7-15a0-4145-8d2b-6c49aec72caa', 'Davao Region', 'R11', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('1bfc9f3d-aed6-459a-8854-7fd8fc57d5c4', 'SOCCSKSARGEN', 'R12', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('b5c9e0ac-51e1-407e-b9e7-8a0df1ee9646', 'Caraga', 'R13', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00'),
('15b9117a-7c4e-434b-85e7-c553833f0857', 'Bangsamoro Autonomous Region in Muslim Mindanao', 'BARMM', false, '2025-11-24 04:22:57.561789+00', '2025-11-24 04:22:57.561789+00');

-- ============================================
-- CITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province_id UUID NOT NULL REFERENCES provinces(id),
  name TEXT NOT NULL,
  geofence_lat NUMERIC NOT NULL,
  geofence_lng NUMERIC NOT NULL,
  geofence_radius_km NUMERIC DEFAULT 15,
  is_active BOOLEAN DEFAULT false,
  activation_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO cities (id, province_id, name, geofence_lat, geofence_lng, geofence_radius_km, is_active, activation_date, created_at, updated_at) VALUES
('13b43c7b-7e63-4924-b35b-c5ef6183be17', 'b466d666-d25d-4d7d-b1e7-39f4364f2ea4', 'Makati City', 14.5547, 121.0244, 15, true, '2025-11-24 04:03:29.21197+00', '2025-11-24 04:03:29.21197+00', '2025-11-24 04:03:29.21197+00'),
('0517155b-bdb5-4fa3-9627-251bd4641cbd', '98328e14-7aba-4059-b730-1b030b0c5a72', 'Calapan City', 13.4119, 121.1803, 15, true, '2025-11-24 04:03:29.21197+00', '2025-11-24 04:03:29.21197+00', '2025-11-24 04:03:29.21197+00');

-- ============================================
-- FARE_CONFIGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS fare_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,
  region_code TEXT DEFAULT 'CALAPAN',
  city_id UUID REFERENCES cities(id),
  base_fare NUMERIC DEFAULT 20,
  per_km NUMERIC DEFAULT 10,
  per_min NUMERIC DEFAULT 0,
  min_fare NUMERIC DEFAULT 40,
  platform_fee_type TEXT DEFAULT 'FLAT',
  platform_fee_value NUMERIC DEFAULT 5,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO fare_configs (id, service_type, region_code, city_id, base_fare, per_km, per_min, min_fare, platform_fee_type, platform_fee_value, updated_at) VALUES
('e93ff380-71bb-4deb-aa83-18ee6e0c16d4', 'SEND_PACKAGE', 'CALAPAN', NULL, 30, 12, 0, 60, 'FLAT', 8, '2025-11-24 04:03:29.21197+00'),
('97d8e86e-3b7e-4831-8d88-236603e15dd4', 'TRICYCLE', 'CALAPAN', NULL, 20, 8, 0, 40, 'FLAT', 5, '2025-11-24 04:03:29.21197+00'),
('324f2225-bbf5-40e1-836c-3ad177500770', 'MOTORCYCLE', 'CALAPAN', NULL, 25, 10, 0, 50, 'FLAT', 5, '2025-11-24 04:03:29.21197+00'),
('ae823305-bef9-4f13-ab8f-22a9b88fbe98', 'CAR', 'CALAPAN', NULL, 40, 15, 2, 80, 'PCT', 5, '2025-11-24 04:03:29.21197+00');

-- ============================================
-- FARE_SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS fare_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  base_fare NUMERIC DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO fare_settings (id, service_type, display_name, base_fare, is_active, created_at, updated_at) VALUES
('8834a27f-bdb7-430f-a881-cdf5fe04d38d', 'MOTOR', 'Motorcycle', 40, true, '2025-11-18 07:06:11.083541+00', '2025-11-18 07:06:11.083541+00'),
('f42a4f76-1c57-41f9-a572-0dde7a457dbd', 'TRICYCLE', 'Tricycle', 50, true, '2025-11-18 07:06:11.083541+00', '2025-11-18 07:06:11.083541+00'),
('f0ffef52-d2fb-4c42-8557-ee3dae2b9b96', 'CAR', 'Car', 80, true, '2025-11-18 07:06:11.083541+00', '2025-11-18 07:06:11.083541+00'),
('3d12cf44-8c9c-4429-8d6a-55cd40fc6bb1', 'DELIVERY', 'Send Package', 45, true, '2025-11-18 07:06:11.083541+00', '2025-11-18 07:06:11.083541+00');

-- ============================================
-- PLATFORM_SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  setting_value NUMERIC NOT NULL,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO platform_settings (id, setting_key, setting_value, description, updated_at) VALUES
('3a14ca1b-e987-4495-9285-27af648e9b50', 'app_usage_fee', 5, 'KanggaXpress app usage fee per completed ride', '2025-11-18 07:06:11.083541+00'),
('7e518d3e-4d2e-4567-9c28-42fceb3441e7', 'tip_option_1', 20, 'First quick-select tip amount in pesos', '2025-11-19 05:50:07.419093+00'),
('b8758830-3e38-4733-8e42-618232b94072', 'tip_option_2', 50, 'Second quick-select tip amount in pesos', '2025-11-19 05:50:07.419093+00'),
('9f8f3096-aa61-43f3-af0a-fa9739a0df68', 'tip_option_3', 100, 'Third quick-select tip amount in pesos', '2025-11-19 05:50:07.419093+00'),
('95c28a22-1150-449b-8d91-fa3bbcc446ae', 'enable_fare_tips', 1, 'Enable or disable fare tip feature (1=enabled, 0=disabled)', '2025-11-19 05:50:07.419093+00');

-- ============================================
-- RIDES TABLE (Sample data - truncated for brevity)
-- ============================================

CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL,
  driver_id UUID,
  ride_type ride_type NOT NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  pickup_lat NUMERIC,
  pickup_lng NUMERIC,
  dropoff_lat NUMERIC,
  dropoff_lng NUMERIC,
  status ride_status DEFAULT 'requested',
  fare_estimate NUMERIC,
  fare_final NUMERIC,
  base_fare NUMERIC,
  top_up_fare NUMERIC DEFAULT 0,
  total_fare NUMERIC,
  app_fee NUMERIC DEFAULT 5,
  proposed_top_up_fare NUMERIC DEFAULT 0,
  passenger_count INTEGER DEFAULT 1,
  notes TEXT,
  negotiation_status TEXT DEFAULT 'none',
  negotiation_notes TEXT,
  cancellation_reason TEXT,
  search_radius NUMERIC DEFAULT 200,
  drivers_notified JSONB DEFAULT '[]',
  proposals JSONB DEFAULT '[]',
  max_radius_reached BOOLEAN DEFAULT false,
  platform_fee_charged BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Note: Rides data has many records. Query the rides table separately if needed.

-- ============================================
-- KYC_DOCUMENTS TABLE (Sample - sensitive data removed)
-- ============================================

CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  doc_type TEXT NOT NULL,
  parsed JSONB NOT NULL,
  confidence NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING',
  image_path TEXT,
  parsed_encrypted BYTEA,
  encryption_key_version INTEGER DEFAULT 1,
  needs_reencryption BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ADDITIONAL TABLES (Empty in current DB)
-- ============================================

CREATE TABLE IF NOT EXISTS delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  courier_id UUID,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  pickup_lat NUMERIC,
  pickup_lng NUMERIC,
  dropoff_lat NUMERIC,
  dropoff_lng NUMERIC,
  package_description TEXT NOT NULL,
  package_size package_size NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  cod_amount NUMERIC,
  status delivery_status DEFAULT 'requested',
  base_fare NUMERIC,
  top_up_fare NUMERIC DEFAULT 0,
  total_fare NUMERIC,
  app_fee NUMERIC DEFAULT 5,
  proposed_top_up_fare NUMERIC DEFAULT 0,
  negotiation_status TEXT DEFAULT 'none',
  negotiation_notes TEXT,
  cancellation_reason TEXT,
  platform_fee_charged BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_ride_id UUID,
  related_delivery_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ride_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL UNIQUE,
  passenger_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS passenger_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  passenger_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- END OF EXPORT
-- ============================================
