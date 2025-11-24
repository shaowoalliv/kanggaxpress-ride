import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ServiceType, FeeType, estimateFare } from '@/lib/fareEstimator';
import { Loader2 } from 'lucide-react';

interface FareConfigForm {
  base_fare: number;
  per_km: number;
  per_min: number;
  min_fare: number;
  platform_fee_type: FeeType;
  platform_fee_value: number;
}

export default function Pricing() {
  const { toast } = useToast();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [activeService, setActiveService] = useState<ServiceType>('TRICYCLE');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Preview inputs
  const [previewDistance, setPreviewDistance] = useState(5);
  const [previewTime, setPreviewTime] = useState(15);

  // Form state per service type
  const [configs, setConfigs] = useState<Record<ServiceType, FareConfigForm>>({
    TRICYCLE: { base_fare: 20, per_km: 8, per_min: 0, min_fare: 40, platform_fee_type: 'FLAT', platform_fee_value: 5 },
    MOTORCYCLE: { base_fare: 25, per_km: 10, per_min: 0, min_fare: 50, platform_fee_type: 'FLAT', platform_fee_value: 5 },
    CAR: { base_fare: 40, per_km: 15, per_min: 2, min_fare: 80, platform_fee_type: 'PCT', platform_fee_value: 10 },
    SEND_PACKAGE: { base_fare: 30, per_km: 12, per_min: 0, min_fare: 60, platform_fee_type: 'FLAT', platform_fee_value: 8 },
  });

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      loadCities(selectedProvince);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCity) {
      loadFareConfigs();
    }
  }, [selectedCity]);

  const loadProvinces = async () => {
    try {
      const { data, error } = await supabase
        .from('provinces')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProvinces(data || []);
      if (data && data.length > 0) {
        setSelectedProvince(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load provinces',
        variant: 'destructive',
      });
    }
  };

  const loadCities = async (provinceId: string) => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('province_id', provinceId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCities(data || []);
      if (data && data.length > 0) {
        setSelectedCity(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load cities',
        variant: 'destructive',
      });
    }
  };

  const loadFareConfigs = async () => {
    if (!selectedCity) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fare_configs')
        .select('*')
        .eq('city_id', selectedCity);

      if (error) throw error;

      if (data && data.length > 0) {
        const newConfigs: Record<ServiceType, FareConfigForm> = { ...configs };
        data.forEach((item) => {
          newConfigs[item.service_type as ServiceType] = {
            base_fare: Number(item.base_fare),
            per_km: Number(item.per_km),
            per_min: Number(item.per_min),
            min_fare: Number(item.min_fare),
            platform_fee_type: item.platform_fee_type as FeeType,
            platform_fee_value: Number(item.platform_fee_value),
          };
        });
        setConfigs(newConfigs);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load fare configs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCity) {
      toast({
        title: 'Error',
        description: 'Please select a city',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const currentConfig = configs[activeService];
      
      const { error } = await supabase
        .from('fare_configs')
        .upsert({
          city_id: selectedCity,
          service_type: activeService,
          base_fare: currentConfig.base_fare,
          per_km: currentConfig.per_km,
          per_min: currentConfig.per_min,
          min_fare: currentConfig.min_fare,
          platform_fee_type: currentConfig.platform_fee_type,
          platform_fee_value: currentConfig.platform_fee_value,
        }, {
          onConflict: 'city_id,service_type'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Pricing for ${activeService} updated successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save pricing',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof FareConfigForm, value: any) => {
    setConfigs({
      ...configs,
      [activeService]: {
        ...configs[activeService],
        [field]: value,
      },
    });
  };

  const currentConfig = configs[activeService];
  const estimate = estimateFare(currentConfig, previewDistance, previewTime);

  return (
    <>
      <Helmet>
        <title>Pricing - Admin - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold font-heading">Pricing Management</h2>
          <p className="text-muted-foreground">Configure fare rates and platform fees</p>
        </div>

        {/* Area Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Service Area</CardTitle>
            <CardDescription>Select province and city to configure pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Province</Label>
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Config Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Service Configuration</CardTitle>
                  <CardDescription>Set base fares, per-kilometer rates, and platform fees</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeService} onValueChange={(v) => setActiveService(v as ServiceType)}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="TRICYCLE">Tricycle</TabsTrigger>
                      <TabsTrigger value="MOTORCYCLE">Motorcycle</TabsTrigger>
                      <TabsTrigger value="CAR">Car</TabsTrigger>
                      <TabsTrigger value="SEND_PACKAGE">Package</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeService} className="space-y-4 mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Base Fare (PHP)</Label>
                          <Input
                            type="number"
                            value={currentConfig.base_fare}
                            onChange={(e) => updateConfig('base_fare', Number(e.target.value))}
                            min={0}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Per-KM Rate (PHP/km)</Label>
                          <Input
                            type="number"
                            value={currentConfig.per_km}
                            onChange={(e) => updateConfig('per_km', Number(e.target.value))}
                            min={0}
                            step={0.5}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Per-Minute Rate (PHP/min)</Label>
                          <Input
                            type="number"
                            value={currentConfig.per_min}
                            onChange={(e) => updateConfig('per_min', Number(e.target.value))}
                            min={0}
                            step={0.5}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Minimum Fare (PHP)</Label>
                          <Input
                            type="number"
                            value={currentConfig.min_fare}
                            onChange={(e) => updateConfig('min_fare', Number(e.target.value))}
                            min={0}
                            step={1}
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-4">
                        <h4 className="font-semibold">Application Use Rate</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Fee Type</Label>
                            <Select 
                              value={currentConfig.platform_fee_type} 
                              onValueChange={(v) => updateConfig('platform_fee_type', v as FeeType)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FLAT">Flat Amount (₱)</SelectItem>
                                <SelectItem value="PCT">Percentage (%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>
                              Value ({currentConfig.platform_fee_type === 'FLAT' ? '₱' : '%'})
                            </Label>
                            <Input
                              type="number"
                              value={currentConfig.platform_fee_value}
                              onChange={(e) => updateConfig('platform_fee_value', Number(e.target.value))}
                              min={0}
                              step={currentConfig.platform_fee_type === 'PCT' ? 1 : 0.5}
                            />
                          </div>
                        </div>
                      </div>

                      <Button onClick={handleSave} disabled={saving} className="w-full">
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Configuration'
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Right: Live Preview */}
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Fare Preview</CardTitle>
                  <CardDescription>See how the fare calculates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Distance (km)</Label>
                    <Input
                      type="number"
                      value={previewDistance}
                      onChange={(e) => setPreviewDistance(Number(e.target.value))}
                      min={0}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Time (minutes)</Label>
                    <Input
                      type="number"
                      value={previewTime}
                      onChange={(e) => setPreviewTime(Number(e.target.value))}
                      min={0}
                      step={1}
                    />
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Fare:</span>
                      <span className="font-semibold">₱{estimate.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee:</span>
                      <span className="text-destructive">-₱{estimate.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Driver Take:</span>
                      <span className="text-lg font-bold text-primary">₱{estimate.driverTake.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
