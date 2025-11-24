import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const { toast } = useToast();

  useEffect(() => {
    const initPushNotifications = async () => {
      // Request permission to use push notifications
      const permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        const permission = await PushNotifications.requestPermissions();
        
        if (permission.receive !== 'granted') {
          console.log('Push notification permission denied');
          return;
        }
      }

      if (permStatus.receive === 'denied') {
        console.log('Push notification permission denied');
        return;
      }

      // Register with Apple / Google to receive push via APNS/FCM
      await PushNotifications.register();

      // On success, we should be able to receive notifications
      await PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
        // TODO: Send this token to your backend to associate with the user
      });

      // Some issue with the registration
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      // Show us the notification payload if the app is open on our device
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification);
        
        toast({
          title: notification.title || 'New Notification',
          description: notification.body || '',
        });
      });

      // Method called when tapping on a notification
      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification.actionId, notification.notification);
        
        // Handle navigation based on notification data
        const data = notification.notification.data;
        if (data?.rideId) {
          // Navigate to ride status
          window.location.href = `/passenger/ride-status?id=${data.rideId}`;
        } else if (data?.deliveryId) {
          // Navigate to delivery status
          window.location.href = `/sender/my-deliveries`;
        }
      });
    };

    initPushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [toast]);
};
