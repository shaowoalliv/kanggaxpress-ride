export type UserRole = 'passenger' | 'driver';
export type RideType = 'motor' | 'tricycle' | 'car';
export type RideStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

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
  fare_estimate: number | null;
  fare_final: number | null;
  passenger_count: number;
  notes: string | null;
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
