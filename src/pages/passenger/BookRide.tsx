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
import { MapPin, User, Bike, Car as CarIcon, Search, Home, Building2, ShoppingCart, MapPinned, Clock } from 'lucide-react';

/**
 * 🔒 LOCKED LAYOUT - /passenger/book-ride (Canonical Mobile-First Ride Home Screen)
 * 
 * CRITICAL: This layout is LOCKED and must NOT be restructured without explicit user approval.
 * 
 * Section order (top to bottom):
 * 1. Top app bar (via PageLayout - hamburger menu, profile, notifications)
 * 2. Greeting + Location
 * 3. Destination search bar
 * 4. Recent Searches
 * 5. Quick Access buttons
 * 6. All Kanggaxpress Services grid
 * 7. Booking form (shown when service selected)
 * 
 * Do NOT reorder, remove, or add sections between these without explicit permission.
 */

const services: Array<{ type: RideType | 'package'; name: string; icon: any; baseFare: number; isPackage?: boolean }> = [
  { type: 'car' as RideType, name: 'Car', icon: CarIcon, baseFare: 80 },
  { type: 'motor' as RideType, name: 'Motorcycle', icon: Bike, baseFare: 40 },
  { type: 'tricycle' as RideType, name: 'Tricycle', icon: CarIcon, baseFare: 50 },
  { type: 'package', name: 'Send Package', icon: ShoppingCart, baseFare: 45, isPackage: true },
];

const quickAccessItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'office', label: 'Office', icon: Building2 },
  { id: 'market', label: 'Market', icon: ShoppingCart },
  { id: 'terminal', label: 'Terminal', icon: MapPinned },
];

export default function BookRide() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [destination, setDestination] = useState('');
  const [pickup, setPickup] = useState('');
  const [selectedType, setSelectedType] = useState<RideType | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [recentSearches, setRecentSearches] = useState<any[]>([]);

  // Get greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('kanggaxpress_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  // Auth check
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile?.role === 'driver') {
      navigate('/driver/dashboard');
    }
  }, [user, profile, navigate]);

  const firstName = profile?.full_name?.split(' ')[0] || 'User';
  
  const handleServiceClick = (service: typeof services[0]) => {
    if (service.isPackage) {
      navigate('/sender/dashboard');
      return;
    }
    setSelectedType(service.type as RideType);
    // Scroll to booking form
    setTimeout(() => {
      document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleQuickAccess = (id: string) => {
    toast.info(`${id.charAt(0).toUpperCase() + id.slice(1)} quick access coming soon!`);
  };

  
  const handleRecentSearchClick = () => {
    if (recentSearches[0]) {
      setDestination(recentSearches[0].destination);
      setPickup(recentSearches[0].pickup);
    }
  };

  const handleBookRide = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast.error('Please sign in to book a ride');
      return;
    }

    if (!selectedType) {
      toast.error('Please select a ride type');
      return;
    }

    if (!pickup.trim() || !destination.trim()) {
      toast.error('Please enter both pickup and destination');
      return;
    }

    try {
      setLoading(true);
      
      const selectedService = services.find(s => s.type === selectedType);
      
      await ridesService.createRide(profile.id, {
        pickup_location: pickup.trim(),
        dropoff_location: destination.trim(),
        ride_type: selectedType,
        passenger_count: passengerCount,
        notes: notes.trim() || undefined,
        fare_estimate: selectedService?.baseFare,
      });

      // Save to recent searches
      const newSearch = {
        destination: destination.trim(),
        pickup: pickup.trim(),
        timestamp: Date.now(),
      };
      const updated = [newSearch, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('kanggaxpress_recent_searches', JSON.stringify(updated));

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

  const mostRecentSearch = recentSearches[0];

  return (
    <PageLayout>
      <div className="flex-1 w-full bg-background">
        {/* 🔒 SECTION 1: Greeting + Location */}
        <div className="bg-primary px-4 py-6 text-primary-foreground">
          <h1 className="text-2xl font-heading font-bold mb-2">
            {greeting}, {firstName}!
          </h1>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <MapPin className="w-4 h-4" />
            <span>📍 Set your pickup location</span>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
          {/* 🔒 SECTION 2: Destination Search Bar */}
          <ThemedCard className="flex items-center gap-3 py-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Where are you heading?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-base"
            />
          </ThemedCard>

          {/* 🔒 SECTION 3: Recent Searches */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Searches
            </h2>
            <ThemedCard 
              className="bg-muted/30 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={handleRecentSearchClick}
            >
              {mostRecentSearch ? (
                <div>
                  <p className="font-medium truncate">{mostRecentSearch.destination}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    From {mostRecentSearch.pickup}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No recent searches yet. Start a booking and we'll show your last routes here.
                </p>
              )}
            </ThemedCard>
          </div>

          {/* 🔒 SECTION 4: Quick Access */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Quick Access</h2>
            <div className="grid grid-cols-4 gap-4">
              {quickAccessItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleQuickAccess(item.id)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-16 h-16 rounded-full bg-card shadow-md flex items-center justify-center hover:shadow-lg transition-shadow active:scale-95">
                    <item.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 🔒 SECTION 5: All Kanggaxpress Services */}
          <div>
            <h2 className="text-lg font-semibold mb-3">All Kanggaxpress Services</h2>
            <div className="grid grid-cols-2 gap-4">
              {services.map((service) => (
                <ThemedCard
                  key={service.type}
                  onClick={() => handleServiceClick(service)}
                  className="flex flex-col items-center justify-center p-6 cursor-pointer hover:shadow-lg transition-all active:scale-[0.97]"
                >
                  <div className="w-16 h-16 flex items-center justify-center mb-3">
                    <service.icon className="w-12 h-12 text-secondary" style={{ objectFit: 'contain' }} />
                  </div>
                  <p className="font-semibold text-center mb-1">{service.name}</p>
                  <p className="text-primary font-bold">₱{service.baseFare}</p>
                </ThemedCard>
              ))}
            </div>
          </div>

          {/* 🔒 SECTION 6: Booking Form (shown when service selected) */}
          {selectedType && (
            <div id="booking-form" className="space-y-4 pt-6 border-t-2 border-border">
              <h2 className="text-xl font-heading font-bold">Complete Your Booking</h2>
              
              <form onSubmit={handleBookRide} className="space-y-4">
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
                    className="h-12"
                  />
                </div>

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
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <ThemedCard className="bg-muted/30">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Estimated Fare</span>
                    <span className="text-2xl font-bold text-primary">
                      ₱{services.find(s => s.type === selectedType)?.baseFare}
                    </span>
                  </div>
                </ThemedCard>

                <PrimaryButton type="submit" isLoading={loading} className="w-full">
                  Request Ride
                </PrimaryButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
