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
import { MapPin, User, Search, Bell, Home, Briefcase, ShoppingBag, Building2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AddressAutocompleteInput } from '@/components/AddressAutocompleteInput';
import { cn } from '@/lib/utils';
import motorIcon from '@/assets/motorcycle-icon.png';
import tricycleIcon from '@/assets/tricycle-icon.png';
import carIcon from '@/assets/car-icon.png';
import courierIcon from '@/assets/courier-icon.png';

const serviceOptions = [
  { type: 'motor' as RideType, name: 'Motor', image: motorIcon, price: 50, description: 'Budget & fast' },
  { type: 'tricycle' as RideType, name: 'Tricycle', image: tricycleIcon, price: 80, description: 'Comfort for groups' },
  { type: 'car' as RideType, name: 'Car', image: carIcon, price: 120, description: 'Premium comfort' },
  { type: 'motor' as RideType, name: 'Delivery Rider', image: courierIcon, price: 45, description: 'Send packages' },
];

const quickLocations = [
  { name: 'Home', icon: Home, address: 'Saved Home Address' },
  { name: 'Office', icon: Briefcase, address: 'Saved Office Address' },
  { name: 'Market', icon: ShoppingBag, address: 'Calapan Public Market' },
  { name: 'Terminal', icon: Building2, address: 'Calapan City Terminal' },
];

type RecentSearch = {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  timestamp: number;
};

type QuickAccessSlotKey = "home" | "office" | "market" | "terminal";
type QuickAccessSlot = {
  label: string;
  address?: string;
  lat?: number;
  lng?: number;
};

export default function BookRide() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [currentLocation, setCurrentLocation] = useState('Getting your location...');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [currentLocationCoords, setCurrentLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedType, setSelectedType] = useState<RideType | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [selectedQuickAccess, setSelectedQuickAccess] = useState<string | null>(null);
  const [quickAccess, setQuickAccess] = useState<Record<QuickAccessSlotKey, QuickAccessSlot>>({
    home: { label: "Home" },
    office: { label: "Office" },
    market: { label: "Market" },
    terminal: { label: "Terminal" },
  });
  const [editingSlot, setEditingSlot] = useState<QuickAccessSlotKey | null>(null);
  const [showQuickAccessEditor, setShowQuickAccessEditor] = useState(false);

  // Reverse geocoding helper
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await res.json();
      return data.display_name ?? `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
    }
  };

  // Get GPS location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocationCoords({ lat: latitude, lng: longitude });
          setCurrentLocation('Locating your address...');
        },
        (error) => {
          console.error('Error getting location:', error);
          setCurrentLocation('Calapan City Terminal');
          setCurrentAddress('Calapan City Terminal');
          setPickup('Calapan City Terminal');
        }
      );
    } else {
      setCurrentLocation('Calapan City Terminal');
      setCurrentAddress('Calapan City Terminal');
      setPickup('Calapan City Terminal');
    }

    // Load recent searches from localStorage
    try {
      const raw = localStorage.getItem('kx_recent_searches');
      if (raw) {
        const parsed = JSON.parse(raw) as RecentSearch[];
        setRecentSearches(parsed);
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }

    // Fetch recent rides from backend
    const fetchRecentRides = async () => {
      if (!user) return;
      try {
        const rides = await ridesService.getPassengerRides(user.id);
        setRecentRides(rides.slice(0, 5)); // Get last 5 rides
      } catch (error) {
        console.error('Error fetching recent rides:', error);
      }
    };

    fetchRecentRides();
  }, [user]);

  // Reverse geocode when coordinates are available
  useEffect(() => {
    if (!currentLocationCoords) return;

    setIsAddressLoading(true);
    reverseGeocode(currentLocationCoords.lat, currentLocationCoords.lng)
      .then((address) => {
        setCurrentAddress(address);
        setCurrentLocation(address);
        setPickup(address);
      })
      .catch(() => {
        const fallback = `Lat ${currentLocationCoords.lat.toFixed(4)}, Lng ${currentLocationCoords.lng.toFixed(4)}`;
        setCurrentAddress(fallback);
        setCurrentLocation(fallback);
        setPickup(fallback);
      })
      .finally(() => {
        setIsAddressLoading(false);
      });
  }, [currentLocationCoords]);

  // Load Quick Access slots from localStorage
  useEffect(() => {
    const slots: QuickAccessSlotKey[] = ["home", "office", "market", "terminal"];
    const loaded: Record<QuickAccessSlotKey, QuickAccessSlot> = {
      home: { label: "Home" },
      office: { label: "Office" },
      market: { label: "Market" },
      terminal: { label: "Terminal" },
    };

    slots.forEach((key) => {
      try {
        const raw = localStorage.getItem(`kx_quick_access_${key}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          loaded[key] = { ...loaded[key], ...parsed };
        }
      } catch (e) {
        console.error(`Failed to load quick access ${key}`, e);
      }
    });

    setQuickAccess(loaded);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile?.role === 'driver') {
      navigate('/driver/dashboard');
    }

    // Realtime presence subscriber stub (baseline wiring)
    if (import.meta.env.VITE_ENABLE_REALTIME === 'true') {
      console.log('[Realtime] Subscribing to presence:CALAPAN for driver markers');
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

  const handleQuickAccessSelect = (location: typeof quickLocations[0]) => {
    setDropoff(location.address);
    setSelectedQuickAccess(location.name);
  };

  const saveRecentSearch = (pickupAddress: string, dropoffAddress: string) => {
    setRecentSearches(prev => {
      const next: RecentSearch[] = [
        {
          id: `${Date.now()}`,
          pickupAddress,
          dropoffAddress,
          timestamp: Date.now(),
        },
        ...prev,
      ]
        // remove duplicates of the same pickup+dropoff
        .filter(
          (s, index, arr) =>
            arr.findIndex(
              t =>
                t.pickupAddress === s.pickupAddress &&
                t.dropoffAddress === s.dropoffAddress
            ) === index
        )
        // keep only last 5
        .slice(0, 5);

      localStorage.setItem('kx_recent_searches', JSON.stringify(next));
      return next;
    });
  };

  // Save Quick Access slot
  const saveQuickAccessSlot = (key: QuickAccessSlotKey, address: string, lat: number, lng: number) => {
    const updated = { ...quickAccess[key], address, lat, lng };
    setQuickAccess(prev => ({ ...prev, [key]: updated }));
    localStorage.setItem(`kx_quick_access_${key}`, JSON.stringify(updated));
  };

  // Clear Quick Access slot
  const clearQuickAccessSlot = (key: QuickAccessSlotKey) => {
    const cleared = { label: quickAccess[key].label };
    setQuickAccess(prev => ({ ...prev, [key]: cleared }));
    localStorage.removeItem(`kx_quick_access_${key}`);
  };

  // Handle Quick Access tap
  const handleQuickAccessTap = (key: QuickAccessSlotKey) => {
    const slot = quickAccess[key];
    if (slot.address) {
      setDropoff(slot.address);
      if (currentAddress) {
        saveRecentSearch(currentAddress, slot.address);
      }
      setShowBookingSheet(true);
    } else {
      setEditingSlot(key);
      setShowQuickAccessEditor(true);
    }
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
      
      // Save to recent searches
      saveRecentSearch(pickup.trim(), dropoff.trim());

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
                    {isAddressLoading ? 'Locating your address...' : currentAddress || currentLocation}
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
              <AddressAutocompleteInput
                value={dropoff}
                onChange={setDropoff}
                placeholder="Where are you heading?"
                icon={<Search className="w-5 h-5 text-muted-foreground" />}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-base"
                proximityLocation={currentLocationCoords || undefined}
              />
            </ThemedCard>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">
          {/* Recent Searches - Always Visible */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Searches</h3>
            
            {recentSearches.length === 0 ? (
              <div className="rounded-2xl bg-[hsl(var(--primary)/0.15)] border border-[hsl(var(--primary)/0.25)] px-4 py-3 text-xs text-foreground/70">
                No recent searches yet. Start a booking and we'll show your last routes here.
              </div>
            ) : (
              <button
                type="button"
                className="w-full text-left rounded-2xl bg-[hsl(var(--primary)/0.2)] hover:bg-[hsl(var(--primary)/0.3)] border border-[hsl(var(--primary)/0.3)] shadow-md px-4 py-3 transition-colors"
                onClick={() => {
                  const last = recentSearches[0];
                  setPickup(last.pickupAddress);
                  setDropoff(last.dropoffAddress);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Last ride</div>
                    <div className="text-sm font-semibold truncate">
                      {recentSearches[0].dropoffAddress}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      From {recentSearches[0].pickupAddress}
                    </div>
                  </div>
                </div>
              </button>
            )}
          </section>

          {/* Quick Locations */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Access</h3>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1">
              {quickLocations.map((location) => (
                <button
                  key={location.name}
                  className="flex flex-col items-center gap-2 min-w-[70px] sm:min-w-[80px]"
                  onClick={() => handleQuickAccessSelect(location)}
                >
                  <div className={cn(
                    "w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-background flex items-center justify-center shadow-md hover:shadow-lg transition-all",
                    selectedQuickAccess === location.name 
                      ? "border-3 border-primary ring-2 ring-primary/20" 
                      : "border-2 border-border"
                  )}>
                    <location.icon className="w-6 h-6 sm:w-7 sm:h-7 text-foreground" />
                  </div>
                  <span className={cn(
                    "text-xs sm:text-sm font-medium",
                    selectedQuickAccess === location.name ? "text-primary font-bold" : "text-foreground"
                  )}>{location.name}</span>
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
                  <img 
                    src={service.image} 
                    alt={service.name} 
                    className={cn(
                      "mx-auto mb-2 sm:mb-3 object-contain",
                      service.type === 'car' ? "w-12 h-12 sm:w-16 sm:h-16" : "w-10 h-10 sm:w-12 sm:h-12"
                    )} 
                  />
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
                    <AddressAutocompleteInput
                      value={pickup}
                      onChange={setPickup}
                      placeholder="Enter pickup location"
                      icon={<MapPin className="w-4 h-4 text-primary" />}
                      className="h-12 sm:h-14"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dropoff" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-destructive" />
                      Drop-off Location
                    </Label>
                    <AddressAutocompleteInput
                      value={dropoff}
                      onChange={setDropoff}
                      placeholder="Enter drop-off location"
                      icon={<MapPin className="w-4 h-4 text-destructive" />}
                      className="h-12 sm:h-14"
                    />
                  </div>
                </div>
              </ThemedCard>

              {/* Selected Service */}
              {selectedOption && (
                <ThemedCard className="bg-primary/5">
                  <div className="flex items-center gap-4">
                    <img src={selectedOption.image} alt={selectedOption.name} className="w-12 h-12 object-contain" />
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

        {/* Quick Access Editor Sheet */}
        <Sheet open={showQuickAccessEditor} onOpenChange={setShowQuickAccessEditor}>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="text-xl sm:text-2xl">
                {editingSlot && quickAccess[editingSlot]?.address ? 'Edit' : 'Set'} {editingSlot && quickAccess[editingSlot]?.label}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-sm sm:text-base">Address</Label>
                <AddressAutocompleteInput
                  value={editingSlot ? quickAccess[editingSlot]?.address || '' : ''}
                  onChange={(value) => {
                    // Update temporary state only
                  }}
                  onSelectAddress={(location) => {
                    if (editingSlot) {
                      saveQuickAccessSlot(editingSlot, location.formattedAddress, location.lat, location.lng);
                      toast.success(`${quickAccess[editingSlot].label} saved!`);
                      setShowQuickAccessEditor(false);
                      setEditingSlot(null);
                    }
                  }}
                  placeholder={`Search for your ${editingSlot ? quickAccess[editingSlot]?.label.toLowerCase() : 'location'}`}
                  proximityLocation={currentLocationCoords}
                  className="h-12 sm:h-14"
                />
              </div>

              {editingSlot && quickAccess[editingSlot]?.address && (
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      if (editingSlot) {
                        clearQuickAccessSlot(editingSlot);
                        toast.success(`${quickAccess[editingSlot].label} cleared`);
                        setShowQuickAccessEditor(false);
                        setEditingSlot(null);
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors text-sm sm:text-base font-medium"
                  >
                    Clear Address
                  </button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </PageLayout>
  );
}
