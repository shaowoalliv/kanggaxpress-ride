import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ridesService } from '@/services/rides';
import { driversService } from '@/services/drivers';
import { DriverProfile } from '@/types';
import { toast } from 'sonner';
import { MapPin, User, Clock, Power, PowerOff } from 'lucide-react';
import { format } from 'date-fns';

export default function DriverDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [myRides, setMyRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile?.role === 'passenger') {
      navigate('/passenger/book-ride');
    } else if (profile?.role === 'driver') {
      loadDriverData();
    }
  }, [user, profile, navigate]);

  const loadDriverData = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const [driverData, available, my] = await Promise.all([
        driversService.getDriverProfile(profile.id),
        ridesService.getAvailableRides(),
        profile.id ? ridesService.getDriverRides(profile.id) : Promise.resolve([]),
      ]);

      setDriverProfile(driverData);
      
      // If no driver profile, redirect to setup
      if (!driverData) {
        navigate('/driver/setup');
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

    try {
      setActionLoading(true);
      const updated = await driversService.updateAvailability(
        profile.id,
        !driverProfile.is_available
      );
      setDriverProfile(updated);
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

    try {
      setActionLoading(true);
      await ridesService.acceptRide(rideId, driverProfile.id);
      toast.success('Ride accepted!');
      await loadDriverData();
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast.error('Failed to accept ride');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (rideId: string, newStatus: any) => {
    try {
      setActionLoading(true);
      await ridesService.updateRideStatus(rideId, newStatus);
      toast.success('Ride status updated');
      await loadDriverData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || !profile || profile.role !== 'driver' || loading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  if (!driverProfile) {
    return null;
  }

  const activeRide = myRides.find(r => r.status === 'accepted' || r.status === 'in_progress');

  return (
    <PageLayout>
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          {/* Driver Status */}
          <ThemedCard>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-heading font-bold">
                  {driverProfile.is_available ? 'You\'re Online' : 'You\'re Offline'}
                </h2>
                <p className="text-sm text-muted-foreground capitalize">
                  {driverProfile.vehicle_type} • {driverProfile.vehicle_plate}
                </p>
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
