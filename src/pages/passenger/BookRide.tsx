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
import { MapPin, User, Bike, Car as CarIcon } from 'lucide-react';

const rideOptions: { type: RideType; name: string; icon: any; price: number; description: string }[] = [
  { type: 'motor', name: 'Motor', icon: Bike, price: 50, description: 'Fast & affordable' },
  { type: 'tricycle', name: 'Tricycle', icon: CarIcon, price: 80, description: 'Comfortable for groups' },
  { type: 'car', name: 'Car', icon: CarIcon, price: 120, description: 'Premium comfort' },
];

export default function BookRide() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedType, setSelectedType] = useState<RideType>('motor');
  const [passengerCount, setPassengerCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

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

  const selectedOption = rideOptions.find(opt => opt.type === selectedType);

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
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Book a Ride
            </h1>
            <p className="text-muted-foreground mt-1">
              Where would you like to go?
            </p>
          </div>

          <form onSubmit={handleBookRide} className="space-y-6">
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
                    className="h-12"
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
                    className="h-12"
                  />
                </div>
              </div>
            </ThemedCard>

            {/* Ride Type Selection */}
            <div className="space-y-3">
              <Label>Choose Ride Type</Label>
              <div className="grid grid-cols-3 gap-3">
                {rideOptions.map((option) => (
                  <ThemedCard
                    key={option.type}
                    onClick={() => setSelectedType(option.type)}
                    className={`text-center cursor-pointer transition-all ${
                      selectedType === option.type
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <option.icon className="w-8 h-8 mx-auto mb-2 text-secondary" />
                    <p className="font-semibold text-sm">{option.name}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                    <p className="text-primary font-bold mt-2">₱{option.price}</p>
                  </ThemedCard>
                ))}
              </div>
            </div>

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
                    className="h-12"
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
                  />
                </div>
              </div>
            </ThemedCard>

            {/* Estimate */}
            <ThemedCard className="bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Estimated Fare</span>
                <span className="text-2xl font-bold text-primary">
                  ₱{selectedOption?.price}
                </span>
              </div>
            </ThemedCard>

            <PrimaryButton type="submit" isLoading={loading}>
              Request Ride
            </PrimaryButton>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
