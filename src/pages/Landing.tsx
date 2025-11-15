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
              <KanggaLogo width={240} height={240} className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64" />
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
          <div className="space-y-3 w-full">
            <button
              type="button"
              data-testid="get-started-btn"
              onClick={(e) => {
                e?.preventDefault?.();
                e?.stopPropagation?.();
                try {
                  navigate('/choose-role');
                } catch (err) {
                  console.error('Navigation error:', err);
                }
                setTimeout(() => {
                  if (window.location.pathname !== '/choose-role') {
                    window.location.href = '/choose-role';
                  }
                }, 400);
              }}
              className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-12 px-8"
            >
              Get Started
            </button>
            <SecondaryButton
              onClick={() => navigate('/auth')}
              className="w-full"
            >
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
                onClick={() => navigate('/auth?role=driver')}
                className="text-sm text-secondary font-medium hover:underline"
              >
                Become a Driver →
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={() => navigate('/auth?role=courier')}
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
