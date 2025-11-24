import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ride } from '@/types';

export const useRideRealtimeUpdates = (rideId: string, onUpdate?: (ride: Ride) => void) => {
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Subscribe to ride updates
    const rideChannel = supabase
      .channel(`ride:${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`
        },
        (payload) => {
          console.log('[Realtime] Ride updated:', payload.new);
          if (onUpdate) {
            onUpdate(payload.new as Ride);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rideChannel);
    };
  }, [rideId, onUpdate]);

  useEffect(() => {
    // Subscribe to driver location updates
    const locationChannel = supabase
      .channel('driver-locations')
      .on('broadcast', { event: 'location_update' }, (payload) => {
        console.log('[Realtime] Driver location update:', payload);
        setDriverLocation({ lat: payload.lat, lng: payload.lng });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(locationChannel);
    };
  }, []);

  return { driverLocation };
};
