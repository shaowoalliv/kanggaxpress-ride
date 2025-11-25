import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Car, Loader2 } from 'lucide-react';

export default function DriverJobs() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (profile?.role !== 'driver') {
      navigate('/choose-role');
      return;
    }
    
    fetchAvailableRides();

    // Set up realtime subscription
    const channel = supabase
      .channel('driver-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `status=eq.requested`,
        },
        () => {
          fetchAvailableRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, navigate]);

  const fetchAvailableRides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'requested')
        .is('driver_id', null)
        .order('created_at', { ascending: false });

      console.log('[fetchAvailableRides] Response:', { data, error, count: data?.length });
      
      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('[fetchAvailableRides] Error:', error);
      toast.error('Failed to load available rides');
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

  if (loading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex-1 w-full bg-background">
        <div className="bg-primary px-4 py-6 text-primary-foreground">
          <h1 className="text-2xl font-heading font-bold">Available Jobs</h1>
          <p className="text-sm opacity-90 mt-1">{rides.length} ride{rides.length !== 1 ? 's' : ''} available</p>
        </div>

        <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
          {rides.length === 0 ? (
            <ThemedCard className="text-center py-8">
              <p className="text-muted-foreground">No rides available at the moment.</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon!</p>
            </ThemedCard>
          ) : (
            rides.map((ride) => (
              <ThemedCard
                key={ride.id}
                onClick={() => navigate(`/driver/jobs/${ride.id}`)}
                className="cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.99]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary" />
                      <span className="font-semibold">{getServiceName(ride.ride_type)}</span>
                    </div>
                    <span className="text-lg font-bold text-primary">₱{ride.base_fare}</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-muted-foreground text-xs">Pickup</p>
                        <p className="font-medium">{ride.pickup_location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-muted-foreground text-xs">Drop-off</p>
                        <p className="font-medium">{ride.dropoff_location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ThemedCard>
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}
