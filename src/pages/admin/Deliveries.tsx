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

interface Delivery {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  package_description: string;
  package_size: string;
  status: string;
  base_fare: number;
  top_up_fare: number;
  total_fare: number;
  app_fee: number;
  created_at: string;
  sender_id: string;
  courier_id: string | null;
  negotiation_status: string | null;
  proposed_top_up_fare: number | null;
  negotiation_notes: string | null;
}

const statusColors: Record<string, string> = {
  requested: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  assigned: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  picked_up: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  in_transit: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  delivered: 'bg-green-500/10 text-green-700 dark:text-green-400',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export default function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Deliveries - Admin - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold font-heading mb-2">Deliveries</h2>
          <p className="text-muted-foreground">All delivery orders and their details</p>
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
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Negotiation</TableHead>
                  <TableHead className="text-right">Base Fare</TableHead>
                  <TableHead className="text-right">Top-up</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">App Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No deliveries found
                    </TableCell>
                  </TableRow>
                ) : (
                  deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">
                        {format(new Date(delivery.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm">
                          <div className="text-muted-foreground">From: {delivery.pickup_address}</div>
                          <div className="text-muted-foreground">To: {delivery.dropoff_address}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="capitalize">{delivery.package_size}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {delivery.package_description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[delivery.status] || ''}>
                          {delivery.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {delivery.negotiation_status && delivery.negotiation_status !== 'none' ? (
                          <div className="text-sm">
                            <Badge variant={delivery.negotiation_status === 'accepted' ? 'default' : delivery.negotiation_status === 'pending' ? 'secondary' : 'outline'}>
                              {delivery.negotiation_status}
                            </Badge>
                            {delivery.proposed_top_up_fare && delivery.proposed_top_up_fare > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                +₱{delivery.proposed_top_up_fare.toFixed(2)}
                              </div>
                            )}
                            {delivery.negotiation_notes && (
                              <div className="text-xs text-muted-foreground mt-1 truncate max-w-xs" title={delivery.negotiation_notes}>
                                {delivery.negotiation_notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">₱{delivery.base_fare?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right">₱{delivery.top_up_fare?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₱{delivery.total_fare?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-right">₱{delivery.app_fee?.toFixed(2) || '—'}</TableCell>
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
