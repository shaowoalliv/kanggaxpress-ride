import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { MapPin, Clock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { ridesService } from '@/services/rides';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MyRides() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState<any[]>([]);
  const [showFareDialog, setShowFareDialog] = useState(false);
  const [selectedRide, setSelectedRide] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (profile?.role !== 'passenger') {
      navigate('/choose-role');
      return;
    }
    
    loadRides();
    
    const channel = supabase
      .channel('my_rides')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `passenger_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Ride updated:', payload);
          loadRides();
          
          if (payload.new.status === 'accepted' && !payload.old.driver_id && payload.new.driver_id) {
            setSelectedRide(payload.new);
            setShowFareDialog(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, navigate]);

  const loadRides = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await ridesService.getPassengerRides(user.id);
      setRides(data);
    } catch (error) {
      console.error('Error loading rides:', error);
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFare = async () => {
    if (!selectedRide) return;

    try {
      await ridesService.updateRideStatus(selectedRide.id, 'in_progress');
      toast.success('Fare accepted! Driver is on the way.');
      setShowFareDialog(false);
      loadRides();
    } catch (error) {
      console.error('Error accepting fare:', error);
      toast.error('Failed to accept fare');
    }
  };

  const handleRejectFare = async () => {
    if (!selectedRide) return;

    try {
      const { error } = await supabase
        .from('rides')
        .update({
          driver_id: null,
          top_up_fare: 0,
          total_fare: null,
          status: 'requested',
          accepted_at: null,
        })
        .eq('id', selectedRide.id);

      if (error) throw error;

      toast.success('Fare rejected. Looking for another driver...');
      setShowFareDialog(false);
      loadRides();
    } catch (error) {
      console.error('Error rejecting fare:', error);
      toast.error('Failed to reject fare');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-500';
      case 'accepted':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
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

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold">My Rides</h1>
          <p className="text-muted-foreground">Track your ride history and current trips</p>
        </div>

        {rides.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No rides yet</p>
            <PrimaryButton onClick={() => navigate('/passenger/book-ride')}>
              Book Your First Ride
            </PrimaryButton>
          </Card>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <Card key={ride.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(ride.status)}`} />
                      <span className="font-medium capitalize">{ride.status.replace('_', ' ')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(ride.created_at).toLocaleString()}
                    </div>
                  </div>
                  {ride.total_fare && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total Fare</div>
                      <div className="text-lg font-bold text-[hsl(30,40%,45%)]">
                        ₱{ride.total_fare}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[hsl(30,40%,45%)] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Pickup</div>
                      <div className="text-sm">{ride.pickup_location}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Drop-off</div>
                      <div className="text-sm">{ride.dropoff_location}</div>
                    </div>
                  </div>
                </div>

                {ride.total_fare && (
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <div className="flex justify-between mb-1">
                      <span>Base Fare:</span>
                      <span>₱{ride.base_fare || ride.fare_estimate}</span>
                    </div>
                    {ride.top_up_fare > 0 && (
                      <div className="flex justify-between mb-1">
                        <span>Top-up by driver:</span>
                        <span>₱{ride.top_up_fare}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                      <span>Total:</span>
                      <span>₱{ride.total_fare}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Pay directly to the driver (cash or e-wallet)
                    </div>
                  </div>
                )}

                {ride.notes && (
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">Notes: </span>
                    <span>{ride.notes}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showFareDialog} onOpenChange={setShowFareDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Driver Fare Offer</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>A driver has accepted your ride request with the following fare:</p>
                
                {selectedRide && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span>Service:</span>
                      <span className="font-medium capitalize">{selectedRide.ride_type}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Base Fare:</span>
                      <span>₱{selectedRide.base_fare || selectedRide.fare_estimate}</span>
                    </div>
                    {selectedRide.top_up_fare > 0 && (
                      <div className="flex justify-between mb-2">
                        <span>Top-up by driver:</span>
                        <span>₱{selectedRide.top_up_fare}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                      <span>Total Fare:</span>
                      <span className="text-[hsl(30,40%,45%)]">₱{selectedRide.total_fare}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Total fare is payable directly to the driver (cash or e-wallet).
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRejectFare}>
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptFare} className="bg-[hsl(30,40%,45%)] hover:bg-[hsl(30,40%,40%)]">
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Fare
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
