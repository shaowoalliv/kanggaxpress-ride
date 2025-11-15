import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Car, MapPin, Shield, Zap } from 'lucide-react';

export default function Landing() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect logged-in users to their dashboard based on role
      switch (profile.role) {
        case 'driver':
          navigate('/driver/dashboard');
          break;
        case 'courier':
          navigate('/courier/dashboard');
          break;
        case 'sender':
          navigate('/sender/dashboard');
          break;
        case 'passenger':
        default:
          navigate('/passenger/book-ride');
          break;
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <PageLayout showHeader={false}>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showHeader={false}>
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="max-w-md w-full space-y-8">
          {/* Logo & Branding */}
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-4">
              <Car className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-heading font-bold text-foreground">
              KanggaXpress
            </h1>
            <p className="text-xl text-secondary font-heading font-medium">
              Rooted in Tradition
            </p>
          </div>

          {/* Value Proposition */}
          <p className="text-lg text-muted-foreground">
            Community-first mobility rooted in Filipino culture. Affordable rides, trusted drivers.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Easy Booking</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Safe Rides</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Fast Pickup</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Multiple Options</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <PrimaryButton onClick={() => navigate('/signup')}>
              Get Started
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/login')}>
              Sign In
            </SecondaryButton>
          </div>

          {/* Driver CTA */}
          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Want to drive and earn?
            </p>
            <button
              onClick={() => navigate('/signup?role=driver')}
              className="text-secondary font-medium hover:underline"
            >
              Become a Driver →
            </button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
