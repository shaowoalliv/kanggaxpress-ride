import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { deliveriesService } from '@/services/deliveries';
import { PackageSize } from '@/types';
import { toast } from 'sonner';
import { MapPin, Package, User, Phone, DollarSign } from 'lucide-react';

const packageSizes: { size: PackageSize; name: string; description: string; price: number }[] = [
  { size: 'small', name: 'Small', description: 'Up to 5kg', price: 80 },
  { size: 'medium', name: 'Medium', description: '5-15kg', price: 120 },
  { size: 'large', name: 'Large', description: '15-30kg', price: 180 },
];

export default function CreateDelivery() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // Check if this is a test sender account
  const isTestSender = profile?.email ? ['sender1@test.com'].includes(profile.email) : false;
  
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageSize, setPackageSize] = useState<PackageSize>('small');
  const [codAmount, setCodAmount] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile?.role !== 'sender') {
      navigate('/');
    }
  }, [user, profile, navigate]);

  const selectedOption = packageSizes.find(opt => opt.size === packageSize);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast.error('Please sign in to create a delivery');
      return;
    }

    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      toast.error('Please enter both pickup and drop-off addresses');
      return;
    }

    if (!packageDescription.trim()) {
      toast.error('Please describe your package');
      return;
    }

    if (!receiverName.trim() || !receiverPhone.trim()) {
      toast.error('Please provide receiver details');
      return;
    }

    try {
      setLoading(true);
      await deliveriesService.createDelivery(profile.id, {
        pickup_address: pickupAddress.trim(),
        dropoff_address: dropoffAddress.trim(),
        package_description: packageDescription.trim(),
        package_size: packageSize,
        cod_amount: codAmount ? parseFloat(codAmount) : undefined,
        receiver_name: receiverName.trim(),
        receiver_phone: receiverPhone.trim(),
      });

      toast.success('Delivery request created! Looking for a courier...');
      navigate('/sender/my-deliveries');
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast.error('Failed to create delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile || profile.role !== 'sender') {
    return null;
  }

  return (
    <PageLayout>
      {isTestSender && (
        <div className="bg-blue-500 text-white px-4 py-2 text-center text-sm font-medium">
          🧪 TEST MODE: sender1@test.com
        </div>
      )}
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Create Delivery
            </h1>
            <p className="text-muted-foreground mt-1">
              Send your package with a trusted courier
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Addresses */}
            <ThemedCard>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Pickup Address
                  </Label>
                  <Input
                    id="pickup"
                    placeholder="Enter pickup address"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dropoff" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-destructive" />
                    Drop-off Address
                  </Label>
                  <Input
                    id="dropoff"
                    placeholder="Enter drop-off address"
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              </div>
            </ThemedCard>

            {/* Package Details */}
            <ThemedCard>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Package Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="What are you sending?"
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Package Size</Label>
                  <RadioGroup value={packageSize} onValueChange={(v) => setPackageSize(v as PackageSize)}>
                    {packageSizes.map((option) => (
                      <div
                        key={option.size}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                          packageSize === option.size
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setPackageSize(option.size)}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={option.size} id={option.size} />
                          <div>
                            <Label htmlFor={option.size} className="cursor-pointer font-semibold">
                              {option.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                        <p className="text-primary font-bold">₱{option.price}</p>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cod" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    COD Amount (Optional)
                  </Label>
                  <Input
                    id="cod"
                    type="number"
                    placeholder="0.00"
                    value={codAmount}
                    onChange={(e) => setCodAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cash on delivery - amount to collect from receiver
                  </p>
                </div>
              </div>
            </ThemedCard>

            {/* Receiver Details */}
            <ThemedCard>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receiverName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Receiver Name
                  </Label>
                  <Input
                    id="receiverName"
                    placeholder="Full name of receiver"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiverPhone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Receiver Phone
                  </Label>
                  <Input
                    id="receiverPhone"
                    type="tel"
                    placeholder="+63 912 345 6789"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              </div>
            </ThemedCard>

            {/* Estimate */}
            <ThemedCard className="bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Estimated Fee</span>
                <span className="text-2xl font-bold text-primary">
                  ₱{selectedOption?.price}
                </span>
              </div>
              {codAmount && parseFloat(codAmount) > 0 && (
                <div className="mt-2 pt-2 border-t border-border flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">COD to Collect</span>
                  <span className="font-semibold">₱{parseFloat(codAmount).toFixed(2)}</span>
                </div>
              )}
            </ThemedCard>

            <PrimaryButton type="submit" isLoading={loading}>
              Request Courier
            </PrimaryButton>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
