import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { ridesService } from '@/services/rides';
import { Ride } from '@/types';
import { MapPin, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  requested: 'text-primary',
  accepted: 'text-success',
  in_progress: 'text-secondary',
  completed: 'text-muted-foreground',
  cancelled: 'text-destructive',
};

const statusLabels = {
  requested: 'Looking for driver',
  accepted: 'Driver assigned',
  in_progress: 'On the way',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function MyRides() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile?.role === 'driver') {
      navigate('/driver/dashboard');
    } else if (profile) {
      loadRides();
    }
  }, [user, profile, navigate]);

  const loadRides = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      const data = await ridesService.getPassengerRides(profile.id);
      setRides(data);
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile || profile.role !== 'passenger') {
    return null;
  }

  return (
    <PageLayout>
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">
                My Rides
              </h1>
              <p className="text-muted-foreground mt-1">
                View your ride history
              </p>
            </div>
            <button
              onClick={() => navigate('/passenger/book-ride')}
              className="text-secondary font-medium hover:underline"
            >
              Book New Ride
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
          ) : rides.length === 0 ? (
            <ThemedCard>
              <div className="text-center py-8">
                <p className="text-muted-foreground">No rides yet</p>
                <button
                  onClick={() => navigate('/passenger/book-ride')}
                  className="mt-4 text-secondary font-medium hover:underline"
                >
                  Book your first ride →
                </button>
              </div>
            </ThemedCard>
          ) : (
            <div className="space-y-4">
              {rides.map((ride) => (
                <ThemedCard key={ride.id}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className={`font-semibold ${statusColors[ride.status]}`}>
                          {statusLabels[ride.status]}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {ride.ride_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          ₱{ride.fare_final || ride.fare_estimate || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Pickup</p>
                          <p className="text-muted-foreground">{ride.pickup_location}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                        <div>
                          <p className="font-medium">Drop-off</p>
                          <p className="text-muted-foreground">{ride.dropoff_location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(ride.created_at), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(ride.created_at), 'h:mm a')}
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
