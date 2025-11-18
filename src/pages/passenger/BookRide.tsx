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
import { fareSettingsService } from '@/services/fareSettings';
import { toast } from 'sonner';
import { MapPin, Bell, Home, Briefcase, ShoppingBag, Building2, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getMapProvider, Coordinates, PlaceResult } from '@/lib/mapProvider';
import { MapSearchInput } from '@/components/MapSearchInput';
import motorIcon from '@/assets/motorcycle-icon.png';
import tricycleIcon from '@/assets/tricycle-icon.png';
import carIcon from '@/assets/car-icon.png';
import courierIcon from '@/assets/courier-icon.png';

const getServiceIcon = (type: string) => {
  if (type === 'MOTOR') return motorIcon;
  if (type === 'TRICYCLE') return tricycleIcon;
  if (type === 'CAR') return carIcon;
  if (type === 'DELIVERY') return courierIcon;
  return motorIcon;
};

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
  const [currentLocationCoords, setCurrentLocationCoords] = useState<Coordinates | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [quickAccess, setQuickAccess] = useState<Record<QuickAccessSlotKey, QuickAccessSlot>>({
    home: { label: "Home" },
    office: { label: "Office" },
    market: { label: "Market" },
    terminal: { label: "Terminal" },
  });
  const [editingSlot, setEditingSlot] = useState<QuickAccessSlotKey | null>(null);
  const [showQuickAccessEditor, setShowQuickAccessEditor] = useState(false);
  const [fareSettings, setFareSettings] = useState<any[]>([]);
  const [appFee, setAppFee] = useState(5);

  useEffect(() => {
    const loadFareSettings = async () => {
      try {
        const [fares, fee] = await Promise.all([
          fareSettingsService.getFareSettings(),
          fareSettingsService.getAppUsageFee(),
        ]);
        setFareSettings(fares);
        setAppFee(fee);
      } catch (error) {
        console.error('Error loading fare settings:', error);
      }
    };
    loadFareSettings();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocationCoords(coords);
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

    try {
      const raw = localStorage.getItem('kx_recent_searches');
      if (raw) {
        const parsed = JSON.parse(raw) as RecentSearch[];
        setRecentSearches(parsed);
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }

    const fetchRecentRides = async () => {
      if (!user) return;
      try {
        const rides = await ridesService.getPassengerRides(user.id);
        setRecentRides(rides.slice(0, 5));
      } catch (error) {
        console.error('Error fetching recent rides:', error);
      }
    };

    fetchRecentRides();
  }, [user]);

  useEffect(() => {
    if (!currentLocationCoords) return;

    setIsAddressLoading(true);
    const mapProvider = getMapProvider();
    mapProvider
      .reverseGeocode(currentLocationCoords)
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
  }, [user, profile, navigate]);

  const selectedFare = selectedType ? fareSettings.find(f => f.service_type === selectedType) : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = profile?.full_name?.split(' ')[0] || 'Kanggaxpress Rider';

  const handleServiceSelect = (type: string) => {
    setSelectedType(type);
    setShowBookingSheet(true);
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
        .filter(
          (s, index, arr) =>
            arr.findIndex(
              t =>
                t.pickupAddress === s.pickupAddress &&
                t.dropoffAddress === s.dropoffAddress
            ) === index
        )
        .slice(0, 5);

      localStorage.setItem('kx_recent_searches', JSON.stringify(next));
      return next;
    });
  };

  const saveQuickAccessSlot = (key: QuickAccessSlotKey, address: string, lat: number, lng: number) => {
    const updated = { ...quickAccess[key], address, lat, lng };
    setQuickAccess(prev => ({ ...prev, [key]: updated }));
    localStorage.setItem(`kx_quick_access_${key}`, JSON.stringify(updated));
  };

  const clearQuickAccessSlot = (key: QuickAccessSlotKey) => {
    const cleared = { label: quickAccess[key].label };
    setQuickAccess(prev => ({ ...prev, [key]: cleared }));
    localStorage.removeItem(`kx_quick_access_${key}`);
  };

  const handleQuickAccessTap = (key: QuickAccessSlotKey) => {
    const slot = quickAccess[key];
    if (slot.address) {
      setDropoff(slot.address);
      if (slot.lat && slot.lng) {
        setDropoffCoords({ lat: slot.lat, lng: slot.lng });
      }
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

    if (!selectedType || !selectedFare) {
      toast.error('Please select a service type');
      return;
    }

    if (!currentLocationCoords || !dropoffCoords) {
      toast.error('Location data is incomplete');
      return;
    }

    try {
      setLoading(true);
      
      saveRecentSearch(pickup.trim(), dropoff.trim());

      let rideType: 'motor' | 'tricycle' | 'car' = 'motor';
      if (selectedType === 'TRICYCLE') rideType = 'tricycle';
      else if (selectedType === 'CAR') rideType = 'car';

      await ridesService.createRide(profile.id, {
        pickup_location: pickup.trim(),
        dropoff_location: dropoff.trim(),
        ride_type: rideType,
        passenger_count: passengerCount,
        notes: notes.trim() || undefined,
        fare_estimate: selectedFare.base_fare,
      });

      toast.success('Ride requested! Looking for a driver...');
      navigate('/passenger/my-rides');
    } catch (error) {
      console.error('Error booking ride:', error);
      toast.error('Failed to book ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {getGreeting()}, {displayName}! 👋
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4 text-[hsl(30,40%,45%)]" />
              <p className="text-sm text-muted-foreground">
                {isAddressLoading ? 'Locating...' : currentLocation}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/passenger/my-rides')}
            className="p-2 rounded-full hover:bg-accent transition-colors relative"
          >
            <Bell className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <ThemedCard className="p-4">
          <MapSearchInput
            value={dropoff}
            onChange={setDropoff}
            onSelectPlace={(place) => {
              setDropoff(place.fullAddress);
              setDropoffCoords(place.coords);
              if (currentAddress) {
                saveRecentSearch(currentAddress, place.fullAddress);
              }
            }}
            placeholder="Where are you heading?"
            proximity={currentLocationCoords || undefined}
            className="w-full"
          />
        </ThemedCard>

        {recentSearches.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Search</h3>
            <button
              onClick={() => {
                setPickup(recentSearches[0].pickupAddress);
                setDropoff(recentSearches[0].dropoffAddress);
                setShowBookingSheet(true);
              }}
              className="w-full bg-card hover:bg-accent p-4 rounded-lg transition-colors border border-border text-left"
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-[hsl(30,40%,45%)]" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {recentSearches[0].dropoffAddress}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    From {recentSearches[0].pickupAddress}
                  </div>
                </div>
              </div>
            </button>
          </section>
        )}

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Access</h3>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            <TooltipProvider>
              {(["home", "office", "market", "terminal"] as QuickAccessSlotKey[]).map((key) => {
                const slot = quickAccess[key];
                const icons = { home: Home, office: Briefcase, market: ShoppingBag, terminal: Building2 };
                const Icon = icons[key];
                const isConfigured = !!slot.address;
                
                const button = (
                  <div key={key} className="relative flex flex-col items-center gap-2 group min-w-[70px] sm:min-w-[80px]">
                    <button
                      onClick={() => handleQuickAccessTap(key)}
                      className={cn(
                        "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all",
                        isConfigured 
                          ? "bg-[hsl(30,40%,45%)] border-2 border-[hsl(30,40%,45%)]" 
                          : "bg-[hsl(30,40%,90%)] border-2 border-[hsl(30,40%,70%)]"
                      )}
                    >
                      <Icon className={cn(
                        "w-6 h-6 sm:w-7 sm:h-7",
                        isConfigured ? "text-white" : "text-[hsl(30,40%,40%)]"
                      )} />
                    </button>
                    <span className={cn(
                      "text-xs sm:text-sm font-bold text-center",
                      isConfigured ? "text-foreground" : "text-[hsl(30,40%,40%)]"
                    )}>
                      {slot.label}
                    </span>
                  </div>
                );

                if (!isConfigured) {
                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        {button}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tap to set your {slot.label} address</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return button;
              })}
            </TooltipProvider>
          </div>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">All Kanggaxpress Services</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {fareSettings.map((fare) => (
              <button
                key={fare.id}
                onClick={() => handleServiceSelect(fare.service_type)}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all hover:shadow-md",
                  selectedType === fare.service_type
                    ? "border-[hsl(30,40%,45%)] bg-[hsl(30,40%,95%)]"
                    : "border-border bg-card hover:border-[hsl(30,40%,60%)]"
                )}
              >
                <img
                  src={getServiceIcon(fare.service_type)}
                  alt={fare.display_name}
                  className="w-12 h-12 mx-auto mb-2"
                />
                <h4 className="font-semibold text-sm">{fare.display_name}</h4>
                <p className="text-[hsl(30,40%,45%)] font-bold text-sm mt-1">
                  ₱{fare.base_fare}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Sheet open={showBookingSheet} onOpenChange={setShowBookingSheet}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Book {selectedFare?.display_name} Ride</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleBookRide} className="space-y-4 mt-6">
            <div>
              <Label>Pickup Location</Label>
              <Input value={pickup} onChange={(e) => setPickup(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Drop-off Location</Label>
              <Input value={dropoff} onChange={(e) => setDropoff(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Passenger Count</Label>
              <Input
                type="number"
                min="1"
                max="4"
                value={passengerCount}
                onChange={(e) => setPassengerCount(parseInt(e.target.value))}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions..."
                className="mt-2"
              />
            </div>
            {selectedFare && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Base Fare:</span>
                  <span className="font-semibold">₱{selectedFare.base_fare}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Driver may add a top-up fare based on distance
                </div>
              </div>
            )}
            <PrimaryButton type="submit" className="w-full" disabled={loading}>
              {loading ? 'Requesting...' : 'Request Ride'}
            </PrimaryButton>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={showQuickAccessEditor} onOpenChange={setShowQuickAccessEditor}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>
              {editingSlot && quickAccess[editingSlot]?.address 
                ? `Edit ${quickAccess[editingSlot].label}`
                : `Set ${editingSlot && quickAccess[editingSlot].label}`}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <MapSearchInput
              value=""
              onChange={() => {}}
              onSelectPlace={(place) => {
                if (editingSlot) {
                  saveQuickAccessSlot(editingSlot, place.fullAddress, place.coords.lat, place.coords.lng);
                  setShowQuickAccessEditor(false);
                  toast.success(`${quickAccess[editingSlot].label} address saved!`);
                }
              }}
              placeholder={`Search for your ${editingSlot && quickAccess[editingSlot].label} address...`}
              proximity={currentLocationCoords || undefined}
            />
            {editingSlot && quickAccess[editingSlot]?.address && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Current address:</p>
                <p className="text-sm font-medium">{quickAccess[editingSlot].address}</p>
                <button
                  onClick={() => {
                    clearQuickAccessSlot(editingSlot);
                    setShowQuickAccessEditor(false);
                    toast.success(`${quickAccess[editingSlot].label} address cleared`);
                  }}
                  className="text-sm text-destructive mt-2 hover:underline"
                >
                  Clear this address
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
}
