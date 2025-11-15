import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { couriersService } from '@/services/couriers';
import { RideType } from '@/types';
import { toast } from 'sonner';

export default function CourierSetup() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [vehicleType, setVehicleType] = useState<RideType>('motor');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || profile?.role !== 'courier') {
      navigate('/');
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setLoading(true);
      await couriersService.createCourierProfile(profile.id, {
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate.trim(),
        vehicle_model: vehicleModel.trim() || undefined,
        vehicle_color: vehicleColor.trim() || undefined,
        license_number: licenseNumber.trim() || undefined,
      });
      toast.success('Courier profile created!');
      navigate('/courier/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create courier profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="flex-1 px-4 py-6 max-w-md mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-heading font-bold">Complete Your Courier Profile</h1>
            <p className="text-muted-foreground mt-2">Add your vehicle details to start delivering</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <ThemedCard>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <RadioGroup value={vehicleType} onValueChange={(v) => setVehicleType(v as RideType)}>
                    {(['motor', 'tricycle', 'car'] as RideType[]).map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={type} />
                        <Label htmlFor={type} className="capitalize cursor-pointer">{type}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plate">Plate Number *</Label>
                  <Input
                    id="plate"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    required
                    placeholder="ABC-1234"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Vehicle Model</Label>
                  <Input
                    id="model"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Honda Wave 110"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Vehicle Color</Label>
                  <Input
                    id="color"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    placeholder="Red"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license">Driver's License Number</Label>
                  <Input
                    id="license"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="N01-12-345678"
                  />
                </div>
              </div>
            </ThemedCard>

            <PrimaryButton type="submit" isLoading={loading}>
              Complete Setup
            </PrimaryButton>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
