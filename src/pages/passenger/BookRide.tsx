import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RideType } from '@/types';
import { toast } from 'sonner';
import { MapPin, User, Search, Home, Building2, ShoppingCart, MapPinned, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import carIcon from '@/assets/car-icon.png';
import motorcycleIcon from '@/assets/motorcycle-icon.png';
import tricycleIcon from '@/assets/tricycle-icon.png';
import courierIcon from '@/assets/courier-icon.png';

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

/**
 * 🔒 LOCKED - All Kanggaxpress Services Configuration
 * 
 * CRITICAL: This services array is LOCKED and must NOT be modified without explicit user approval.
 * 
 * Service structure:
 * - Car: ₱80 base fare, car-icon.png
 * - Motorcycle: ₱40 base fare, motorcycle-icon.png
 * - Tricycle: ₱50 base fare, tricycle-icon.png
 * - Send Package: ₱45 base fare, courier-icon.png (redirects to /sender/dashboard)
 * 
 * Icons are custom PNG files stored in src/assets/
 * Do NOT change icons, names, order, or base fares without explicit permission.
 */
const services: Array<{ type: RideType | 'package'; name: string; icon: string; baseFare: number; isPackage?: boolean }> = [
  { type: 'car' as RideType, name: 'Car', icon: carIcon, baseFare: 80 },
  { type: 'motor' as RideType, name: 'Motorcycle', icon: motorcycleIcon, baseFare: 40 },
  { type: 'tricycle' as RideType, name: 'Tricycle', icon: tricycleIcon, baseFare: 50 },
  { type: 'package', name: 'Send Package', icon: courierIcon, baseFare: 45, isPackage: true },
];
// 🔒 END LOCKED SECTION

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
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [recentSearches, setRecentSearches] = useState<any[]>([]);

  // Check if form is complete for Request Ride button
  const isFormComplete = Boolean(pickup.trim() && destination.trim() && selectedService);

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
    setSelectedService(service);
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

  
  const handleRequestRide = async () => {
    if (!user || !profile) {
      toast.error('Please sign in to book a ride');
      return;
    }

    if (!selectedService || !pickup.trim() || !destination.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const { data: ride, error } = await supabase
        .from('rides')
        .insert([{
          passenger_id: user.id,
          pickup_location: pickup.trim(),
          dropoff_location: destination.trim(),
          base_fare: selectedService.baseFare,
          ride_type: selectedService.type as RideType,
          status: 'requested',
          passenger_count: passengerCount,
          notes: notes.trim() || null,
        }])
        .select()
        .single();

      if (error) throw error;

      // Save to recent searches
      const newSearch = {
        destination: destination.trim(),
        pickup: pickup.trim(),
        timestamp: Date.now(),
      };
      const updated = [newSearch, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('kanggaxpress_recent_searches', JSON.stringify(updated));

      toast.success('Ride requested! Finding a driver...');
      navigate(`/passenger/ride-status/${ride.id}`);
    } catch (error) {
      console.error('Error requesting ride:', error);
      toast.error('Failed to request ride. Please try again.');
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

          {/* 🔒 SECTION 5: All Kanggaxpress Services - LOCKED */}
          {/* 
            🔒 CRITICAL: This services grid section is LOCKED
            
            Requirements:
            - Must maintain 2x2 grid layout
            - Each card must show: icon (custom PNG), service name, base fare
            - Icons must use object-contain to prevent stretching
            - Card order: Car, Motorcycle, Tricycle, Send Package
            - Send Package redirects to /sender/dashboard
            - Other services scroll to booking form
            
            Do NOT modify layout, styling, or behavior without explicit permission.
          */}
          <div>
            <h2 className="text-lg font-semibold mb-3">All Kanggaxpress Services</h2>
            <div className="grid grid-cols-2 gap-4">
              {services.map((service) => (
                <ThemedCard
                  key={service.type}
                  onClick={() => handleServiceClick(service)}
                  className={`flex flex-col items-center justify-center p-6 cursor-pointer transition-all active:scale-[0.97] ${
                    selectedService?.type === service.type
                      ? 'ring-2 ring-primary bg-primary/5 shadow-lg'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <div className="w-16 h-16 flex items-center justify-center mb-3">
                    <img src={service.icon} alt={service.name} className="w-full h-full object-contain" />
                  </div>
                  <p className="font-semibold text-center mb-1">{service.name}</p>
                  <p className="text-primary font-bold">₱{service.baseFare}</p>
                </ThemedCard>
              ))}
            </div>
          </div>
          {/* 🔒 END LOCKED SECTION - All Kanggaxpress Services */}

          {/* Bottom spacing for sticky bar */}
          <div className="h-32" />
        </div>

        {/* Bottom Sticky Request Ride Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
            {/* Summary */}
            <div className="space-y-1 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-muted-foreground">From: </span>
                  <span className="font-medium">{pickup || 'Not set'}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-muted-foreground">To: </span>
                  <span className="font-medium">{destination || 'Not set'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Service: </span>
                <span className="font-medium">{selectedService?.name || 'Not selected'}</span>
                {selectedService && (
                  <span className="text-primary font-bold">₱{selectedService.baseFare}</span>
                )}
              </div>
            </div>

            {/* Request Ride Button */}
            <PrimaryButton
              onClick={handleRequestRide}
              disabled={!isFormComplete || loading}
              isLoading={loading}
              className="w-full"
            >
              Request Ride
              <ArrowRight className="w-5 h-5 ml-2" />
            </PrimaryButton>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
