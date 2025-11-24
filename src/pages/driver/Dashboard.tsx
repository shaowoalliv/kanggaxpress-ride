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
import { DriverProfile } from '@/types';
import { toast } from 'sonner';
import { MapPin, User, Clock, Power, PowerOff, Navigation, Wallet as WalletIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { kycService } from '@/services/kyc';
import { KycDocument } from '@/types/kyc';
import { KycBlockedAccess } from '@/components/KycBlockedAccess';
import { LowBalanceWarning } from '@/components/LowBalanceWarning';
import { ZeroBalanceModal } from '@/components/ZeroBalanceModal';

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

  // Check if zero balance modal was dismissed this session
  const [zeroBalanceDismissed, setZeroBalanceDismissed] = useState(false);

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
      loadDriverData();

      // Subscribe to wallet balance changes (Realtime)
      const channel = supabase
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

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile, navigate]);

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

      // Check if all required documents are approved
      const requiredDocs = ['DRIVER_LICENSE', 'OR', 'CR', 'SELFIE'];
      const allApproved = requiredDocs.every(docType => 
        docs.some(d => d.doc_type === docType && d.status === 'APPROVED')
      );

      if (!allApproved) {
        // Block access - KYC not complete
        setLoading(false);
        return;
      }

      const [driverData, available, my, userProfile, wallet] = await Promise.all([
        driversService.getDriverProfile(profile.id),
        ridesService.getAvailableRides(),
        profile.id ? ridesService.getDriverRides(profile.id) : Promise.resolve([]),
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

      setAvailableRides(available);
      setMyRides(my);
    } catch (error) {
      console.error('Error loading driver data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
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

    // Check balance before accepting ride
    if (walletBalance < platformFee) {
      toast.error(`Insufficient balance. You need at least ₱${platformFee.toFixed(2)} to accept jobs. Please reload to continue.`);
      return;
    }

    try {
      setActionLoading(true);
      
      // Accept the ride
      await ridesService.acceptRide(rideId, driverProfile.id);
      
      // Deduct platform fee upfront
      const { walletService } = await import('@/services/wallet');
      const newBalance = await walletService.applyTransaction({
        userId: user!.id,
        amount: -platformFee,
        type: 'deduct',
        reference: 'Platform fee - ride acceptance',
        rideId: rideId,
      });
      
      setWalletBalance(newBalance);
      toast.success(`Ride accepted! ₱${platformFee.toFixed(2)} platform fee deducted.`);
      await loadDriverData();
    } catch (error: any) {
      console.error('Error accepting ride:', error);
      toast.error(error.message || 'Failed to accept ride');
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

  if (!user || !profile || profile.role !== 'driver' || kycCheckLoading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  // Check if KYC is complete
  const requiredDocs = ['DRIVER_LICENSE', 'OR', 'CR', 'SELFIE'];
  const allKycApproved = requiredDocs.every(docType => 
    kycDocuments.some(d => d.doc_type === docType && d.status === 'APPROVED')
  );

  if (!allKycApproved) {
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

  const activeRide = myRides.find(r => r.status === 'accepted' || r.status === 'in_progress');
  const transactionCapacity = platformFee > 0 ? walletBalance / platformFee : 0;
  const firstName = profile?.full_name?.split(' ')[0] || 'Driver';

  return (
    <PageLayout headerTitle={`${greeting}, ${firstName}!`}>
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
              <h2 className="text-xl font-heading font-bold">Available Rides</h2>
              {availableRides.length === 0 ? (
                <ThemedCard>
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No rides available. Waiting for requests...
                    </p>
                  </div>
                </ThemedCard>
              ) : (
                <div className="space-y-3">
                  {availableRides.map((ride) => (
                    <ThemedCard key={ride.id}>
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

                        <PrimaryButton
                          onClick={() => handleAcceptRide(ride.id)}
                          disabled={actionLoading}
                        >
                          Accept Ride
                        </PrimaryButton>
                      </div>
                    </ThemedCard>
                  ))}
                </div>
              )}
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
    </PageLayout>
  );
}
