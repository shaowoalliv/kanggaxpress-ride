import { Helmet } from 'react-helmet';
import { PageLayout } from '@/components/layout/PageLayout';
import { MapPin, User, Car, Package, CheckCircle } from 'lucide-react';

export default function HowItWorks() {
  return (
    <>
      <Helmet>
        <title>How It Works - KanggaXpress</title>
        <meta name="description" content="Learn how KanggaXpress works for passengers, drivers, and couriers" />
      </Helmet>
      <PageLayout>
        <div className="flex-1 flex flex-col px-4 py-12">
          <div className="max-w-6xl w-full mx-auto space-y-16">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-foreground">
                How It Works
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Simple steps to get started with KanggaXpress
              </p>
            </div>

            {/* For Passengers */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                  For Passengers
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-secondary">1</span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground">Sign Up</h3>
                  <p className="text-muted-foreground">Create your account as a passenger in just a few clicks</p>
                </div>

                <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-secondary">2</span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground">Book a Ride</h3>
                  <p className="text-muted-foreground">Enter your pickup and dropoff locations, choose vehicle type</p>
                </div>

                <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-secondary">3</span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground">Enjoy Your Ride</h3>
                  <p className="text-muted-foreground">Get matched with a driver and travel safely to your destination</p>
                </div>
              </div>
            </div>

            {/* For Drivers */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                  For Drivers
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-secondary">1</span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground">Register</h3>
                  <p className="text-muted-foreground">Sign up as a driver and submit your vehicle details</p>
                </div>

                <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-secondary">2</span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground">Go Online</h3>
                  <p className="text-muted-foreground">Set your availability and start receiving ride requests</p>
                </div>

                <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-secondary">3</span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground">Earn Money</h3>
                  <p className="text-muted-foreground">Accept rides, provide great service, and get paid</p>
                </div>
              </div>
            </div>

            {/* For Couriers */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                  For Couriers
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-secondary">1</span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground">Join Us</h3>
                  <p className="text-muted-foreground">Create a courier account with your delivery vehicle info</p>
                </div>

                <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-secondary">2</span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground">Accept Deliveries</h3>
                  <p className="text-muted-foreground">Choose delivery jobs that fit your schedule and location</p>
                </div>

                <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-secondary">3</span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground">Deliver & Earn</h3>
                  <p className="text-muted-foreground">Complete deliveries on your own schedule and earn income</p>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-card border-2 border-primary/20 rounded-xl p-8 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground text-center">
                Why Choose KanggaXpress?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Affordable Rates</h4>
                    <p className="text-sm text-muted-foreground">Competitive pricing for all services</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Safe & Secure</h4>
                    <p className="text-sm text-muted-foreground">Verified drivers and couriers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">24/7 Available</h4>
                    <p className="text-sm text-muted-foreground">Service available round the clock</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Easy to Use</h4>
                    <p className="text-sm text-muted-foreground">Simple and intuitive interface</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Quick Service</h4>
                    <p className="text-sm text-muted-foreground">Fast matching and delivery</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Flexible Options</h4>
                    <p className="text-sm text-muted-foreground">Multiple vehicle types to choose from</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
