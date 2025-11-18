import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ridesService } from '@/services/rides';
import { RideType } from '@/types';
import { toast } from 'sonner';
import { MapPin, User, Bike, Car as CarIcon, Search, Bell, Home, Briefcase, ShoppingBag, Building2, Package } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const serviceOptions = [
  { type: 'motor' as RideType, name: 'Motor', icon: Bike, price: 50, description: 'Budget & fast' },
  { type: 'tricycle' as RideType, name: 'Tricycle', icon: CarIcon, price: 80, description: 'Comfort for groups' },
  { type: 'car' as RideType, name: 'Car', icon: CarIcon, price: 120, description: 'Premium comfort' },
  { type: 'motor' as RideType, name: 'Delivery Rider', icon: Package, price: 45, description: 'Send packages' },
];

const quickLocations = [
  { name: 'Home', icon: Home },
  { name: 'Office', icon: Briefcase },
  { name: 'Market', icon: ShoppingBag },
  { name: 'Terminal', icon: Building2 },
];

export default function BookRide() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('Calapan City Terminal');
  const [dropoff, setDropoff] = useState('');
  const [selectedType, setSelectedType] = useState<RideType | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile?.role === 'driver') {
      navigate('/driver/dashboard');
    }

    // Realtime presence subscriber stub (baseline wiring)
    // Contract: presence:CALAPAN channel
    if (import.meta.env.VITE_ENABLE_REALTIME === 'true') {
      console.log('[Realtime] Subscribing to presence:CALAPAN for driver markers');
      // TODO: Actual Supabase Realtime subscribe when configured
      // On message: render green markers by vehicle_type (motor/tricycle/car)
    }
  }, [user, profile, navigate]);

  const selectedOption = selectedType ? serviceOptions.find(opt => opt.type === selectedType) : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = profile?.full_name?.split(' ')[0] || 'Kanggaxpress Rider';

  const handleServiceSelect = (type: RideType) => {
    setSelectedType(type);
    setShowBookingSheet(true);
  };

  const handleBookRide = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast.error('Please sign in to book a ride');
      return;
    }

    if (!pickup.trim() || !dropoff.trim()) {
      toast.error('Please enter both pickup and drop-off locations');
      return;
    }

    if (!selectedType) {
      toast.error('Please select a service type');
      return;
    }

    try {
      setLoading(true);
      await ridesService.createRide(profile.id, {
        pickup_location: pickup.trim(),
        dropoff_location: dropoff.trim(),
        ride_type: selectedType,
        passenger_count: passengerCount,
        notes: notes.trim() || undefined,
        fare_estimate: selectedOption?.price,
      });

      toast.success('Ride requested! Looking for a driver...');
      navigate('/passenger/my-rides');
    } catch (error) {
      console.error('Error booking ride:', error);
      toast.error('Failed to book ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile || profile.role !== 'passenger') {
    return null;
  }

  return (
    <PageLayout>
      <div className="flex-1 w-full">
        {/* Header Section with Greeting */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary/90 px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary-foreground mb-1 sm:mb-2">
                  {getGreeting()}, {displayName}
                </h1>
                <div className="flex items-center gap-2 text-primary-foreground/90">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm sm:text-base truncate max-w-[200px] sm:max-w-xs">
                    {pickup}
                  </p>
                </div>
              </div>
              <button 
                className="p-2 sm:p-3 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </button>
            </div>

            {/* Search Bar */}
            <ThemedCard className="bg-background shadow-lg">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <Input
                  placeholder="Where are you heading?"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  onFocus={() => setSearchFocus(true)}
                  onBlur={() => setSearchFocus(false)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-base"
                />
              </div>
            </ThemedCard>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">
          {/* Recent Search */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Search</h3>
            <ThemedCard className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">Calapan Public Market</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Last visited 2 days ago</p>
                </div>
              </div>
            </ThemedCard>
          </div>

          {/* Quick Locations */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Access</h3>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1">
              {quickLocations.map((location) => (
                <button
                  key={location.name}
                  className="flex flex-col items-center gap-2 min-w-[70px] sm:min-w-[80px]"
                  onClick={() => setDropoff(location.name)}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <location.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-foreground">{location.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* All Services */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">All Kanggaxpress Services</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {serviceOptions.map((service) => (
                <ThemedCard
                  key={service.name}
                  onClick={() => handleServiceSelect(service.type)}
                  className={`text-center cursor-pointer transition-all ${
                    selectedType === service.type
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <service.icon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-primary" />
                  <p className="font-semibold text-sm sm:text-base mb-1">{service.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
                  <p className="text-primary font-bold text-sm sm:text-base">₱{service.price}</p>
                </ThemedCard>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Details Sheet */}
        <Sheet open={showBookingSheet} onOpenChange={setShowBookingSheet}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="text-xl sm:text-2xl">Booking Details</SheetTitle>
            </SheetHeader>
            
            <form onSubmit={handleBookRide} className="mt-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)] pb-6">
              {/* Pickup & Dropoff */}
              <ThemedCard>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickup" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Pickup Location
                    </Label>
                    <Input
                      id="pickup"
                      placeholder="Enter pickup location"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      required
                      className="h-12 sm:h-14"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dropoff" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-destructive" />
                      Drop-off Location
                    </Label>
                    <Input
                      id="dropoff"
                      placeholder="Enter drop-off location"
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                      required
                      className="h-12 sm:h-14"
                    />
                  </div>
                </div>
              </ThemedCard>

              {/* Selected Service */}
              {selectedOption && (
                <ThemedCard className="bg-primary/5">
                  <div className="flex items-center gap-4">
                    <selectedOption.icon className="w-12 h-12 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-base sm:text-lg">{selectedOption.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedOption.description}</p>
                    </div>
                    <p className="text-2xl font-bold text-primary">₱{selectedOption.price}</p>
                  </div>
                </ThemedCard>
              )}

              {/* Additional Details */}
              <ThemedCard>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passengers" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Number of Passengers
                    </Label>
                    <Input
                      id="passengers"
                      type="number"
                      min="1"
                      max="8"
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                      className="h-12 sm:h-14"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special instructions for the driver?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </ThemedCard>

              {/* Estimate */}
              <ThemedCard className="bg-muted/30">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Estimated Fare</span>
                  <span className="text-2xl sm:text-3xl font-bold text-primary">
                    ₱{selectedOption?.price || 0}
                  </span>
                </div>
              </ThemedCard>

              <PrimaryButton type="submit" isLoading={loading} className="w-full">
                Request Ride
              </PrimaryButton>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </PageLayout>
  );
}
