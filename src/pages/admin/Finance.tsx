import { Helmet } from 'react-helmet';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { DollarSign } from 'lucide-react';

export default function AdminFinance() {
  const [totalAppFees, setTotalAppFees] = useState<number>(0);
  const [completedRides, setCompletedRides] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rides')
        .select('app_fee, status')
        .eq('status', 'completed');

      if (error) throw error;

      const total = data?.reduce((sum, ride) => sum + (ride.app_fee || 0), 0) || 0;
      setTotalAppFees(total);
      setCompletedRides(data?.length || 0);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      toast.error('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Finance - Admin - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold font-heading mb-2">Finance</h2>
          <p className="text-muted-foreground">Financial overview and metrics</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ThemedCard>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total App Fees</p>
                  <p className="text-2xl font-bold text-primary">₱{totalAppFees.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">From completed rides</p>
                </div>
              </div>
            </ThemedCard>

            <ThemedCard>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-secondary/10">
                  <DollarSign className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed Rides</p>
                  <p className="text-2xl font-bold text-secondary">{completedRides}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total count</p>
                </div>
              </div>
            </ThemedCard>

            <ThemedCard>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Fee per Ride</p>
                  <p className="text-2xl font-bold text-accent">
                    ₱{completedRides > 0 ? (totalAppFees / completedRides).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Average app fee</p>
                </div>
              </div>
            </ThemedCard>
          </div>
        )}
      </div>
    </>
  );
}
