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
import { MapPin, Search, Home, Building2, ShoppingCart, MapPinned, Clock, ArrowRight, Map } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { reverseGeocode, searchPlaces } from '@/lib/geocoding';
import { DestinationMapPicker } from '@/components/DestinationMapPicker';
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
  const [destinationQuery, setDestinationQuery] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState<string | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [pickupAddress, setPickupAddress] = useState<string | null>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [showMapPicker, setShowMapPicker] = useState<{ mode: 'pickup' | 'dropoff' } | null>(null);

  // Check if form is complete for Request Ride button
  const isFormComplete = Boolean(pickupAddress && dropoffAddress && selectedService);

  // Get greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Get GPS location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setPickupError("Device location not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPickupError(null);
      },
      (err) => {
        console.error("GPS error", err);
        setPickupError("Unable to get your location. Please enable GPS and refresh.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      }
    );
  }, []);

  // Reverse geocode pickup coordinates
  useEffect(() => {
    if (!pickupCoords) return;

    setIsAddressLoading(true);
    reverseGeocode(pickupCoords.lat, pickupCoords.lng)
      .then((addr) => setPickupAddress(addr))
      .catch(() => {
        setPickupAddress(
          `Location at ${pickupCoords.lat.toFixed(4)}, ${pickupCoords.lng.toFixed(4)}`
        );
      })
      .finally(() => setIsAddressLoading(false));
  }, [pickupCoords]);

  // Search for destination places (only with 3+ characters)
  useEffect(() => {
    const q = destinationQuery.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const handle = setTimeout(async () => {
      const results = await searchPlaces(q, {
        proximity: pickupCoords ?? undefined,
      });
      setSuggestions(results);
      setShowSuggestions(true);
    }, 300);

    return () => clearTimeout(handle);
  }, [destinationQuery, pickupCoords]);

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
      setDestinationQuery(recentSearches[0].destination);
      setDropoffAddress(recentSearches[0].destination);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setDestinationQuery(suggestion.fullAddress);
    setDropoffAddress(suggestion.fullAddress);
    setDropoffCoords(suggestion.coords);
    setShowSuggestions(false);
  };

  const handleMapPickerConfirm = (result: { address: string; coords: { lat: number; lng: number } }) => {
    if (showMapPicker?.mode === 'pickup') {
      setPickupAddress(result.address);
      setPickupCoords(result.coords);
      setShowMapPicker(null);
      toast.success('Pickup location updated');
    } else {
      setDestinationQuery(result.address);
      setDropoffAddress(result.address);
      setDropoffCoords(result.coords);
      setShowMapPicker(null);
      toast.success('Destination set on map');
    }
  };

  const handleChangePickupOnMap = () => {
    setShowMapPicker({ mode: 'pickup' });
  };

  const handleOpenDestinationMapPicker = () => {
    setShowMapPicker({ mode: 'dropoff' });
  };

  
  const handleRequestRide = async () => {
    if (!user || !profile) {
      toast.error('Please sign in to book a ride');
      return;
    }

    if (!selectedService || !pickupAddress || !dropoffAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const { data: ride, error } = await supabase
        .from('rides')
        .insert([{
          passenger_id: user.id,
          pickup_location: pickupAddress,
          dropoff_location: dropoffAddress,
          pickup_lat: pickupCoords?.lat,
          pickup_lng: pickupCoords?.lng,
          dropoff_lat: dropoffCoords?.lat,
          dropoff_lng: dropoffCoords?.lng,
          base_fare: selectedService.baseFare,
          ride_type: selectedService.type as RideType,
          status: 'requested',
          passenger_count: passengerCount,
          notes: notes.trim() || null,
          top_up_fare: 0,
          total_fare: selectedService.baseFare,
        }])
        .select()
        .single();

      if (error) throw error;

      // Save to recent searches
      const newSearch = {
        destination: dropoffAddress,
        pickup: pickupAddress,
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
      <main className="flex-1 w-full bg-background pb-32">
        {/* 🔒 SECTION 1: Greeting */}
        <div className="bg-primary px-4 py-4 text-primary-foreground">
          <h1 className="text-2xl font-heading font-bold">
            {greeting}, {firstName}!
          </h1>
        </div>

        <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
          {/* PICKUP + DESTINATION */}
          <section>
            <div className="mx-auto max-w-md rounded-2xl bg-amber-400/15 p-3 shadow-sm space-y-3">
              {/* PICKUP */}
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                  Pickup
                </div>

                <div className="flex items-center gap-2">
                  {/* Pickup address card */}
                  <button
                    type="button"
                    onClick={handleChangePickupOnMap}
                    className="flex-1 flex items-center rounded-xl bg-white px-3 py-2 shadow-sm"
                  >
                    <div className="h-3 w-3 rounded-full border border-amber-500 mr-2 flex-shrink-0" />
                    <div className="text-sm font-medium truncate">
                      {pickupAddress || 'Use current location or set on map'}
                    </div>
                  </button>

                  {/* Map button */}
                  <button
                    type="button"
                    onClick={handleChangePickupOnMap}
                    className="flex-shrink-0 rounded-full bg-amber-50 p-2 shadow-sm hover:bg-amber-100"
                  >
                    <MapPin className="h-4 w-4 text-amber-700" />
                  </button>
                </div>
              </div>

              {/* DESTINATION */}
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                  Destination
                </div>

                <div className="flex items-center gap-2">
                  {/* Destination input card */}
                  <div className="flex-1 flex items-center rounded-xl bg-white px-3 py-2 shadow-sm">
                    <Search className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Where are you heading?"
                      value={destinationQuery}
                      onChange={(e) => setDestinationQuery(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Map button */}
                  <button
                    type="button"
                    onClick={handleOpenDestinationMapPicker}
                    className="flex-shrink-0 rounded-full bg-amber-50 p-2 shadow-sm hover:bg-amber-100"
                  >
                    <MapPin className="h-4 w-4 text-amber-700" />
                  </button>
                </div>
              </div>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && (suggestions.length > 0 || destinationQuery.trim().length >= 3) && (
              <div className="mt-1">
                <div className="rounded-2xl bg-white shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                  {/* Custom "use exactly what I typed" option */}
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      const text = destinationQuery.trim();
                      if (!text) return;
                      setDropoffAddress(text);
                      setDropoffCoords(null);
                      setShowSuggestions(false);
                    }}
                  >
                    <span className="text-sm">Use this address: </span>
                    <span className="text-sm font-medium">"{destinationQuery.trim()}"</span>
                  </button>

                  {/* Mapbox suggestions */}
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {suggestion.primary}
                          </div>
                          {suggestion.secondary && (
                            <div className="text-xs text-muted-foreground truncate mt-1">
                              {suggestion.secondary}
                            </div>
                          )}
                        </div>
                        {suggestion.distanceKm !== undefined && (
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {suggestion.distanceKm < 1 
                              ? `${Math.round(suggestion.distanceKm * 1000)}m`
                              : `${suggestion.distanceKm.toFixed(1)}km`
                            }
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

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
        <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-kx-yellow/95 to-kx-yellow/0 pb-3 pt-2">
          <div className="mx-auto max-w-md px-3">
            <div className="rounded-2xl bg-white shadow-lg px-3 py-3 space-y-2">
              {/* Compact Status Row */}
              <div className="flex items-center justify-between text-[11px] text-gray-700">
                <div className="flex items-center gap-1">
                  <span className={pickupAddress ? 'text-emerald-600' : 'text-red-500'}>
                    ●
                  </span>
                  <span>{pickupAddress ? 'Pickup set' : 'Pickup not set'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={dropoffAddress ? 'text-emerald-600' : 'text-red-500'}>
                    ●
                  </span>
                  <span>{dropoffAddress ? 'Destination set' : 'Destination not set'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={selectedService ? 'text-emerald-600' : 'text-gray-400'}>
                    ●
                  </span>
                  <span>
                    {selectedService
                      ? `${selectedService.name} ₱${selectedService.baseFare}`
                      : 'Service'}
                  </span>
                </div>
              </div>
              
              {/* Request Ride Button */}
              <PrimaryButton
                onClick={handleRequestRide}
                disabled={!isFormComplete || loading}
                isLoading={loading}
                className="h-11 rounded-full text-sm font-semibold"
              >
                Request Ride
                <ArrowRight className="w-4 h-4 ml-1" />
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Map Picker Modal */}
        {showMapPicker && (
          <DestinationMapPicker
            mode={showMapPicker.mode}
            initialCenter={
              showMapPicker.mode === 'pickup' 
                ? (pickupCoords || undefined)
                : (dropoffCoords || pickupCoords || undefined)
            }
            onConfirm={handleMapPickerConfirm}
            onClose={() => setShowMapPicker(null)}
          />
        )}
      </main>
    </PageLayout>
  );
}
