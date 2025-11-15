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
          <div className="grid grid-cols-2 gap-4 sm:gap-6 py-6 px-2">
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-foreground text-center">Easy Booking</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-foreground text-center">Safe & Secure</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-foreground text-center">Fast Service</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-foreground text-center">Rides & Delivery</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="w-full pt-4">
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
              className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-lg font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 h-16 px-10"
            >
              Get Started
            </button>
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
