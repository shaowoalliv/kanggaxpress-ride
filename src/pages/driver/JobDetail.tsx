import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Car, Loader2, ArrowLeft } from 'lucide-react';

export default function JobDetail() {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedTopUp, setSelectedTopUp] = useState<number>(0);
  const [customTopUp, setCustomTopUp] = useState<string>('');
  const [offerSent, setOfferSent] = useState(false);
  const [driverProfileId, setDriverProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (profile?.role !== 'driver') {
      navigate('/choose-role');
      return;
    }
    
    fetchDriverProfile();
    fetchRide();
  }, [user, profile, rideId, navigate]);

  const fetchDriverProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setDriverProfileId(data.id);
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      toast.error('Failed to load driver profile');
    }
  };

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
      navigate('/driver/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUpSelect = (amount: number) => {
    setSelectedTopUp(amount);
    setCustomTopUp('');
  };

  const handleCustomTopUpChange = (value: string) => {
    setCustomTopUp(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setSelectedTopUp(num);
    }
  };

  const handleSendOffer = async () => {
    if (!driverProfileId) {
      toast.error('Driver profile not found');
      return;
    }

    try {
      setSending(true);
      const total = (ride.base_fare || 0) + selectedTopUp;

      const { error } = await supabase
        .from('rides')
        .update({
          driver_id: driverProfileId,
          top_up_fare: selectedTopUp,
          total_fare: total,
          status: 'accepted',
        })
        .eq('id', rideId);

      if (error) throw error;

      setOfferSent(true);
      toast.success('Offer sent successfully!');
    } catch (error) {
      console.error('Error sending offer:', error);
      toast.error('Failed to send offer');
    } finally {
      setSending(false);
    }
  };

  const handleStartRide = async () => {
    try {
      setSending(true);
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', rideId);

      if (error) throw error;

      toast.success('Ride started!');
      await fetchRide();
    } catch (error) {
      console.error('Error starting ride:', error);
      toast.error('Failed to start ride');
    } finally {
      setSending(false);
    }
  };

  const handleCompleteRide = async () => {
    try {
      setSending(true);
      
      // Fetch app fee from platform_settings
      const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'app_fee_per_ride')
        .single();

      const appFee = platformSettings?.setting_value || 5;
      const fareFinal = ride.total_fare || ride.base_fare || 0;

      const { error } = await supabase
        .from('rides')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          fare_final: fareFinal,
          app_fee: appFee,
        })
        .eq('id', rideId);

      if (error) throw error;

      toast.success(`Ride completed! Total fare ₱${fareFinal}, app fee ₱${appFee}.`);
      await fetchRide();
    } catch (error) {
      console.error('Error completing ride:', error);
      toast.error('Failed to complete ride');
    } finally {
      setSending(false);
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
            <PrimaryButton onClick={() => navigate('/driver/jobs')}>
              Back to Jobs
            </PrimaryButton>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex-1 w-full bg-background">
        <div className="bg-primary px-4 py-6 text-primary-foreground">
          <button
            onClick={() => navigate('/driver/jobs')}
            className="flex items-center gap-2 mb-4 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Jobs</span>
          </button>
          <h1 className="text-2xl font-heading font-bold">Job Details</h1>
        </div>

        <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
          {/* Ride Status Summary */}
          {ride.status === 'in_progress' && (
            <ThemedCard className="bg-secondary/5 border-secondary/20 text-center py-6">
              <p className="text-lg font-semibold text-secondary mb-2">Ride In Progress</p>
              <p className="text-sm text-muted-foreground">Complete the ride when you reach the destination.</p>
            </ThemedCard>
          )}

          {ride.status === 'completed' && (
            <ThemedCard className="bg-primary/5 border-primary/20 text-center py-8">
              <p className="text-lg font-semibold text-primary mb-2">Ride Completed!</p>
              <p className="text-sm text-muted-foreground mb-4">
                Total fare ₱{ride.total_fare}, app fee ₱{ride.app_fee || 5}.
              </p>
              <PrimaryButton onClick={() => navigate('/driver/jobs')} className="mt-2">
                Back to Jobs
              </PrimaryButton>
            </ThemedCard>
          )}

          {offerSent && ride.status === 'accepted' && (
            <ThemedCard className="bg-primary/5 border-primary/20 text-center py-8">
              <p className="text-lg font-semibold text-primary mb-2">Offer Sent!</p>
              <p className="text-sm text-muted-foreground">Waiting for passenger to confirm.</p>
            </ThemedCard>
          )}

          {/* Route Details */}
          <ThemedCard>
            <h2 className="text-lg font-semibold mb-4">Route Details</h2>
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

          {/* Service & Base Fare */}
          <ThemedCard>
            <h2 className="text-lg font-semibold mb-4">Service & Fare</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-secondary" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium">{getServiceName(ride.ride_type)}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Base Fare</span>
                  <span className="text-xl font-semibold">₱{ride.base_fare}</span>
                </div>
                {ride.top_up_fare > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Top-up</span>
                    <span className="text-xl font-semibold">₱{ride.top_up_fare}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-semibold">Total Fare</span>
                  <span className="text-2xl font-bold text-primary">₱{ride.total_fare || ride.base_fare}</span>
                </div>
              </div>
            </div>
          </ThemedCard>

          {/* Top-Up Panel - Only show if ride not yet accepted */}
          {ride.status === 'requested' && !ride.driver_id && (
            <>
              <ThemedCard>
                <h2 className="text-lg font-semibold mb-4">Add Top-Up (Optional)</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleTopUpSelect(0)}
                      className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                        selectedTopUp === 0 && !customTopUp
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      ₱0
                    </button>
                    <button
                      onClick={() => handleTopUpSelect(10)}
                      className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                        selectedTopUp === 10 && !customTopUp
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      ₱10
                    </button>
                    <button
                      onClick={() => handleTopUpSelect(20)}
                      className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                        selectedTopUp === 20 && !customTopUp
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      ₱20
                    </button>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Custom Amount</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Enter custom amount"
                      value={customTopUp}
                      onChange={(e) => handleCustomTopUpChange(e.target.value)}
                    />
                  </div>

                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total Fare</span>
                      <span className="text-primary">₱{(ride.base_fare || 0) + selectedTopUp}</span>
                    </div>
                  </div>
                </div>
              </ThemedCard>

              {/* Action Buttons - Send Offer */}
              <div className="space-y-3 pt-4">
                <PrimaryButton
                  onClick={handleSendOffer}
                  disabled={sending}
                  isLoading={sending}
                  className="w-full"
                >
                  Send Offer
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => navigate('/driver/jobs')}
                  className="w-full"
                >
                  Back
                </SecondaryButton>
              </div>
            </>
          )}

          {/* Action Buttons - Start/Complete Ride */}
          {ride.status === 'accepted' && ride.driver_id && !offerSent && (
            <div className="space-y-3 pt-4">
              <PrimaryButton
                onClick={handleStartRide}
                disabled={sending}
                isLoading={sending}
                className="w-full"
              >
                Start Ride
              </PrimaryButton>
              <SecondaryButton
                onClick={() => navigate('/driver/jobs')}
                className="w-full"
              >
                Back to Jobs
              </SecondaryButton>
            </div>
          )}

          {ride.status === 'in_progress' && (
            <div className="space-y-3 pt-4">
              <PrimaryButton
                onClick={handleCompleteRide}
                disabled={sending}
                isLoading={sending}
                className="w-full"
              >
                Complete Ride
              </PrimaryButton>
              <SecondaryButton
                onClick={() => navigate('/driver/jobs')}
                className="w-full"
              >
                Back to Jobs
              </SecondaryButton>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
