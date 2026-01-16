import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PassengerRideMap } from '@/components/PassengerRideMap';
import { FareNegotiationAlert } from '@/components/negotiation/FareNegotiationAlert';
import { RatingModal } from '@/components/ratings/RatingModal';
import { DriverRatingDisplay } from '@/components/ratings/DriverRatingDisplay';
import { useRideNegotiation } from '@/hooks/useRideNegotiation';
import { useRideRealtimeUpdates } from '@/hooks/useRideRealtimeUpdates';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ratingsService } from '@/services/ratings';
import { toast } from 'sonner';
import { MapPin, Car, Loader2, ArrowLeft, Clock } from 'lucide-react';
import { calculateETAFromTo } from '@/lib/etaCalculator';
import { ridesService } from '@/services/rides';
import { CounterOfferModal } from '@/components/negotiation/CounterOfferModal';


export default function RideStatus() {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showNegotiationAlert, setShowNegotiationAlert] = useState(false);
  const [eta, setEta] = useState<{ distanceKm: number; durationMinutes: number; etaText: string } | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [driverProfile, setDriverProfile] = useState<any>(null);

  // For search timeout
  const [searchStart, setSearchStart] = useState<number | null>(null);
  const [searchTimedOut, setSearchTimedOut] = useState(false);
  const MAX_WAIT_TIME = 5 * 60 * 1000;

  // Counter offer modal state
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  // Real-time updates - consolidated to avoid duplicate subscriptions
  useRideRealtimeUpdates(rideId || '', (updatedRide) => {
    console.log('[RideStatus] Real-time update received:', updatedRide);
    setRide(updatedRide);
    
    // Show negotiation alert if pending
    if ((updatedRide as any).negotiation_status === 'pending' && !showNegotiationAlert) {
      setShowNegotiationAlert(true);
    }

    // Show rating modal when ride is completed
    if (updatedRide.status === 'completed' && !hasRated) {
      checkAndShowRatingModal(updatedRide);
    }
  });

  const { acceptNegotiation, rejectNegotiation } = useRideNegotiation(rideId || '');

  useEffect(() => {
    if (!rideId) {
      toast.error('Invalid ride ID');
      navigate('/passenger/book-ride');
      return;
    }

    fetchRide();
  }, [rideId, navigate]);

  // Check if ride has been rated when component mounts
  useEffect(() => {
    if (rideId) {
      checkIfRated();
    }
  }, [rideId]);

  const checkIfRated = async () => {
    try {
      const rating = await ratingsService.getRatingForRide(rideId!);
      setHasRated(!!rating);
    } catch (error) {
      console.error('Error checking rating:', error);
    }
  };

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

  // Calculate ETA when driver location updates
  useEffect(() => {
    if (!driverLocation || !ride) return;

    // Calculate ETA to pickup if ride is accepted, or to dropoff if in progress
    const targetLat = ride.status === 'accepted' ? ride.pickup_lat : ride.dropoff_lat;
    const targetLng = ride.status === 'accepted' ? ride.pickup_lng : ride.dropoff_lng;

    if (targetLat && targetLng) {
      const etaResult = calculateETAFromTo(
        driverLocation.lat,
        driverLocation.lng,
        targetLat,
        targetLng
      );
      setEta(etaResult);
    }
  }, [driverLocation, ride]);

  // Timeout

    useEffect(() => {
    if (ride?.status === 'requested') {
      setSearchStart(Date.now());
      setSearchTimedOut(false);
    }
   }, [ride?.id, ride?.status]);

    useEffect(() => {
    if (!ride || ride.status !== 'requested'|| searchStart === null) return;
    

    const timeoutId = setTimeout(() => {
      console.log('Search timed out after 5 minutes');
      setSearchTimedOut(true);
    }, MAX_WAIT_TIME);

    return () => clearTimeout(timeoutId);

  }, [searchStart, ride?.status]);

  useEffect(() => {
    console.log('Ride status:', ride?.status);
    console.log('searchTimedOut:', searchTimedOut);
  }, [ride?.status, searchTimedOut]);


  const fetchRide = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:driver_profiles!rides_driver_id_fkey(
            rating,
            total_rides,
            vehicle_type,
            vehicle_plate
          )
        `)
        .eq('id', rideId)
        .single();

      if (error) throw error;

      setRide(data);
      
      // Check if completed and should show rating
      if (data.status === 'completed' && !hasRated) {
        checkAndShowRatingModal(data);
      }
    } catch (error) {
      console.error('Error fetching ride:', error);
      toast.error('Failed to load ride details');
      navigate('/passenger/book-ride');
    } finally {
      setLoading(false);
    }
  };

  const checkAndShowRatingModal = async (completedRide: any) => {
    try {
      const rating = await ratingsService.getRatingForRide(completedRide.id);
      if (!rating) {
        // Fetch driver profile for rating modal
        const { data: driverData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', completedRide.driver_id)
          .maybeSingle();
        
        setDriverProfile(driverData);
        setShowRatingModal(true);
      } else {
        setHasRated(true);
      }
    } catch (error) {
      console.error('Error checking rating:', error);
    }
  };

  const handleSubmitRating = async (rating: number, review: string) => {
    if (!profile || !ride) return;

    try {
      await ratingsService.submitRating(profile.id, {
        ride_id: ride.id,
        driver_id: ride.driver_id,
        rating,
        review_text: review,
      });
      
      setHasRated(true);
      setShowRatingModal(false);
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      throw error;
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

  const getStatusDisplay = (status: string, searchTimedOut?: boolean, cancellation_reason?: string) => {
    if (status === 'requested') {
      return searchTimedOut ? 'No drivers available' : 'Looking for drivers...';
    }
    if (status === 'cancelled' && ride.cancellation_reason === 'Driver no-show timeout') {
      return 'Ride cancelled. Driver did not arrive.';
    }
    if (status === 'arrived') return 'Driver Arrived';
    if (status === 'accepted') return 'Driver Assigned';
    if (status === 'in_progress') return 'Ride In Progress';
    if (status === 'completed') return 'Ride Completed';
    if (status === 'cancelled') return 'Ride Cancelled';
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
              
              {/* Driver Rating Display */}
              {ride.driver && (
                <div className="flex items-center justify-center gap-2 p-3 mt-4 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Driver Rating:</span>
                  <DriverRatingDisplay 
                    rating={ride.driver.rating || 5}
                    totalRatings={ride.driver.total_rides || 0}
                    size="sm"
                  />
                </div>
              )}
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

            {/* Rating Button */}
            {!hasRated && (
              <PrimaryButton
                onClick={() => {
                  setDriverProfile({ full_name: 'Your Driver' });
                  setShowRatingModal(true);
                }}
                className="w-full mb-3"
              >
                Rate Your Driver
              </PrimaryButton>
            )}

            {hasRated && (
              <div className="p-3 bg-success/10 rounded-lg text-center mb-3">
                <p className="text-sm text-success font-medium">✓ You've rated this ride</p>
              </div>
            )}

            <SecondaryButton onClick={() => navigate('/passenger/my-rides')} className="w-full">
              Back to My Rides
            </SecondaryButton>
          </ThemedCard>
        </div>
      </PageLayout>
    );
  };

  const handleAcceptFare = async () => {
    if (!rideId) return;

    try {
      setAccepting(true);
      await ridesService.updateRideStatus(rideId, 'in_progress');
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

      toast.info('Searching for another driver...');
    } catch (error) {
      console.error('Error rejecting fare:', error);
      toast.error('Failed to reject offer');
    } finally {
      setAccepting(false);
    }
  };

  // For Cancel button
  const handleCancelRide = async () => {
    if (!ride) return;

    try {
      await ridesService.cancelRide(
        ride.id,
        'Passenger cancelled',
        profile?.id
      );
      navigate('/passenger/my-rides');
      toast.success('Ride cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel ride');
    }
  };

  // // Passenger submits counter-offer
  // const handleSubmitCounterOffer = async (additionalFare: number, notes: string) => {
  //   if (!rideId) return;
  //   try {
  //     setActionLoading(true);
  //     await ridesService.passengerProposeFareNegotiation(
  //       rideId, 
  //       additionalFare, 
  //       notes
  //     );
  //     toast.success('Counter offer sent to driver');
  //     setShowCounterOfferModal(false);
  //   } catch (error: any) {
  //     console.error('Error proposing counter offer:', error);
  //     toast.error(error.message || 'Failed to send counter offer');
  //     throw error;
  //   } finally {
  //     setActionLoading(false);
  //   }
  // };

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
    <>
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
          {/* Negotiation Alert */}
          {showNegotiationAlert && ride?.negotiation_status === 'pending' && (
            <FareNegotiationAlert
              open={showNegotiationAlert}
              baseFare={ride.base_fare || 0}
              proposedFare={(ride.base_fare || 0) + (ride.proposed_top_up_fare || 0)}
              topUpAmount={ride.proposed_top_up_fare || 0}
              reason={ride.negotiation_notes || 'Driver counter-offer'}
              onAccept={async () => {
                try {
                  await acceptNegotiation();
                  setShowNegotiationAlert(false);
                } catch (error) {
                  console.error(error);
                }
              }}
              onReject={async () => {
                try {
                  await rejectNegotiation();
                  setShowNegotiationAlert(false);
                } catch (error) {
                  console.error(error);
                }
              }}
            />
          )}

          {/* Counter Offer Modal
            <CounterOfferModal
              open={showCounterOfferModal}
              onClose={() => {
                setShowCounterOfferModal(false);
              }}
              onSubmit={async (topUpAmount, reason, notes) => {
                try {
                  await handleSubmitCounterOffer(topUpAmount, notes || reason);
                  setShowCounterOfferModal(false);
                } catch (error) {
                  console.error(error);
                }
              }}
              baseFare={ride?.base_fare || 0}
            /> */}

          {/* ETA Display */}
          {eta && driverLocation && (ride?.status === 'accepted' || ride?.status === 'arrived' || ride?.status === 'in_progress') && (
            <ThemedCard className="bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3 py-3">
                <Clock className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Driver arriving in {eta.etaText}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {eta.distanceKm} km away
                  </p>
                </div>
              </div>
            </ThemedCard>
          )}

          {/* Map */}
          {(ride?.status === 'accepted' || ride?.status === 'arrived' || ride?.status === 'in_progress') && (
            <ThemedCard className="p-0 overflow-hidden">
              <PassengerRideMap
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
                {getStatusDisplay(ride.status, searchTimedOut)}
              </p>
              <div className="flex justify-center mt-4">
                {ride.status === 'requested' && !searchTimedOut && ( 
                  <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                )}
              </div>

            {/* TRY AGAIN button */}
            {searchTimedOut && (
              <PrimaryButton
                onClick={() => {
                  setSearchStart(Date.now());
                  setSearchTimedOut(false);
                  fetchRide();
                  toast.info('Retrying to find drivers...');
                }}
                className="mt-4 w-full">
                  Try Again
                </PrimaryButton>
            )}

            {/* CANCEL BUTTON (only show if ride.status === "requested") */}
              {ride.status === 'requested' && (
                <SecondaryButton
                  onClick={handleCancelRide}
                  className="mt-4 w-full">
                    Cancel Ride
                </SecondaryButton>
              )}
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

      </div>
    </PageLayout>

    {/* Rating Modal */}
    {showRatingModal && (
      <RatingModal
        open={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleSubmitRating}
        driverName={driverProfile?.full_name || 'Your Driver'}
      />
    )}
    </>
  );
}
