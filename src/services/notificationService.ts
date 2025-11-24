import { supabase } from '@/integrations/supabase/client';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedRideId?: string;
  relatedDeliveryId?: string;
}

export const notificationService = {
  // Create a notification
  async createNotification(params: CreateNotificationParams) {
    const { error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      related_ride_id: params.relatedRideId,
      related_delivery_id: params.relatedDeliveryId,
    });

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Notify driver of new ride request
  async notifyDriverOfRide(driverId: string, rideId: string, pickupLocation: string) {
    await this.createNotification({
      userId: driverId,
      type: 'ride_request',
      title: 'New Ride Request',
      message: `Pickup at ${pickupLocation}`,
      relatedRideId: rideId,
    });
  },

  // Notify passenger of ride update
  async notifyPassengerOfRideStatus(
    passengerId: string,
    rideId: string,
    status: string,
    driverName?: string
  ) {
    const statusMessages: Record<string, { title: string; message: string }> = {
      accepted: {
        title: 'Driver Accepted',
        message: `${driverName || 'A driver'} accepted your ride request`,
      },
      in_progress: {
        title: 'Ride Started',
        message: 'Your driver has started the trip',
      },
      completed: {
        title: 'Ride Completed',
        message: 'Your ride has been completed. Thank you!',
      },
      cancelled: {
        title: 'Ride Cancelled',
        message: 'Your ride has been cancelled',
      },
    };

    const statusInfo = statusMessages[status] || {
      title: 'Ride Update',
      message: `Your ride status: ${status}`,
    };

    await this.createNotification({
      userId: passengerId,
      type: 'ride_status',
      title: statusInfo.title,
      message: statusInfo.message,
      relatedRideId: rideId,
    });
  },

  // Notify courier of new delivery request
  async notifyCourierOfDelivery(courierId: string, deliveryId: string, pickupAddress: string) {
    await this.createNotification({
      userId: courierId,
      type: 'delivery_request',
      title: 'New Delivery Request',
      message: `Pickup at ${pickupAddress}`,
      relatedDeliveryId: deliveryId,
    });
  },

  // Notify sender of delivery update
  async notifySenderOfDeliveryStatus(
    senderId: string,
    deliveryId: string,
    status: string,
    courierName?: string
  ) {
    const statusMessages: Record<string, { title: string; message: string }> = {
      assigned: {
        title: 'Courier Assigned',
        message: `${courierName || 'A courier'} will pick up your package`,
      },
      picked_up: {
        title: 'Package Picked Up',
        message: 'Your package has been picked up',
      },
      in_transit: {
        title: 'In Transit',
        message: 'Your package is on its way',
      },
      delivered: {
        title: 'Delivered',
        message: 'Your package has been delivered',
      },
      cancelled: {
        title: 'Delivery Cancelled',
        message: 'Your delivery has been cancelled',
      },
    };

    const statusInfo = statusMessages[status] || {
      title: 'Delivery Update',
      message: `Delivery status: ${status}`,
    };

    await this.createNotification({
      userId: senderId,
      type: 'delivery_status',
      title: statusInfo.title,
      message: statusInfo.message,
      relatedDeliveryId: deliveryId,
    });
  },
};
