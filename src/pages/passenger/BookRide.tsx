import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Home, Briefcase, ShoppingBag, Ship, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getMapProvider } from '@/lib/mapProvider';
import type { Coordinates, PlaceResult } from '@/lib/mapProvider';
import { fareSettingsService } from '@/services/fareSettings';
import { ridesService } from '@/services/rides';
import { toast } from '@/hooks/use-toast';
import { ThemedCard } from '@/components/ui/ThemedCard';
import carIcon from '@/assets/car-icon.png';
import courierIcon from '@/assets/courier-icon.png';
import motorcycleIcon from '@/assets/motorcycle-icon.png';
import tricycleIcon from '@/assets/tricycle-icon.png';

type RecentSearch = {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  timestamp: number;
};

type QuickAccessSlot = {
  name: string;
  address: string;
  coords: Coordinates;
};

type QuickAccessSlots = {
  home: QuickAccessSlot | null;
  office: QuickAccessSlot | null;
  market: QuickAccessSlot | null;
  terminal: QuickAccessSlot | null;
};

type ServiceType = 'car' | 'tricycle' | 'motor' | 'delivery';

interface FareSetting {
  id: string;
  service_type: string;
  display_name: string;
  base_fare: number;
  is_active: boolean;
}

const mapProvider = getMapProvider();

export default function BookRide() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Location state
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [pickupError, setPickupError] = useState<string | null>(null);

  // Destination state
  const [destinationQuery, setDestinationQuery] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Booking state
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [selectedBaseFare, setSelectedBaseFare] = useState<number | null>(null);
  const [fareSettings, setFareSettings] = useState<FareSetting[]>([]);
  const [appFee, setAppFee] = useState(5);

  // UI state
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [quickAccess, setQuickAccess] = useState<QuickAccessSlots>({
    home: null,
    office: null,
    market: null,
    terminal: null,
  });
  const [editingQuickAccess, setEditingQuickAccess] = useState<keyof QuickAccessSlots | null>(null);
  const [quickAccessQuery, setQuickAccessQuery] = useState('');
  const [quickAccessSuggestions, setQuickAccessSuggestions] = useState<PlaceResult[]>([]);
  const [isCreatingRide, setIsCreatingRide] = useState(false);

  // Redirect if not logged in or not a passenger
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.role === 'driver') {
      navigate('/driver/dashboard');
      return;
    }
    if (profile?.role === 'courier') {
      navigate('/courier/dashboard');
      return;
    }
    if (profile?.role === 'sender') {
      navigate('/sender/dashboard');
      return;
    }
  }, [user, profile, navigate]);

  // Get GPS location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setPickupError('Device location not supported.');
      toast({
        title: 'GPS not available',
        description: 'Please enable location services',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPickupError(null);
      },
      (err) => {
        console.error('GPS error', err);
        setPickupError('Unable to get your location. Please enable GPS and refresh.');
        toast({
          title: 'Location error',
          description: 'Unable to get your location. Please enable GPS or search manually.',
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      }
    );
  }, []);

  // Reverse geocode pickup location
  useEffect(() => {
    if (!pickupCoords) return;

    setIsAddressLoading(true);
    mapProvider
      .reverseGeocode(pickupCoords)
      .then((addr) => {
        setCurrentAddress(addr);
      })
      .catch((err) => {
        console.error('Reverse geocoding failed:', err);
        setCurrentAddress(
          `Location at ${pickupCoords.lat.toFixed(4)}, ${pickupCoords.lng.toFixed(4)}`
        );
      })
      .finally(() => setIsAddressLoading(false));
  }, [pickupCoords]);

  // Load fare settings and app fee
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [fares, fee] = await Promise.all([
          fareSettingsService.getFareSettings(),
          fareSettingsService.getAppUsageFee(),
        ]);
        setFareSettings(fares);
        setAppFee(fee);
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast({
          title: 'Error loading fares',
          description: 'Using default values',
          variant: 'destructive',
        });
      }
    };
    loadSettings();
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('kx_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Load quick access from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('kx_quick_access');
    if (stored) {
      try {
        setQuickAccess(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse quick access:', e);
      }
    }
  }, []);

  // Debounced destination search
  useEffect(() => {
    if (!destinationQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        const results = await mapProvider.searchPlaces(destinationQuery, {
          proximity: pickupCoords ?? undefined,
        });
        setSuggestions(results);
      } catch (error) {
        console.error('Search failed:', error);
        toast({
          title: 'Search error',
          description: 'Unable to search location, please try again',
          variant: 'destructive',
        });
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [destinationQuery, pickupCoords]);

  // Debounced quick access search
  useEffect(() => {
    if (!quickAccessQuery.trim() || !editingQuickAccess) {
      setQuickAccessSuggestions([]);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        const results = await mapProvider.searchPlaces(quickAccessQuery, {
          proximity: pickupCoords ?? undefined,
        });
        setQuickAccessSuggestions(results);
      } catch (error) {
        console.error('Quick access search failed:', error);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [quickAccessQuery, editingQuickAccess, pickupCoords]);

  const saveRecentSearch = (pickupAddr: string, dropoffAddr: string) => {
    setRecentSearches((prev) => {
      const next: RecentSearch[] = [
        { id: `${Date.now()}`, pickupAddress: pickupAddr, dropoffAddress: dropoffAddr, timestamp: Date.now() },
        ...prev,
      ]
        .filter(
          (s, i, arr) =>
            arr.findIndex(
              (t) =>
                t.pickupAddress === s.pickupAddress &&
                t.dropoffAddress === s.dropoffAddress
            ) === i
        )
        .slice(0, 5);

      localStorage.setItem('kx_recent_searches', JSON.stringify(next));
      return next;
    });
  };

  const handleSuggestionClick = (suggestion: PlaceResult) => {
    setDropoffCoords(suggestion.coords);
    setDropoffAddress(suggestion.fullAddress);
    setDestinationQuery(suggestion.fullAddress);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRecentSearchClick = (search: RecentSearch) => {
    setDropoffAddress(search.dropoffAddress);
    setDestinationQuery(search.dropoffAddress);
  };

  const handleQuickAccessClick = (slot: keyof QuickAccessSlots) => {
    const quickSlot = quickAccess[slot];
    if (!quickSlot) {
      setEditingQuickAccess(slot);
      setQuickAccessQuery('');
      return;
    }
    setDropoffCoords(quickSlot.coords);
    setDropoffAddress(quickSlot.address);
    setDestinationQuery(quickSlot.address);
  };

  const handleQuickAccessSave = (slot: keyof QuickAccessSlots, suggestion: PlaceResult) => {
    setQuickAccess((prev) => {
      const updated = {
        ...prev,
        [slot]: {
          name: suggestion.name,
          address: suggestion.fullAddress,
          coords: suggestion.coords,
        },
      };
      localStorage.setItem('kx_quick_access', JSON.stringify(updated));
      return updated;
    });
    setEditingQuickAccess(null);
    setQuickAccessQuery('');
    setQuickAccessSuggestions([]);
  };

  const handleServiceSelect = (serviceType: ServiceType, baseFare: number) => {
    setSelectedServiceType(serviceType);
    setSelectedBaseFare(baseFare);
  };

  const handleRequestRide = async () => {
    if (pickupError || !pickupCoords || !currentAddress) {
      toast({
        title: 'Pickup location required',
        description: pickupError || 'Please enable GPS or select a pickup location',
        variant: 'destructive',
      });
      return;
    }

    if (!dropoffCoords || !dropoffAddress) {
      toast({
        title: 'Destination required',
        description: 'Please select where you want to go',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedServiceType || !selectedBaseFare) {
      toast({
        title: 'Service type required',
        description: 'Please select a service',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to book a ride',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingRide(true);
    try {
      const ride = await ridesService.createRide(user.id, {
        pickup_location: currentAddress,
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        dropoff_location: dropoffAddress,
        dropoff_lat: dropoffCoords.lat,
        dropoff_lng: dropoffCoords.lng,
        ride_type: selectedServiceType === 'delivery' ? 'motor' : selectedServiceType,
        base_fare: selectedBaseFare,
        app_fee: appFee,
        fare_estimate: selectedBaseFare,
      });

      saveRecentSearch(currentAddress, dropoffAddress);

      toast({
        title: 'Ride requested!',
        description: 'Searching for available drivers...',
      });

      navigate(`/passenger/my-rides`);
    } catch (error) {
      console.error('Failed to create ride:', error);
      toast({
        title: 'Booking failed',
        description: 'Unable to request ride. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingRide(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getServiceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'car':
        return carIcon;
      case 'motorcycle':
      case 'motor':
        return motorcycleIcon;
      case 'tricycle':
        return tricycleIcon;
      case 'delivery':
        return courierIcon;
      default:
        return motorcycleIcon;
    }
  };

  const getQuickAccessIcon = (slot: keyof QuickAccessSlots) => {
    switch (slot) {
      case 'home':
        return <Home className="w-6 h-6" />;
      case 'office':
        return <Briefcase className="w-6 h-6" />;
      case 'market':
        return <ShoppingBag className="w-6 h-6" />;
      case 'terminal':
        return <Ship className="w-6 h-6" />;
    }
  };

  const canRequestRide = 
    pickupCoords && 
    currentAddress && 
    dropoffCoords && 
    dropoffAddress && 
    selectedServiceType && 
    selectedBaseFare;

  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Greeting + Current Location */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {getGreeting()}, {firstName}!
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {pickupError 
              ? pickupError
              : isAddressLoading 
              ? 'Locating your address…' 
              : currentAddress || 'Getting location...'}
          </span>
        </div>
      </div>

      {/* Destination Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={destinationQuery}
              onChange={(e) => {
                setDestinationQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Where are you heading?"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0"
                >
                  <div className="font-medium text-foreground">{suggestion.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{suggestion.fullAddress}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Searches */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">Recent Searches</h2>
        {recentSearches.length === 0 ? (
          <ThemedCard className="bg-accent/30">
            <p className="text-sm text-muted-foreground text-center py-2">
              No recent searches yet. Start a booking and we'll show your last routes here.
            </p>
          </ThemedCard>
        ) : (
          <ThemedCard
            onClick={() => handleRecentSearchClick(recentSearches[0])}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {recentSearches[0].dropoffAddress}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  From {recentSearches[0].pickupAddress}
                </div>
              </div>
            </div>
          </ThemedCard>
        )}
      </div>

      {/* Quick Access */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Access</h2>
        <div className="grid grid-cols-4 gap-3">
          {(['home', 'office', 'market', 'terminal'] as const).map((slot) => (
            <button
              key={slot}
              onClick={() => handleQuickAccessClick(slot)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:bg-accent transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {getQuickAccessIcon(slot)}
              </div>
              <span className="text-xs font-medium text-foreground capitalize">
                {quickAccess[slot] ? slot : `Set ${slot}`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* All Kanggaxpress Services */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">All Kanggaxpress Services</h2>
        <div className="grid grid-cols-2 gap-3">
          {fareSettings.map((fare) => {
            const serviceType = fare.service_type.toLowerCase() as ServiceType;
            const isSelected = selectedServiceType === serviceType;
            
            return (
              <ThemedCard
                key={fare.id}
                onClick={() => handleServiceSelect(serviceType, fare.base_fare)}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                    <img
                      src={getServiceIcon(fare.service_type)}
                      alt={fare.display_name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{fare.display_name}</div>
                    <div className="text-sm font-medium text-primary">₱{fare.base_fare}</div>
                  </div>
                </div>
              </ThemedCard>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      {canRequestRide && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <div className="mb-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup:</span>
                <span className="font-medium text-foreground truncate ml-2 max-w-[200px]">
                  {currentAddress}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Drop-off:</span>
                <span className="font-medium text-foreground truncate ml-2 max-w-[200px]">
                  {dropoffAddress}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium text-foreground">
                  {fareSettings.find(f => f.service_type.toLowerCase() === selectedServiceType)?.display_name}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-1 border-t border-border">
                <span className="text-foreground">Base Fare:</span>
                <span className="text-primary">₱{selectedBaseFare}</span>
              </div>
            </div>
            <button
              onClick={handleRequestRide}
              disabled={isCreatingRide}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isCreatingRide ? 'Requesting...' : 'Request Ride'}
            </button>
          </div>
        </div>
      )}

      {/* Quick Access Editor Modal */}
      {editingQuickAccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-foreground mb-4 capitalize">
              Set {editingQuickAccess} Address
            </h3>
            <div className="relative mb-4">
              <input
                type="text"
                value={quickAccessQuery}
                onChange={(e) => setQuickAccessQuery(e.target.value)}
                placeholder="Search for address..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              {quickAccessSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {quickAccessSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleQuickAccessSave(editingQuickAccess, suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="font-medium text-foreground">{suggestion.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{suggestion.fullAddress}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setEditingQuickAccess(null);
                setQuickAccessQuery('');
                setQuickAccessSuggestions([]);
              }}
              className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-xl font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
