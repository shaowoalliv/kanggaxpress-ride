import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/services/pushNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface Delivery {
  id: string;
  status: string;
  negotiation_status?: string;
  [key: string]: any;
}

export const useDeliveryRealtimeUpdates = (deliveryId: string, onUpdate?: (delivery: Delivery) => void) => {
  const [courierLocation, setCourierLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { user } = useAuth();

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
          const newDelivery = payload.new as Delivery;
          const oldDelivery = payload.old as Delivery;
          
          // Send push notification if status changed
          if (newDelivery.status !== oldDelivery?.status && user?.id) {
            notificationService.sendDeliveryNotification(
              user.id,
              deliveryId,
              newDelivery.status || ''
            );
          }
          
          if (onUpdate) {
            onUpdate(newDelivery);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deliveryChannel);
    };
  }, [deliveryId, onUpdate, user]);

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
