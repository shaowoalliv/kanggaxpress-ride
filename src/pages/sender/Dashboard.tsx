import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { Package, History } from 'lucide-react';

export default function SenderDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');

  // Get greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile && profile.role !== 'sender') {
      // Redirect to appropriate dashboard
      if (profile.role === 'driver') navigate('/driver/dashboard');
      else if (profile.role === 'courier') navigate('/courier/dashboard');
      else navigate('/passenger/book-ride');
    }
  }, [user, profile, navigate]);

  if (!user || !profile || profile.role !== 'sender') {
    return null;
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  return (
    <PageLayout headerTitle={`${greeting}, ${firstName}!`}>
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Delivery Services
            </h1>
            <p className="text-muted-foreground mt-1">
              Send packages across the city
            </p>
          </div>

          <div className="grid gap-4">
            <ThemedCard className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg mb-1">
                    Create Delivery Request
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Send packages with reliable couriers
                  </p>
                  <PrimaryButton onClick={() => navigate('/sender/create-delivery')}>
                    New Delivery
                  </PrimaryButton>
                </div>
              </div>
            </ThemedCard>

            <ThemedCard className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <History className="w-6 h-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg mb-1">
                    My Deliveries
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track your delivery requests
                  </p>
                  <SecondaryButton onClick={() => navigate('/sender/my-deliveries')}>
                    View Deliveries
                  </SecondaryButton>
                </div>
              </div>
            </ThemedCard>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
