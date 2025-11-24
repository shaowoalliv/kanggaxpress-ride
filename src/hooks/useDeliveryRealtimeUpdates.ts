import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Delivery {
  id: string;
  status: string;
  negotiation_status?: string;
  [key: string]: any;
}

export const useDeliveryRealtimeUpdates = (deliveryId: string, onUpdate?: (delivery: Delivery) => void) => {
  const [courierLocation, setCourierLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Subscribe to delivery updates
    const deliveryChannel = supabase
      .channel(`delivery:${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_orders',
          filter: `id=eq.${deliveryId}`
        },
        (payload) => {
          console.log('[Realtime] Delivery updated:', payload.new);
          if (onUpdate) {
            onUpdate(payload.new as Delivery);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deliveryChannel);
    };
  }, [deliveryId, onUpdate]);

  useEffect(() => {
    // Subscribe to courier location updates
    const locationChannel = supabase
      .channel('courier-locations')
      .on('broadcast', { event: 'location_update' }, (payload) => {
        console.log('[Realtime] Courier location update:', payload);
        setCourierLocation({ lat: payload.lat, lng: payload.lng });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(locationChannel);
    };
  }, []);

  return { courierLocation };
};
