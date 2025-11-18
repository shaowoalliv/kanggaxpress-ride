import { Helmet } from 'react-helmet';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
                  <TableHead className="text-right">Base Fare</TableHead>
                  <TableHead className="text-right">Top-up</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">App Fee</TableHead>
                  <TableHead className="text-right">Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
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
