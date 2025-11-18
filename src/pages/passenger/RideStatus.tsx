import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Car, Loader2, ArrowLeft } from 'lucide-react';

export default function RideStatus() {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFareConfirm, setShowFareConfirm] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!rideId) {
      toast.error('Invalid ride ID');
      navigate('/passenger/book-ride');
      return;
    }

    fetchRide();

    // Set up realtime subscription
    const channel = supabase
      .channel(`ride-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`,
        },
        (payload) => {
          setRide(payload.new);
          if (payload.new.status === 'accepted') {
            setShowFareConfirm(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, navigate]);

  const fetchRide = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (error) throw error;

      setRide(data);
    } catch (error) {
      console.error('Error fetching ride:', error);
      toast.error('Failed to load ride details');
      navigate('/passenger/book-ride');
    } finally {
      setLoading(false);
    }
  };

  const getServiceName = (rideType: string) => {
    const map: Record<string, string> = {
      'car': 'Car',
      'motor': 'Motorcycle',
      'tricycle': 'Tricycle',
    };
    return map[rideType] || rideType.toUpperCase();
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'requested') return 'SEARCHING FOR DRIVER';
    if (status === 'accepted') return 'DRIVER FOUND - WAITING FOR YOUR CONFIRMATION';
    if (status === 'in_progress') return 'DRIVER CONFIRMED - RIDE IN PROGRESS';
    if (status === 'completed') return 'RIDE COMPLETED';
    if (status === 'cancelled') return 'RIDE CANCELLED';
    return status.toUpperCase().replace('_', ' ');
  };

  const handleAcceptFare = async () => {
    try {
      setAccepting(true);
      const { error } = await supabase
        .from('rides')
        .update({ status: 'in_progress' })
        .eq('id', rideId);

      if (error) throw error;

      setShowFareConfirm(false);
      toast.success('Ride confirmed! Your driver is on the way.');
    } catch (error) {
      console.error('Error accepting fare:', error);
      toast.error('Failed to confirm ride');
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectFare = async () => {
    try {
      setAccepting(true);
      const { error } = await supabase
        .from('rides')
        .update({ 
          status: 'requested',
          driver_id: null,
          top_up_fare: 0,
          total_fare: ride.base_fare,
        })
        .eq('id', rideId);

      if (error) throw error;

      setShowFareConfirm(false);
      toast.info('Searching for another driver...');
    } catch (error) {
      console.error('Error rejecting fare:', error);
      toast.error('Failed to reject offer');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!ride) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Ride not found</p>
            <PrimaryButton onClick={() => navigate('/passenger/book-ride')}>
              Book a New Ride
            </PrimaryButton>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Completed ride view
  if (ride.status === 'completed') {
    return (
      <PageLayout>
        <div className="flex-1 w-full bg-background">
          <div className="bg-primary px-4 py-6 text-primary-foreground">
            <h1 className="text-2xl font-heading font-bold">Ride Completed</h1>
          </div>

          <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
            <ThemedCard className="bg-primary/5 border-primary/20">
              <div className="text-center py-4">
                <p className="text-lg font-semibold text-primary mb-2">Thank you for riding with us!</p>
                <p className="text-sm text-muted-foreground">Your ride has been completed.</p>
              </div>
            </ThemedCard>

            {/* Route Details */}
            <ThemedCard>
              <h2 className="text-lg font-semibold mb-4">Trip Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Pickup</p>
                    <p className="font-medium">{ride.pickup_location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Drop-off</p>
                    <p className="font-medium">{ride.dropoff_location}</p>
                  </div>
                </div>
              </div>
            </ThemedCard>

            {/* Fare Summary */}
            <ThemedCard>
              <h2 className="text-lg font-semibold mb-4">Fare Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-secondary" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Service Type</p>
                    <p className="font-medium capitalize">{getServiceName(ride.ride_type)}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Base Fare</span>
                    <span className="font-semibold">₱{ride.base_fare}</span>
                  </div>
                  {ride.top_up_fare > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Top-up Fare</span>
                      <span className="font-semibold">₱{ride.top_up_fare}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-lg font-bold">Total Fare</span>
                    <span className="text-2xl font-bold text-primary">₱{ride.total_fare}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Fare is payable directly to the driver (cash or e-wallet).
                  </p>
                </div>
              </div>
            </ThemedCard>

            <div className="pt-4">
              <PrimaryButton onClick={() => navigate('/passenger/my-rides')} className="w-full">
                Back to My Rides
              </PrimaryButton>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Active ride view (requested, accepted, in_progress)
  return (
    <PageLayout>
      <div className="flex-1 w-full bg-background">
        <div className="bg-primary px-4 py-6 text-primary-foreground">
          <button
            onClick={() => navigate('/passenger/my-rides')}
            className="flex items-center gap-2 mb-4 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-heading font-bold">Ride Status</h1>
        </div>

        <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
          {/* Status Banner */}
          <ThemedCard className="bg-secondary/5 border-secondary/20">
            <div className="text-center py-4">
              <p className="text-lg font-semibold text-secondary mb-2">
                {getStatusDisplay(ride.status)}
              </p>
              <div className="flex justify-center mt-4">
                <Loader2 className="w-8 h-8 animate-spin text-secondary" />
              </div>
            </div>
          </ThemedCard>

          {/* Route Details */}
          <ThemedCard>
            <h2 className="text-lg font-semibold mb-4">Your Trip</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <p className="font-medium">{ride.pickup_location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Drop-off</p>
                  <p className="font-medium">{ride.dropoff_location}</p>
                </div>
              </div>
            </div>
          </ThemedCard>

          {/* Service & Fare */}
          <ThemedCard>
            <h2 className="text-lg font-semibold mb-4">Service & Fare</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-secondary" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium capitalize">{getServiceName(ride.ride_type)}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Estimated Fare</span>
                  <span className="text-2xl font-bold text-primary">
                    ₱{ride.total_fare || ride.base_fare || '—'}
                  </span>
                </div>
              </div>
            </div>
          </ThemedCard>
        </div>

        {/* Fare Confirmation Modal */}
        <Dialog open={showFareConfirm} onOpenChange={setShowFareConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Driver Found!</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                A driver has accepted your request with the following fare:
              </p>

              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Base Fare</span>
                  <span className="font-semibold">₱{ride.base_fare}</span>
                </div>
                {ride.top_up_fare > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Top-up</span>
                    <span className="font-semibold">₱{ride.top_up_fare}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-bold">Total Fare</span>
                  <span className="text-xl font-bold text-primary">₱{ride.total_fare}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Fare is payable directly to the driver upon completion.
              </p>

              <div className="flex gap-3 pt-2">
                <SecondaryButton
                  onClick={handleRejectFare}
                  disabled={accepting}
                  className="flex-1"
                >
                  Reject
                </SecondaryButton>
                <PrimaryButton
                  onClick={handleAcceptFare}
                  disabled={accepting}
                  isLoading={accepting}
                  className="flex-1"
                >
                  Accept Fare
                </PrimaryButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
