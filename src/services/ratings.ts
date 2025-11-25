import { supabase } from '@/integrations/supabase/client';

export interface RideRating {
  id: string;
  ride_id: string;
  passenger_id: string;
  driver_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRatingData {
  ride_id: string;
  driver_id: string;
  rating: number;
  review_text?: string;
}

export const ratingsService = {
  // Submit a rating for a completed ride
  async submitRating(passengerId: string, data: CreateRatingData): Promise<RideRating> {
    const { data: rating, error } = await supabase
      .from('ride_ratings')
      .insert({
        passenger_id: passengerId,
        driver_id: data.driver_id,
        ride_id: data.ride_id,
        rating: data.rating,
        review_text: data.review_text || null,
      })
      .select()
      .single();

    if (error) throw error;
    return rating as RideRating;
  },

  // Check if a ride has been rated
  async getRatingForRide(rideId: string): Promise<RideRating | null> {
    const { data, error } = await supabase
      .from('ride_ratings')
      .select('*')
      .eq('ride_id', rideId)
      .maybeSingle();

    if (error) throw error;
    return data as RideRating | null;
  },

  // Get all ratings for a driver
  async getDriverRatings(driverId: string): Promise<RideRating[]> {
    const { data, error } = await supabase
      .from('ride_ratings')
      .select(`
        *,
        passenger:profiles!ride_ratings_passenger_id_fkey(full_name)
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as RideRating[];
  },

  // Get passenger's submitted ratings
  async getPassengerRatings(passengerId: string): Promise<RideRating[]> {
    const { data, error } = await supabase
      .from('ride_ratings')
      .select(`
        *,
        driver:profiles!ride_ratings_driver_id_fkey(full_name)
      `)
      .eq('passenger_id', passengerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as RideRating[];
  },
};
