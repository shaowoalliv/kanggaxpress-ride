import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Car, Package } from 'lucide-react';
import { ThemedCard } from '@/components/ui/ThemedCard';

export function ModeSwitcher() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const isRideRole = profile.role === 'passenger' || profile.role === 'driver';
  const isDeliveryRole = profile.role === 'sender' || profile.role === 'courier';

  // Only show switcher if user can access multiple modes
  // For now, users are locked to one role, but this is ready for future multi-role support
  if (!isRideRole && !isDeliveryRole) return null;

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {(isRideRole || profile.role === 'passenger') && (
        <ThemedCard
          onClick={() => {
            if (profile.role === 'driver') {
              navigate('/driver/dashboard');
            } else {
              navigate('/passenger/book-ride');
            }
          }}
          className="text-center cursor-pointer hover:ring-2 hover:ring-primary"
        >
          <Car className="w-8 h-8 mx-auto mb-2 text-secondary" />
          <p className="font-semibold text-sm">Rides</p>
        </ThemedCard>
      )}
      
      {(isDeliveryRole || profile.role === 'sender') && (
        <ThemedCard
          onClick={() => {
            if (profile.role === 'courier') {
              navigate('/courier/dashboard');
            } else {
              navigate('/sender/create-delivery');
            }
          }}
          className="text-center cursor-pointer hover:ring-2 hover:ring-primary"
        >
          <Package className="w-8 h-8 mx-auto mb-2 text-secondary" />
          <p className="font-semibold text-sm">Deliveries</p>
        </ThemedCard>
      )}
    </div>
  );
}
