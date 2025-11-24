import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ride } from '@/types';
import { notificationService } from '@/services/pushNotifications';
import { useAuth } from '@/contexts/AuthContext';

export const useRideRealtimeUpdates = (rideId: string, onUpdate?: (ride: Ride) => void) => {
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { user } = useAuth();

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
          const newRide = payload.new as Ride;
          const oldRide = payload.old as Ride;
          
          // Send push notification if status changed
          if (newRide.status !== oldRide?.status && user?.id) {
            notificationService.sendRideNotification(
              user.id,
              rideId,
              newRide.status || ''
            );
          }
          
          if (onUpdate) {
            onUpdate(newRide);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rideChannel);
    };
  }, [rideId, onUpdate, user]);

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
