import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { KanggaLogo } from '@/components/KanggaLogo';
import { MapPin, Shield, Zap, Package } from 'lucide-react';

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
            <div className="inline-flex items-center justify-center mb-4">
              <KanggaLogo width={120} height={120} className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-bold text-foreground">
              KanggaXpress
            </h1>
            <p className="text-xl sm:text-2xl text-secondary font-heading font-medium">
              Rooted in Tradition
            </p>
          </div>

          {/* Value Proposition */}
          <p className="text-base sm:text-lg text-muted-foreground px-4">
            Community-first mobility & delivery rooted in Filipino culture. Affordable rides, trusted drivers & couriers.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 py-6 px-2">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-center">Easy Booking</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-center">Safe & Secure</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-center">Fast Service</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-center">Rides & Delivery</p>
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

          {/* Driver/Courier CTA */}
          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Want to drive or deliver and earn?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/signup?role=driver')}
                className="text-sm text-secondary font-medium hover:underline"
              >
                Become a Driver →
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={() => navigate('/signup?role=courier')}
                className="text-sm text-secondary font-medium hover:underline"
              >
                Become a Courier →
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
