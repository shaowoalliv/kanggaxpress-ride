import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { KanggaLogo } from '@/components/KanggaLogo';
import { MapPin, Shield, Zap, Package, Heart, Users, Clock } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <PageLayout showHeader={false}>
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-4 text-center min-h-screen">
        <div className="max-w-md w-full space-y-4">
          {/* Logo & Branding */}
          <div className="space-y-1">
            <div className="inline-flex items-center justify-center">
              <KanggaLogo width={240} height={240} className="w-48 h-48" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              KanggaXpress
            </h1>
            <p className="text-lg text-secondary font-heading font-medium">
              Rooted in Tradition
            </p>
          </div>

          {/* Value Proposition */}
          <p className="text-sm text-muted-foreground px-2">
            Community-first mobility & delivery rooted in Filipino culture
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2 py-3">
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="text-xs font-semibold text-foreground">Easy Booking</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="text-xs font-semibold text-foreground">Safe & Secure</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="text-xs font-semibold text-foreground">Fast Service</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="text-xs font-semibold text-foreground">Rides & Delivery</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="w-full pt-2">
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
              className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 h-14 px-8"
            >
              Get Started
            </button>
          </div>

          {/* Driver/Courier CTA */}
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Want to drive or deliver and earn?
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => navigate('/auth?role=driver')}
                className="text-xs text-secondary font-medium hover:underline"
              >
                Become a Driver →
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={() => navigate('/auth?role=courier')}
                className="text-xs text-secondary font-medium hover:underline"
              >
                Become a Courier →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why KanggaXpress Section */}
      <section className="px-4 py-12 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-8">
            Why Choose KanggaXpress?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center shadow-lg">
                <Heart className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">Community First</h3>
              <p className="text-sm text-muted-foreground">
                Built for Filipinos, by Filipinos. Supporting local communities and culture.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center shadow-lg">
                <Users className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">Fair for Everyone</h3>
              <p className="text-sm text-muted-foreground">
                Better earnings for drivers and affordable fares for passengers.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center shadow-lg">
                <Clock className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">Always Available</h3>
              <p className="text-sm text-muted-foreground">
                24/7 service with multiple vehicle options to fit your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-8">
            How It Works
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">Book Your Ride</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your pickup and drop-off locations, choose your preferred vehicle type.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">Get Matched</h3>
                <p className="text-sm text-muted-foreground">
                  We'll find the nearest available driver to pick you up quickly.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">Enjoy Your Journey</h3>
                <p className="text-sm text-muted-foreground">
                  Track your ride in real-time and reach your destination safely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Admin Link */}
      <footer className="py-4 px-4 text-center border-t border-border">
        <p className="text-xs text-muted-foreground">
          &copy; 2025 KanggaXpress. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          <a href="/admin-sign-in" className="hover:text-primary transition-colors">
            Admin
          </a>
        </p>
      </footer>
    </PageLayout>
  );
}
