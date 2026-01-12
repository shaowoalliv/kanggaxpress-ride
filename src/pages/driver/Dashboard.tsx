import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ridesService } from '@/services/rides';
import { driversService } from '@/services/drivers';
import { useDriverLocationPublisher } from '@/hooks/useDriverLocationPublisher';
import { DriverProfile, RideType } from '@/types';
import { toast } from 'sonner';
import { MapPin, User, Clock, Power, PowerOff, Navigation, Wallet as WalletIcon, Map as MapIcon, X, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { kycService } from '@/services/kyc';
import { KycDocument } from '@/types/kyc';
import { KycBlockedAccess } from '@/components/KycBlockedAccess';
import { LowBalanceWarning } from '@/components/LowBalanceWarning';
import { ZeroBalanceModal } from '@/components/ZeroBalanceModal';
import { AvailableRidesMap } from '@/components/AvailableRidesMap';
import { DriverNavigationMap } from '@/components/DriverNavigationMap';
import { FareNegotiationAlert } from '@/components/negotiation/FareNegotiationAlert';
import { CounterOfferModal } from '@/components/negotiation/CounterOfferModal';
import { useRideNegotiation } from '@/hooks/useRideNegotiation';
import { calculateETAFromTo } from '@/lib/etaCalculator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function DriverDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [myRides, setMyRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [kycCheckLoading, setKycCheckLoading] = useState(true);
  const [platformFee, setPlatformFee] = useState<number>(5);
  const [showZeroBalanceModal, setShowZeroBalanceModal] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [showMapView, setShowMapView] = useState(false);
  const [activeRideEta, setActiveRideEta] = useState<{ distanceKm: number; durationMinutes: number; etaText: string } | null>(null);
  
  // Track newly arrived rides for visual highlighting (ride_id -> timestamp)
  const [newRideIds, setNewRideIds] = useState<Set<string>>(new Set());
  
  // Cancel confirmation state
  const [cancelConfirmRideId, setCancelConfirmRideId] = useState<string | null>(null);
  const [cancelledRides, setCancelledRides] = useState<any[]>([]);
  
  // Counter offer modal state
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [selectedRideForCounter, setSelectedRideForCounter] = useState<string | null>(null);

  // For Negotiation Alert
  const [ride, setRide] = useState<any>(null);
  const [showNegotiationAlert, setShowNegotiationAlert] = useState(false);

  // Check if zero balance modal was dismissed this session
  const [zeroBalanceDismissed, setZeroBalanceDismissed] = useState(false);

  const { acceptNegotiation, rejectNegotiation } = useRideNegotiation(ride?.id || '');

  // Get greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    // Fetch platform fee from fare_configs
    const fetchPlatformFee = async () => {
      const { data } = await supabase
        .from('fare_configs')
        .select('platform_fee_value')
        .eq('region_code', 'CALAPAN')
        .limit(1)
        .single();
      
      if (data?.platform_fee_value) {
        setPlatformFee(data.platform_fee_value);
      }
    };
    fetchPlatformFee();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile?.role === 'passenger') {
      navigate('/passenger/book-ride');
    } else if (profile?.role === 'driver') {
      // Subscribe to wallet balance changes (Realtime)
      const walletChannel = supabase
        .channel('driver-wallet-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wallet_accounts',
            filter: `user_id=eq.${user!.id}`,
          },
          (payload) => {
            const previousBalance = walletBalance;
            const newBalance = payload.new.balance as number;
            setWalletBalance(newBalance);
            
            // Notify if balance was reloaded and reset zero balance modal
            if (previousBalance === 0 && newBalance > 0) {
              setZeroBalanceDismissed(false);
              setShowZeroBalanceModal(false);
              toast.success(`Balance reloaded to ₱${newBalance.toFixed(2)}. You can now accept jobs!`);
            } else if (previousBalance < 5 && newBalance >= 5) {
              toast.success(`Balance reloaded to ₱${newBalance.toFixed(2)}. You can now accept jobs!`);
            }
          }
        )
        .subscribe();

      // CRITICAL FIX: Subscribe to new ride requests (Realtime)
      const ridesChannel = supabase
        .channel('driver-available-rides')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'rides',
            filter: 'status=eq.requested',
          },
          (payload) => {
            console.log('[Dashboard] New ride created:', payload.new);
            // Add the new ride to available rides if it's still requested and has no driver
            if (payload.new.status === 'requested' && !payload.new.driver_id) {
              const rideId = payload.new.id as string;
              
              // Use functional update to avoid stale state
              setAvailableRides(prev => {
                // Check if ride already exists (prevent duplicates)
                if (prev.some(r => r.id === rideId)) {
                  console.log('[Dashboard] Ride already in list, skipping');
                  return prev;
                }
                return [payload.new as any, ...prev];
              });
              
              setNewRideIds(prev => new Set(prev).add(rideId));
              
              // Play notification sound
              const audio = new Audio('/notification-bell.mp3');
              audio.volume = 0.5;
              audio.play().catch(err => console.log('Audio play failed:', err));
              
              toast.success('🚗 New ride request available!', {
                duration: 5000,
              });
              
              // Remove highlight after 15 seconds
              setTimeout(() => {
                setNewRideIds(prev => {
                  const updated = new Set(prev);
                  updated.delete(rideId);
                  return updated;
                });
              }, 15000);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'rides',
          },
          (payload) => {
            console.log('[Dashboard] Ride updated:', payload.new);
            // Remove from available if accepted by another driver or cancelled
            if (payload.new.driver_id || payload.new.status !== 'requested') {
              setAvailableRides(prev => prev.filter(r => r.id !== payload.new.id));
              setNewRideIds(prev => {
                const updated = new Set(prev);
                updated.delete(payload.new.id as string);
                return updated;
              });
            }

            // Handles negotiation
            if (payload.new.driver_id === profile?.id 
              && payload.new.negotiation_status === 'pending'
              && payload.old.negotiation_status !== 'pending') {
              console.log('[Dashboard] Passenger proposed a counter-offer', payload.new);
              setRide(payload.new);
              setShowNegotiationAlert(true);
            }

            console.log('Updated ride:', payload.new.id);
            console.log('Negotiation status:', payload.new.negotiation_status);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(walletChannel);
        supabase.removeChannel(ridesChannel);
      };
    }
  }, [user, profile, navigate]);

  // Separate effect to load initial data (runs once on mount)
  useEffect(() => {
    if (profile?.role === 'driver') {
      loadDriverData();
    }
  }, [profile?.id]); // Only re-run if profile ID changes

  // Show zero balance modal on page load if balance is 0 and not dismissed
  useEffect(() => {
    if (walletBalance === 0 && !zeroBalanceDismissed) {
      setShowZeroBalanceModal(true);
    }
  }, [walletBalance, zeroBalanceDismissed]);

  // GPS location publishing - calculate active ride status
  const hasActiveRide = myRides.some(r => r.status === 'in_progress' || r.status === 'accepted');
  const { location: gpsLocation, error: gpsError } = useDriverLocationPublisher({
    driverId: user?.id || null,
    isAvailable: driverProfile?.is_available || false,
    hasActiveRide,
  });

  const loadDriverData = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      setKycCheckLoading(true);
      
      // Check KYC status first
      const docs = await kycService.getUserKycDocuments(profile.id);
      setKycDocuments(docs);
      setKycCheckLoading(false);

      // Check if all required documents are approved (bypass for seeded test accounts)
      const requiredDocs = ['DRIVER_LICENSE', 'OR', 'CR', 'SELFIE'];
      const allApproved = requiredDocs.every(docType => 
        docs.some(d => d.doc_type === docType && d.status === 'APPROVED')
      );
      const isTestDriver = ['driver1@test.com', 'driver2@test.com'].includes(profile.email);
      const bypassKyc = isTestDriver;

      if (!allApproved && !bypassKyc) {
        // Block access - KYC not complete
        setLoading(false);
        return;
      }

      if (isTestDriver) {
        // Load actual driver profile from database (not mocked)
        const [driverData, userProfile, wallet] = await Promise.all([
          supabase.from('driver_profiles').select('*').eq('user_id', profile.id).single(),
          supabase.from('profiles').select('account_number').eq('id', profile.id).single(),
          import('@/services/wallet').then(({ walletService }) => walletService.getWalletAccount(profile.id)),
        ]);

        if (!driverData.data) {
          toast.error('Driver profile not found. Please complete setup.');
          setLoading(false);
          return;
        }

        setDriverProfile(driverData.data as DriverProfile);
        setAccountNumber(userProfile.data?.account_number || '');
        setWalletBalance(wallet?.balance || 0);
        
        // Load rides using the actual driver profile ID
        try {
          const { data: availableRidesData, error: availableError } = await supabase
            .from('rides')
            .select('*')
            .eq('status', 'requested')
            .is('driver_id', null)
            .order('created_at', { ascending: false });

          console.log('[Dashboard] Test driver available rides:', { data: availableRidesData, error: availableError, count: availableRidesData?.length });

          if (availableError) throw availableError;

          const myRidesData = await ridesService.getDriverRides(driverData.data.id);
          
          setAvailableRides(availableRidesData || []);
          setMyRides(myRidesData);
        } catch (ridesError) {
          console.error('[Dashboard] Error loading rides for test driver:', ridesError);
          setAvailableRides([]);
          setMyRides([]);
        }
        return;
      }

      // Non-test drivers: load core driver data and wallet first (avoid blocking on rides queries)
      const [driverData, userProfile, wallet] = await Promise.all([
        driversService.getDriverProfile(profile.id),
        supabase.from('profiles').select('account_number').eq('id', profile.id).single(),
        import('@/services/wallet').then(({ walletService }) => walletService.getWalletAccount(profile.id)),
      ]);

      setDriverProfile(driverData);
      setAccountNumber(userProfile.data?.account_number || '');
      setWalletBalance(wallet?.balance || 0);

      // If no driver profile yet, keep user on dashboard and show setup prompt
      if (!driverData) {
        setAvailableRides([]);
        setMyRides([]);
        return;
      }

      // Load rides data separately - fetch ALL requested rides (no distance filtering)
      try {
        const { data: availableRidesData, error: availableError } = await supabase
          .from('rides')
          .select('*')
          .eq('status', 'requested')
          .is('driver_id', null)
          .order('created_at', { ascending: false });

        console.log('[Dashboard] Available rides:', { data: availableRidesData, error: availableError, count: availableRidesData?.length });

        if (availableError) throw availableError;

        const myRidesData = await ridesService.getDriverRides(profile.id);
        
        setAvailableRides(availableRidesData || []);
        setMyRides(myRidesData);
      } catch (ridesError) {
        console.error('[Dashboard] Error loading rides data:', ridesError);
        setAvailableRides([]);
        setMyRides([]);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const refreshAvailableRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'requested')
        .is('driver_id', null)
        .order('created_at', { ascending: false });

      console.log('[Dashboard] Refreshing available rides:', { data, error, count: data?.length });

      if (error) throw error;
      setAvailableRides(data || []);
    } catch (error) {
      console.error('[Dashboard] Error refreshing rides:', error);
    }
  };

  const toggleAvailability = async () => {
    if (!profile || !driverProfile) return;

    // Check balance before going online
    if (!driverProfile.is_available && walletBalance < 5) {
      toast.error('Insufficient balance. You need at least ₱5.00 to accept jobs. Please reload to continue.');
      return;
    }

    try {
      setActionLoading(true);
      const updated = await driversService.updateAvailability(
        profile.id,
        !driverProfile.is_available
      );
      setDriverProfile(updated);
      
      // CRITICAL FIX: Refresh available rides when going online
      if (updated.is_available) {
        await refreshAvailableRides();
      }
      
      // Realtime presence channel stub (baseline wiring)
      // Contract: presence:CALAPAN channel
      if (updated.is_available && import.meta.env.VITE_ENABLE_REALTIME === 'true') {
        console.log('[Realtime] Publishing driver presence to presence:CALAPAN', {
          driver_id: profile.id,
          vehicle_type: driverProfile.vehicle_type,
          location: 'stub_lat_lng',
          online_at: new Date().toISOString(),
        });
        // TODO: Actual Supabase Realtime publish when configured
      }
      
      toast.success(
        updated.is_available ? 'You are now available for rides' : 'You are now offline'
      );
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    if (!profile || !driverProfile) return;

    console.log('[AcceptRide] Attempting to accept ride:', {
      rideId,
      driverProfileId: driverProfile.id,
      userId: profile.id,
      driverProfile: driverProfile
    });

    // Check balance before accepting ride (₱5 will be deducted at assignment)
    if (walletBalance < platformFee) {
      toast.error(`Insufficient balance. You need at least ₱${platformFee.toFixed(2)} to accept jobs. Please reload to continue.`);
      return;
    }

    try {
      setActionLoading(true);
      
      // Accept the ride - update to status='accepted' and set driver_id
      // Platform fee is charged in ridesService.acceptRide
      console.log('[AcceptRide] Calling ridesService.acceptRide with userId:', { rideId, driverUserId: profile.id });
      await ridesService.acceptRide(rideId, profile.id);
      
      toast.success('Job accepted. Proceed to pickup.');
      await loadDriverData();
    } catch (error: any) {
      console.error('Error accepting ride:', error);
      if (error.message?.includes('INSUFFICIENT_FUNDS')) {
        toast.error('Insufficient funds. Please reload your wallet.');
      } else {
        toast.error(error.message || 'Failed to accept ride');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (rideId: string, newStatus: any) => {
    try {
      setActionLoading(true);
      await ridesService.updateRideStatus(rideId, newStatus);
      toast.success(`Ride status updated to ${newStatus}`);
      await loadDriverData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRideRequest = async (rideId: string) => {
    try {
      setActionLoading(true);
      
      // Cancel the ride with reason
      await ridesService.cancelRide(rideId, 'Driver declined the request', profile?.id);
      
      // Move to cancelled rides list
      const cancelledRide = availableRides.find(r => r.id === rideId);
      if (cancelledRide) {
        setCancelledRides(prev => [{ ...cancelledRide, cancelled_at: new Date().toISOString() }, ...prev]);
      }
      
      // Remove from available rides
      setAvailableRides(prev => prev.filter(r => r.id !== rideId));
      setNewRideIds(prev => {
        const updated = new Set(prev);
        updated.delete(rideId);
        return updated;
      });
      
      toast.success('Ride request cancelled');
      setCancelConfirmRideId(null);
    } catch (error: any) {
      console.error('Error cancelling ride:', error);
      toast.error(error.message || 'Failed to cancel ride');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProposeCounterOffer = (rideId: string) => {
    setSelectedRideForCounter(rideId);
    setShowCounterOfferModal(true);
  };

  const handleSubmitCounterOffer = async (additionalFare: number, notes: string) => {
    if (!selectedRideForCounter || !driverProfile) return;
    
    try {
      setActionLoading(true);
      await ridesService.proposeFareNegotiation(
        selectedRideForCounter,
        driverProfile.id,
        additionalFare,
        notes
      );
      toast.success('Counter offer sent to passenger');
      setShowCounterOfferModal(false);
      setSelectedRideForCounter(null);
      await loadDriverData();
    } catch (error: any) {
      console.error('Error proposing counter offer:', error);
      toast.error(error.message || 'Failed to send counter offer');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || !profile || profile.role !== 'driver' || kycCheckLoading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  // Check if KYC is complete (bypass for seeded test accounts)
  const requiredDocs = ['DRIVER_LICENSE', 'OR', 'CR', 'SELFIE'];
  const allKycApproved = requiredDocs.every(docType => 
    kycDocuments.some(d => d.doc_type === docType && d.status === 'APPROVED')
  );

  const isTestDriver = ['driver1@test.com', 'driver2@test.com'].includes(profile.email);
  const bypassKyc = isTestDriver;

  if (!allKycApproved && !bypassKyc) {
    return (
      <PageLayout>
        <KycBlockedAccess 
          documents={kycDocuments} 
          userName={profile.full_name}
          userId={profile.id}
          onDocumentUploaded={loadDriverData}
        />
      </PageLayout>
    );
  }


  if (loading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }


  if (!driverProfile) {
    // For seeded test drivers, construct a local profile instead of showing setup
    if (isTestDriver && profile) {
      const now = new Date().toISOString();
      const testVehicle =
        profile.email === 'driver1@test.com'
          ? {
              vehicle_type: 'motor',
              vehicle_plate: 'ABC-1234',
              vehicle_model: 'Honda Wave 110',
              vehicle_color: 'Red',
              license_number: 'N01-12-345678',
            }
          : {
              vehicle_type: 'tricycle',
              vehicle_plate: 'XYZ-5678',
              vehicle_model: 'Honda TMX 155',
              vehicle_color: 'Blue',
              license_number: 'N02-13-456789',
            };

      setDriverProfile({
        id: profile.id,
        user_id: profile.id,
        vehicle_type: testVehicle.vehicle_type as RideType,
        vehicle_plate: testVehicle.vehicle_plate,
        vehicle_model: testVehicle.vehicle_model,
        vehicle_color: testVehicle.vehicle_color,
        license_number: testVehicle.license_number,
        is_available: true,
        rating: 5,
        total_rides: 0,
        current_lat: null,
        current_lng: null,
        location_updated_at: null,
        created_at: now,
        updated_at: now,
      });

      return (
        <PageLayout>
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </div>
        </PageLayout>
      );
    }

    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center px-4">
          <ThemedCard className="max-w-md w-full text-center space-y-4">
            <h2 className="text-xl font-heading font-bold">Complete your driver setup</h2>
            <p className="text-sm text-muted-foreground">
              To start receiving ride requests, please complete your driver profile and upload the required documents.
            </p>
            <PrimaryButton onClick={() => navigate('/driver/setup')}>
              Go to Driver Setup
            </PrimaryButton>
          </ThemedCard>
        </div>
      </PageLayout>
    );
  }

  // Test account banner
  const testAccountBanner = isTestDriver && (
    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <p className="text-sm text-blue-700">
        <strong>🧪 Test Account:</strong> KYC verification is bypassed for this test driver account. Real accounts must complete full KYC verification.
      </p>
    </div>
  );


  const activeRide = myRides.find(r => r.status === 'accepted' || r.status === 'in_progress');
  const transactionCapacity = platformFee > 0 ? walletBalance / platformFee : 0;
  const firstName = profile?.full_name?.split(' ')[0] || 'Driver';

  return (
    <PageLayout headerTitle={`${greeting}, ${firstName}!`}>
      {/* Test Account Banner */}
      {testAccountBanner}
      
      {/* Low Balance Warning Banner */}
      <LowBalanceWarning 
        transactionCapacity={transactionCapacity} 
        platformFee={platformFee}
      />

      {/* Zero Balance Modal */}
      {showZeroBalanceModal && walletBalance === 0 && (
        <ZeroBalanceModal
          platformFee={platformFee}
          onDismiss={() => {
            setShowZeroBalanceModal(false);
            setZeroBalanceDismissed(true);
          }}
        />
      )}

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          {/* Driver Status */}
          <ThemedCard>
             <div className="flex justify-between items-center">
              <div className="flex-1">
                <h2 className="text-xl font-heading font-bold">
                  {driverProfile.is_available ? 'You\'re Online' : 'You\'re Offline'}
                </h2>
                <p className="text-sm text-muted-foreground capitalize mb-2">
                  {driverProfile.vehicle_type} • {driverProfile.vehicle_plate}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm mb-3">
                  <span className="text-muted-foreground">
                    <strong>Account No:</strong> {accountNumber || 'Pending'}
                  </span>
                  <span className={`font-semibold ${walletBalance < 5 ? 'text-destructive' : 'text-foreground'}`}>
                    <strong>Balance:</strong> ₱{walletBalance.toFixed(2)}
                  </span>
                </div>
                <SecondaryButton
                  onClick={() => navigate('/driver/wallet')}
                  className="text-xs"
                >
                  <WalletIcon className="w-4 h-4 mr-2" />
                  View Wallet
                </SecondaryButton>
              </div>
              <button
                onClick={toggleAvailability}
                disabled={actionLoading}
                className={`p-4 rounded-full transition-all ${
                  driverProfile.is_available
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {driverProfile.is_available ? (
                  <Power className="w-6 h-6" />
                ) : (
                  <PowerOff className="w-6 h-6" />
                )}
              </button>
            </div>
          </ThemedCard>

          {/* Active Ride */}
          {activeRide && (
            <div className="space-y-3">
              <h2 className="text-xl font-heading font-bold">Current Ride</h2>
              <ThemedCard className="ring-2 ring-primary">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">
                        {activeRide.passenger?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activeRide.passenger_count} passenger(s)
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      ₱{activeRide.fare_estimate}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-1" />
                      <div>
                        <p className="font-medium text-sm">Pickup</p>
                        <p className="text-sm text-muted-foreground">
                          {activeRide.pickup_location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-destructive mt-1" />
                      <div>
                        <p className="font-medium text-sm">Drop-off</p>
                        <p className="text-sm text-muted-foreground">
                          {activeRide.dropoff_location}
                        </p>
                      </div>
                    </div>
                  </div>

                  {activeRide.notes && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Passenger Note:</p>
                      <p className="text-sm text-muted-foreground">{activeRide.notes}</p>
                    </div>
                  )}

                  {/* ETA Display */}
                  {activeRideEta && (
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm font-semibold text-foreground">
                        Arriving in {activeRideEta.etaText}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activeRideEta.distanceKm} km away
                      </p>
                    </div>
                  )}

                  {/* Navigation Map */}
                  {gpsLocation && (
                    <div className="mb-4">
                      <DriverNavigationMap
                        pickupLat={activeRide.pickup_lat!}
                        pickupLng={activeRide.pickup_lng!}
                        dropoffLat={activeRide.dropoff_lat!}
                        dropoffLng={activeRide.dropoff_lng!}
                        driverLat={gpsLocation?.lat}
                        driverLng={gpsLocation?.lng}
                        rideStatus={activeRide.status as 'accepted' | 'in_progress'}
                        className="h-96 rounded-lg"
                        onRouteLoaded={(distance, duration) => {
                          setActiveRideEta({
                            distanceKm: distance,
                            durationMinutes: duration,
                            etaText: duration < 1 ? 'Less than a minute' : `${Math.ceil(duration)} min`
                          });
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    {activeRide.status === 'accepted' && (
                      <PrimaryButton
                        onClick={() => handleUpdateStatus(activeRide.id, 'in_progress')}
                        disabled={actionLoading}
                      >
                        Start Ride
                      </PrimaryButton>
                    )}
                    {activeRide.status === 'in_progress' && (
                      <PrimaryButton
                        onClick={() => handleUpdateStatus(activeRide.id, 'completed')}
                        disabled={actionLoading}
                      >
                        Complete Ride
                      </PrimaryButton>
                    )}
                    <SecondaryButton
                      onClick={() => ridesService.cancelRide(activeRide.id).then(loadDriverData)}
                      disabled={actionLoading}
                    >
                      Cancel Ride
                    </SecondaryButton>
                  </div>
                </div>
              </ThemedCard>
            </div>
          )}

          {/* Available Rides */}
          {!activeRide && driverProfile.is_available && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-heading font-bold">Available Rides</h2>
                <button
                  onClick={() => setShowMapView(!showMapView)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <MapIcon className="w-4 h-4" />
                  {showMapView ? 'List View' : 'Map View'}
                </button>
              </div>
              
              {availableRides.length === 0 ? (
                <ThemedCard>
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No rides available. Waiting for requests...
                    </p>
                  </div>
                </ThemedCard>
              ) : showMapView ? (
                <ThemedCard className="p-0 overflow-hidden">
                  <AvailableRidesMap
                    rides={availableRides.map(ride => ({
                      id: ride.id,
                      pickup_lat: ride.pickup_lat,
                      pickup_lng: ride.pickup_lng,
                      dropoff_lat: ride.dropoff_lat,
                      dropoff_lng: ride.dropoff_lng,
                      pickup_location: ride.pickup_location,
                      dropoff_location: ride.dropoff_location,
                      fare_estimate: ride.fare_estimate
                    }))}
                    driverLat={driverProfile.current_lat || undefined}
                    driverLng={driverProfile.current_lng || undefined}
                    onRideClick={(rideId) => {
                      const ride = availableRides.find(r => r.id === rideId);
                      if (ride) {
                        handleAcceptRide(rideId);
                      }
                    }}
                    className="h-[500px]"
                  />
                </ThemedCard>
              ) : (
                <div className="space-y-3">
                  {availableRides.map((ride) => {
                    const isNew = newRideIds.has(ride.id);
                    return (
                      <div 
                        key={ride.id}
                        className={`relative ${isNew ? 'animate-pulse' : ''}`}
                      >
                        {isNew && (
                          <div className="absolute -top-2 -right-2 z-10">
                            <span className="relative flex h-6 w-6">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-6 w-6 bg-primary items-center justify-center">
                                <span className="text-[10px] font-bold text-primary-foreground">NEW</span>
                              </span>
                            </span>
                          </div>
                        )}
                        <ThemedCard className={isNew ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''}>
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">
                                  {ride.passenger?.full_name || 'Passenger'}
                                </p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {ride.ride_type} • {ride.passenger_count} passenger(s)
                                </p>
                              </div>
                              <p className="text-xl font-bold text-primary">
                                ₱{ride.fare_estimate}
                              </p>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                                <span className="text-muted-foreground">{ride.pickup_location}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                                <span className="text-muted-foreground">{ride.dropoff_location}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <PrimaryButton
                                onClick={() => handleAcceptRide(ride.id)}
                                disabled={actionLoading}
                                className={`flex-1 ${isNew ? 'animate-pulse' : ''}`}
                              >
                                {isNew ? '🔔 Accept' : 'Accept Ride'}
                              </PrimaryButton>
                              <SecondaryButton
                                onClick={() => handleProposeCounterOffer(ride.id)}
                                disabled={actionLoading}
                                className="flex-1"
                              >
                                <DollarSign className="w-4 h-4" />
                              </SecondaryButton>
                              <SecondaryButton
                                onClick={() => setCancelConfirmRideId(ride.id)}
                                disabled={actionLoading}
                                className="flex-1"
                              >
                                <X className="w-4 h-4" />
                              </SecondaryButton>
                            </div>
                          </div>
                        </ThemedCard>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Cancelled Requests */}
          {cancelledRides.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-heading font-bold text-muted-foreground">Cancelled Requests</h2>
              <div className="space-y-2">
                {cancelledRides.slice(0, 3).map((ride) => (
                  <ThemedCard key={ride.id} className="opacity-60">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-muted-foreground">
                          {ride.passenger?.full_name || 'Passenger'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Cancelled {format(new Date(ride.cancelled_at), 'h:mm a')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-muted-foreground">
                          ₱{ride.fare_estimate}
                        </p>
                        <p className="text-xs text-destructive">Cancelled</p>
                      </div>
                    </div>
                  </ThemedCard>
                ))}
              </div>
            </div>
          )}

          {/* Ride History */}
          {myRides.filter(r => r.status === 'completed' || r.status === 'cancelled').length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-heading font-bold">Recent Rides</h2>
              <div className="space-y-2">
                {myRides
                  .filter(r => r.status === 'completed' || r.status === 'cancelled')
                  .slice(0, 5)
                  .map((ride) => (
                    <ThemedCard key={ride.id}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{ride.passenger?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(ride.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            ₱{ride.fare_final || ride.fare_estimate}
                          </p>
                          <p className={`text-xs ${ride.status === 'completed' ? 'text-success' : 'text-destructive'}`}>
                            {ride.status}
                          </p>
                        </div>
                      </div>
                    </ThemedCard>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelConfirmRideId} onOpenChange={(open) => !open && setCancelConfirmRideId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Ride Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the passenger's ride request. Consider proposing a counter-offer instead to negotiate the fare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelConfirmRideId && handleCancelRideRequest(cancelConfirmRideId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Counter Offer Modal */}
      <CounterOfferModal
        open={showCounterOfferModal}
        onClose={() => {
          setShowCounterOfferModal(false);
          setSelectedRideForCounter(null);
        }}
        onSubmit={handleSubmitCounterOffer}
        baseFare={availableRides.find(r => r.id === selectedRideForCounter)?.fare_estimate || 0}
      />

      {/* Negotiation Alert */}
      {showNegotiationAlert && ride && (
        <FareNegotiationAlert
          open={showNegotiationAlert}
          baseFare={ride.base_fare || 0}
          proposedFare={(ride.base_fare || 0) + (ride.proposed_top_up_fare || 0)}
          topUpAmount={ride.proposed_top_up_fare || 0}
          reason={ride.negotiation_notes || 'Driver counter-offer'}
          onAccept={async () => {
            await acceptNegotiation();
            setShowNegotiationAlert(false);
          }}
          onReject={async () => {
            await rejectNegotiation();
            setShowNegotiationAlert(false);
          }}
          />
        )}
    </PageLayout>
  );
}
