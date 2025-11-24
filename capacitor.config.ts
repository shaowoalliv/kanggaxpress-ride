import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b4592a0268694c5cbafa73bc90a7e646',
  appName: 'kangga-express-ride',
  webDir: 'dist',
  server: {
    url: 'https://b4592a02-6869-4c5c-bafa-73bc90a7e646.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
