import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { deliveriesService } from '@/services/deliveries';
import { DeliveryOrder } from '@/types';
import { MapPin, Package, User, Calendar, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useDeliveryNegotiation } from '@/hooks/useDeliveryNegotiation';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

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
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  
  // Realtime subscription for delivery updates
  useEffect(() => {
    if (!profile?.id || deliveries.length === 0) return;

    const channel = supabase
      .channel('sender-deliveries')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_orders',
          filter: `sender_id=eq.${profile.id}`
        },
        (payload) => {
          setDeliveries(current =>
            current.map(d => d.id === payload.new.id ? payload.new as DeliveryOrder : d)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, deliveries.length]);

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
              {deliveries.map((delivery) => {
                const hasNegotiation = delivery.negotiation_status === 'pending';
                const { acceptNegotiation, rejectNegotiation, loading: negotiationLoading } = 
                  useDeliveryNegotiation(delivery.id);

                return (
                  <ThemedCard key={delivery.id}>
                    <div className="space-y-3">
                      {hasNegotiation && (
                        <Alert className="border-secondary">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-3">
                              <p className="font-semibold">Courier Counter-Offer</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Base Fare</p>
                                  <p className="font-medium">₱{(delivery.base_fare || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Additional Requested</p>
                                  <p className="font-medium text-secondary">
                                    +₱{(delivery.proposed_top_up_fare || 0).toFixed(2)}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-muted-foreground">Total</p>
                                  <p className="text-lg font-bold text-primary">
                                    ₱{((delivery.base_fare || 0) + (delivery.proposed_top_up_fare || 0)).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              {delivery.negotiation_notes && (
                                <p className="text-sm text-muted-foreground italic">
                                  "{delivery.negotiation_notes}"
                                </p>
                              )}
                              <div className="flex gap-2">
                                <PrimaryButton
                                  onClick={async () => {
                                    await acceptNegotiation();
                                    loadDeliveries();
                                  }}
                                  disabled={negotiationLoading}
                                  className="flex-1"
                                >
                                  Accept
                                </PrimaryButton>
                                <SecondaryButton
                                  onClick={async () => {
                                    await rejectNegotiation();
                                    loadDeliveries();
                                  }}
                                  disabled={negotiationLoading}
                                  className="flex-1"
                                >
                                  Reject
                                </SecondaryButton>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

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
                          {delivery.total_fare && (
                            <p className="text-sm font-semibold text-primary mt-1">
                              ₱{delivery.total_fare.toFixed(2)}
                            </p>
                          )}
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
                        <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
