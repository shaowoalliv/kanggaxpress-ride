export type UserRole = 'passenger' | 'driver' | 'sender' | 'courier';
export type RideType = 'motor' | 'tricycle' | 'car';
export type RideStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type PackageSize = 'small' | 'medium' | 'large';
export type DeliveryStatus = 'requested' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  vehicle_type: RideType;
  vehicle_plate: string;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_number: string | null;
  is_available: boolean;
  rating: number;
  total_rides: number;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ride {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  pickup_location: string;
  dropoff_location: string;
  ride_type: RideType;
  status: RideStatus;
  base_fare: number | null;
  top_up_fare: number | null;
  total_fare: number | null;
  fare_estimate: number | null;
  fare_final: number | null;
  app_fee: number | null;
  passenger_count: number;
  notes: string | null;
  cancellation_reason: string | null;
  platform_fee_charged: boolean;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface RideWithDetails extends Ride {
  passenger?: Profile;
  driver?: DriverProfile;
}

export interface CourierProfile {
  id: string;
  user_id: string;
  vehicle_type: RideType;
  vehicle_plate: string;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_number: string | null;
  is_available: boolean;
  rating: number;
  total_deliveries: number;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryOrder {
  id: string;
  sender_id: string;
  courier_id: string | null;
  pickup_address: string;
  dropoff_address: string;
  package_description: string;
  package_size: PackageSize;
  cod_amount: number | null;
  receiver_name: string;
  receiver_phone: string;
  status: DeliveryStatus;
  base_fare: number | null;
  top_up_fare: number | null;
  total_fare: number | null;
  app_fee: number | null;
  negotiation_status: string | null;
  negotiation_notes: string | null;
  proposed_top_up_fare: number | null;
  cancellation_reason: string | null;
  platform_fee_charged: boolean;
  created_at: string;
  updated_at: string;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
}

export interface DeliveryOrderWithDetails extends DeliveryOrder {
  sender?: Profile;
  courier?: CourierProfile;
}
