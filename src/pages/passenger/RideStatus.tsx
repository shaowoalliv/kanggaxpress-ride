import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RideMap } from '@/components/RideMap';
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
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!rideId) {
      toast.error('Invalid ride ID');
      navigate('/passenger/book-ride');
      return;
    }

    fetchRide();

    // Set up realtime subscription for ride updates
    const rideChannel = supabase
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
      supabase.removeChannel(rideChannel);
    };
  }, [rideId, navigate]);

  // Subscribe to driver location updates
  useEffect(() => {
    if (!ride?.driver_id) return;

    console.log('[RideStatus] Subscribing to driver location:', ride.driver_id);

    const driverChannel = supabase
      .channel(`driver_presence:${ride.driver_id}`)
      .on('broadcast', { event: 'location_update' }, (payload) => {
        console.log('[RideStatus] Received driver location:', payload);
        setDriverLocation({
          lat: payload.payload.lat,
          lng: payload.payload.lng,
        });
      })
      .subscribe();

    // Also fetch initial driver location from driver_profiles
    supabase
      .from('driver_profiles')
      .select('current_lat, current_lng')
      .eq('user_id', ride.driver_id)
      .single()
      .then(({ data }) => {
        if (data?.current_lat && data?.current_lng) {
          setDriverLocation({
            lat: data.current_lat,
            lng: data.current_lng,
          });
        }
      });

    return () => {
      supabase.removeChannel(driverChannel);
    };
  }, [ride?.driver_id]);

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

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!ride) {
    return (
      <PageLayout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Ride not found</p>
          <PrimaryButton onClick={() => navigate('/passenger/book-ride')}>
            Book a Ride
          </PrimaryButton>
        </div>
      </PageLayout>
    );
  }

  // COMPLETED RIDE VIEW
  if (ride.status === 'completed') {
    const finalFare = ride.fare_final ?? ride.total_fare ?? ride.base_fare ?? 0;
    
    return (
      <PageLayout>
        <div className="p-6 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/passenger/my-rides')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Rides
          </button>

          <ThemedCard className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Car className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Ride Completed!</h2>
              <p className="text-sm text-muted-foreground">Thank you for riding with KanggaXpress</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">From</p>
                  <p className="text-sm font-medium">{ride.pickup_location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <MapPin className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">To</p>
                  <p className="text-sm font-medium">{ride.dropoff_location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Car className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Service</p>
                  <p className="text-sm font-medium">{getServiceName(ride.ride_type)}</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Fare</span>
                <span className="font-medium">₱{(ride.base_fare || 0).toFixed(2)}</span>
              </div>
              {ride.top_up_fare > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Top-up Fare</span>
                  <span className="font-medium">₱{ride.top_up_fare.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total Fare</span>
                <span className="text-primary">₱{finalFare.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-amber-900">
                <strong>Note:</strong> Fare is payable directly to the driver (cash or e-wallet).
              </p>
            </div>

            <PrimaryButton onClick={() => navigate('/passenger/my-rides')} className="w-full">
              Back to My Rides
            </PrimaryButton>
          </ThemedCard>
        </div>
      </PageLayout>
    );
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
          {/* Map */}
          {(ride?.status === 'accepted' || ride?.status === 'in_progress') && (
            <ThemedCard className="p-0 overflow-hidden">
              <RideMap
                pickupLat={ride.pickup_lat}
                pickupLng={ride.pickup_lng}
                dropoffLat={ride.dropoff_lat}
                dropoffLng={ride.dropoff_lng}
                driverLat={driverLocation?.lat}
                driverLng={driverLocation?.lng}
                className="h-64 sm:h-80"
              />
              {!driverLocation && (
                <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground text-center">
                  Waiting for driver location...
                </div>
              )}
            </ThemedCard>
          )}

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
