import { Helmet } from 'react-helmet';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ridesService } from '@/services/rides';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Ride {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  ride_type: string;
  status: string;
  base_fare: number;
  top_up_fare: number;
  total_fare: number;
  app_fee: number;
  fare_final: number;
  created_at: string;
  passenger_id: string;
  driver_id: string | null;
  negotiation_status: string | null;
  proposed_top_up_fare: number | null;
  negotiation_notes: string | null;
  cancellation_reason: string | null;
  platform_fee_charged: boolean;
}

const statusColors: Record<string, string> = {
  requested: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  accepted: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  in_progress: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  completed: 'bg-green-500/10 text-green-700 dark:text-green-400',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export default function AdminTrips() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDriverNoShow = async (rideId: string) => {
    if (!confirm('Mark this ride as Driver No-Show? This will charge ₱5 platform fee to the driver.')) {
      return;
    }

    try {
      await ridesService.updateRideStatus(
        rideId, 
        'cancelled', 
        'timed_out_driver_no_show',
        null
      );
      toast.success('Ride marked as Driver No-Show. Platform fee charged.');
      await fetchRides();
    } catch (error: any) {
      console.error('Error marking no-show:', error);
      toast.error(error.message || 'Failed to mark as no-show');
    }
  };

  return (
    <>
      <Helmet>
        <title>Trips - Admin - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold font-heading mb-2">Trips</h2>
          <p className="text-muted-foreground">All ride bookings and their details</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cancellation</TableHead>
                  <TableHead>Negotiation</TableHead>
                  <TableHead className="text-right">Base Fare</TableHead>
                  <TableHead className="text-right">Top-up</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">App Fee</TableHead>
                  <TableHead className="text-right">Final</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground">
                      No trips found
                    </TableCell>
                  </TableRow>
                ) : (
                  rides.map((ride) => (
                    <TableRow key={ride.id}>
                      <TableCell className="font-medium">
                        {format(new Date(ride.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm">
                          <div className="text-muted-foreground">From: {ride.pickup_location}</div>
                          <div className="text-muted-foreground">To: {ride.dropoff_location}</div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{ride.ride_type}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[ride.status] || ''}>
                          {ride.status.replace('_', ' ')}
                        </Badge>
                        {ride.platform_fee_charged && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Fee Charged
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {ride.cancellation_reason ? (
                          <div className="text-xs">
                            <Badge variant="secondary" className="text-xs">
                              {ride.cancellation_reason.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ride.negotiation_status && ride.negotiation_status !== 'none' ? (
                          <div className="text-sm">
                            <Badge variant={ride.negotiation_status === 'accepted' ? 'default' : ride.negotiation_status === 'pending' ? 'secondary' : 'outline'}>
                              {ride.negotiation_status}
                            </Badge>
                            {ride.proposed_top_up_fare && ride.proposed_top_up_fare > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                +₱{ride.proposed_top_up_fare.toFixed(2)}
                              </div>
                            )}
                            {ride.negotiation_notes && (
                              <div className="text-xs text-muted-foreground mt-1 truncate max-w-xs" title={ride.negotiation_notes}>
                                {ride.negotiation_notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">₱{ride.base_fare?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right">₱{ride.top_up_fare?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₱{ride.total_fare?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-right">₱{ride.app_fee?.toFixed(2) || '—'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₱{ride.fare_final?.toFixed(2) || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {ride.driver_id && (ride.status === 'accepted' || ride.status === 'in_progress') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkDriverNoShow(ride.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            No-Show
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
