import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MapPin, DollarSign, Clock, User, Loader2 } from 'lucide-react';
import { ridesService } from '@/services/rides';
import { driversService } from '@/services/drivers';
import { supabase } from '@/integrations/supabase/client';

export default function DriverDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [myRides, setMyRides] = useState<any[]>([]);
  const [topUpAmounts, setTopUpAmounts] = useState<Record<string, number>>({});
  const [customTopUps, setCustomTopUps] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (profile?.role !== 'driver') {
      navigate('/choose-role');
      return;
    }
    
    loadData();
    
    const channel = supabase
      .channel('available_rides')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rides',
          filter: 'status=eq.requested',
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, navigate]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [driverData, available, assigned] = await Promise.all([
        driversService.getDriverProfile(user.id),
        ridesService.getAvailableRides(),
        ridesService.getDriverRides(user.id),
      ]);
      
      setDriverProfile(driverData);
      setAvailableRides(available || []);
      setMyRides(assigned || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUpSelect = (rideId: string, amount: number) => {
    setTopUpAmounts(prev => ({ ...prev, [rideId]: amount }));
    setCustomTopUps(prev => {
      const newCustom = { ...prev };
      delete newCustom[rideId];
      return newCustom;
    });
  };

  const handleCustomTopUp = (rideId: string, value: string) => {
    setCustomTopUps(prev => ({ ...prev, [rideId]: value }));
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setTopUpAmounts(prev => ({ ...prev, [rideId]: numValue }));
    }
  };

  const handleSendOffer = async (ride: any) => {
    if (!driverProfile) {
      toast.error('Driver profile not found');
      return;
    }

    const topUp = topUpAmounts[ride.id] || 0;
    const baseFare = ride.base_fare || ride.fare_estimate || 0;
    const totalFare = baseFare + topUp;

    try {
      const { error } = await supabase
        .from('rides')
        .update({
          driver_id: driverProfile.id,
          top_up_fare: topUp,
          total_fare: totalFare,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', ride.id)
        .eq('status', 'requested')
        .is('driver_id', null);

      if (error) throw error;

      toast.success('Offer sent to passenger!');
      loadData();
    } catch (error) {
      console.error('Error sending offer:', error);
      toast.error('Failed to send offer');
    }
  };

  const handleUpdateRideStatus = async (rideId: string, status: string) => {
    try {
      await ridesService.updateRideStatus(rideId, status as any);
      toast.success(`Ride ${status}`);
      loadData();
    } catch (error) {
      console.error('Error updating ride:', error);
      toast.error('Failed to update ride status');
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(30,40%,45%)]" />
        </div>
      </PageLayout>
    );
  }

  if (!driverProfile) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Driver Profile Required</h2>
            <p className="text-muted-foreground mb-4">
              Please complete your driver profile to start accepting rides.
            </p>
            <PrimaryButton onClick={() => navigate('/driver/setup')}>
              Complete Profile
            </PrimaryButton>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
            <p className="text-muted-foreground">
              {driverProfile.vehicle_type} • {driverProfile.vehicle_plate}
            </p>
          </div>
          <Badge variant={driverProfile.is_available ? "default" : "secondary"}>
            {driverProfile.is_available ? "Available" : "Offline"}
          </Badge>
        </div>

        {myRides.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">My Rides</h2>
            <div className="space-y-4">
              {myRides.map((ride) => (
                <Card key={ride.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-[hsl(30,40%,45%)]" />
                        <span className="font-medium">{ride.pickup_location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{ride.dropoff_location}</span>
                      </div>
                    </div>
                    <Badge>{ride.status}</Badge>
                  </div>

                  {ride.total_fare && (
                    <div className="bg-muted p-3 rounded-lg mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Base Fare:</span>
                        <span>₱{ride.base_fare || ride.fare_estimate}</span>
                      </div>
                      {ride.top_up_fare > 0 && (
                        <div className="flex justify-between text-sm mb-1">
                          <span>Top-up:</span>
                          <span>₱{ride.top_up_fare}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>Total:</span>
                        <span>₱{ride.total_fare}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {ride.status === 'accepted' && (
                      <PrimaryButton
                        onClick={() => handleUpdateRideStatus(ride.id, 'in_progress')}
                        className="flex-1"
                      >
                        Start Trip
                      </PrimaryButton>
                    )}
                    {ride.status === 'in_progress' && (
                      <PrimaryButton
                        onClick={() => handleUpdateRideStatus(ride.id, 'completed')}
                        className="flex-1"
                      >
                        Complete Trip
                      </PrimaryButton>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-4">
            Available Rides ({availableRides.length})
          </h2>
          {availableRides.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No rides available at the moment
            </Card>
          ) : (
            <div className="space-y-4">
              {availableRides.map((ride) => {
                const selectedTopUp = topUpAmounts[ride.id] || 0;
                const baseFare = ride.base_fare || ride.fare_estimate || 0;
                const totalFare = baseFare + selectedTopUp;

                return (
                  <Card key={ride.id} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-[hsl(30,40%,45%)]" />
                          <span className="font-medium">{ride.pickup_location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{ride.dropoff_location}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{ride.passenger_count || 1} passenger(s)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(ride.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-sm font-medium mb-2">Base Fare: ₱{baseFare}</div>
                        <Label className="text-xs">Add Top-Up (optional):</Label>
                        <div className="flex gap-2 mt-2 mb-3">
                          {[0, 10, 20, 30].map((amount) => (
                            <button
                              key={amount}
                              onClick={() => handleTopUpSelect(ride.id, amount)}
                              className={`px-3 py-1 rounded text-sm border transition-colors ${
                                selectedTopUp === amount && !customTopUps[ride.id]
                                  ? 'bg-[hsl(30,40%,45%)] text-white border-[hsl(30,40%,45%)]'
                                  : 'bg-background border-border hover:border-[hsl(30,40%,60%)]'
                              }`}
                            >
                              ₱{amount}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 items-center">
                          <Label className="text-xs">Custom:</Label>
                          <Input
                            type="number"
                            min="0"
                            step="5"
                            placeholder="0"
                            value={customTopUps[ride.id] || ''}
                            onChange={(e) => handleCustomTopUp(ride.id, e.target.value)}
                            className="max-w-[100px]"
                          />
                        </div>
                        <div className="flex justify-between items-center font-semibold mt-3 pt-3 border-t">
                          <span>Total Fare:</span>
                          <span className="text-lg text-[hsl(30,40%,45%)]">₱{totalFare}</span>
                        </div>
                      </div>

                      <PrimaryButton
                        onClick={() => handleSendOffer(ride)}
                        className="w-full"
                      >
                        Accept & Send Offer
                      </PrimaryButton>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
