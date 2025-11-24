import { supabase } from '@/integrations/supabase/client';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    rideId?: string;
    deliveryId?: string;
    type?: 'ride' | 'delivery';
    status?: string;
  };
}

export const notificationService = {
  /**
   * Send a push notification for ride status updates
   */
  async sendRideNotification(
    userId: string,
    rideId: string,
    status: string,
    driverName?: string
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: this.getRideTitleByStatus(status),
      body: this.getRideBodyByStatus(status, driverName),
      data: {
        rideId,
        type: 'ride',
        status,
      },
    };

    await this.sendNotification(userId, payload);
  },

  /**
   * Send a push notification for delivery status updates
   */
  async sendDeliveryNotification(
    userId: string,
    deliveryId: string,
    status: string,
    courierName?: string
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: this.getDeliveryTitleByStatus(status),
      body: this.getDeliveryBodyByStatus(status, courierName),
      data: {
        deliveryId,
        type: 'delivery',
        status,
      },
    };

    await this.sendNotification(userId, payload);
  },

  /**
   * Send notification via backend edge function
   */
  async sendNotification(userId: string, payload: NotificationPayload): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          ...payload,
        },
      });

      if (error) {
        console.error('Error sending push notification:', error);
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  },

  getRideTitleByStatus(status: string): string {
    const titles: Record<string, string> = {
      requested: 'Ride Requested',
      accepted: 'Driver Found!',
      in_progress: 'Ride Started',
      completed: 'Ride Completed',
      cancelled: 'Ride Cancelled',
    };
    return titles[status] || 'Ride Update';
  },

  getRideBodyByStatus(status: string, driverName?: string): string {
    const bodies: Record<string, string> = {
      requested: 'Looking for drivers nearby...',
      accepted: driverName 
        ? `${driverName} is on the way to pick you up` 
        : 'A driver accepted your ride',
      in_progress: 'Your ride is in progress',
      completed: 'Thank you for riding with KanggaXpress!',
      cancelled: 'Your ride has been cancelled',
    };
    return bodies[status] || 'Your ride status has been updated';
  },

  getDeliveryTitleByStatus(status: string): string {
    const titles: Record<string, string> = {
      requested: 'Delivery Requested',
      assigned: 'Courier Assigned!',
      picked_up: 'Package Picked Up',
      in_transit: 'Package In Transit',
      delivered: 'Package Delivered',
      cancelled: 'Delivery Cancelled',
    };
    return titles[status] || 'Delivery Update';
  },

  getDeliveryBodyByStatus(status: string, courierName?: string): string {
    const bodies: Record<string, string> = {
      requested: 'Looking for available couriers...',
      assigned: courierName 
        ? `${courierName} will handle your delivery` 
        : 'A courier has been assigned',
      picked_up: 'Your package has been picked up',
      in_transit: 'Your package is on the way',
      delivered: 'Your package has been delivered!',
      cancelled: 'Your delivery has been cancelled',
    };
    return bodies[status] || 'Your delivery status has been updated';
  },
};
