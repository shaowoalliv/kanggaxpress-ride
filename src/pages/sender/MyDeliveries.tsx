import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { deliveriesService } from '@/services/deliveries';
import { DeliveryOrder } from '@/types';
import { MapPin, Package, User, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  requested: 'text-primary',
  assigned: 'text-success',
  picked_up: 'text-secondary',
  in_transit: 'text-secondary',
  delivered: 'text-muted-foreground',
  cancelled: 'text-destructive',
};

const statusLabels = {
  requested: 'Looking for courier',
  assigned: 'Courier assigned',
  picked_up: 'Package picked up',
  in_transit: 'In transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function MyDeliveries() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile?.role !== 'sender') {
      navigate('/');
    } else {
      loadDeliveries();
    }
  }, [user, profile, navigate]);

  const loadDeliveries = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      const data = await deliveriesService.getSenderDeliveries(profile.id);
      setDeliveries(data);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile || profile.role !== 'sender') {
    return null;
  }

  return (
    <PageLayout>
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">
                My Deliveries
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your delivery requests
              </p>
            </div>
            <button
              onClick={() => navigate('/sender/create-delivery')}
              className="text-secondary font-medium hover:underline"
            >
              New Delivery
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
          ) : deliveries.length === 0 ? (
            <ThemedCard>
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No deliveries yet</p>
                <button
                  onClick={() => navigate('/sender/create-delivery')}
                  className="mt-4 text-secondary font-medium hover:underline"
                >
                  Create your first delivery →
                </button>
              </div>
            </ThemedCard>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <ThemedCard key={delivery.id}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className={`font-semibold ${statusColors[delivery.status]}`}>
                          {statusLabels[delivery.status]}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {delivery.package_size} package
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {delivery.package_description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Pickup</p>
                          <p className="text-muted-foreground">{delivery.pickup_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                        <div>
                          <p className="font-medium">Drop-off</p>
                          <p className="text-muted-foreground">{delivery.dropoff_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 mt-0.5" />
                        <div>
                          <p className="font-medium">Receiver</p>
                          <p className="text-muted-foreground">
                            {delivery.receiver_name} • {delivery.receiver_phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    {delivery.cod_amount && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">COD Amount: ₱{delivery.cod_amount}</p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(delivery.created_at), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(delivery.created_at), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                </ThemedCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
