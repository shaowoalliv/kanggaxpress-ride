import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  updatedAt: string;
}

interface UseCourierLocationPublisherProps {
  courierId: string | null;
  isAvailable: boolean;
  hasActiveDelivery: boolean;
}

export const useCourierLocationPublisher = ({
  courierId,
  isAvailable,
  hasActiveDelivery,
}: UseCourierLocationPublisherProps) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const shouldPublish = isAvailable || hasActiveDelivery;

  const publishLocation = useCallback(async (lat: number, lng: number) => {
    if (!courierId || !shouldPublish) return;

    try {
      // Update database
      await supabase
        .from('courier_profiles')
        .update({
          current_lat: lat,
          current_lng: lng,
          location_updated_at: new Date().toISOString(),
        })
        .eq('user_id', courierId);

      // Publish via Realtime channel
      const channel = supabase.channel(`courier_presence:${courierId}`);
      await channel.send({
        type: 'broadcast',
        event: 'location_update',
        payload: {
          lat,
          lng,
          updatedAt: new Date().toISOString(),
        },
      });

      console.log('[GPS] Published courier location:', { lat, lng });
    } catch (err) {
      console.error('[GPS] Error publishing location:', err);
    }
  }, [courierId, shouldPublish]);

  useEffect(() => {
    if (!shouldPublish || !courierId) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          updatedAt: new Date().toISOString(),
        };

        setLocation(newLocation);
        setError(null);
        publishLocation(newLocation.lat, newLocation.lng);
      },
      (err) => {
        console.error('[GPS] Geolocation error:', err);
        
        let errorMessage = 'Unable to get your location';
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = 'Location permissions are required for senders to see your live position';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable';
        } else if (err.code === err.TIMEOUT) {
          errorMessage = 'Location request timed out';
        }
        
        setError(errorMessage);
        
        if (err.code === err.PERMISSION_DENIED && !error) {
          toast.error('Location Access Required', {
            description: errorMessage,
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setWatchId(id);

    return () => {
      navigator.geolocation.clearWatch(id);
    };
  }, [courierId, shouldPublish, publishLocation, error]);

  return { location, error };
};
