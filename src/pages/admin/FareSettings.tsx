import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { toast } from 'sonner';
import { fareSettingsService, FareSetting, PlatformSetting } from '@/services/fareSettings';
import { Loader2 } from 'lucide-react';

export default function FareSettings() {
  const [fareSettings, setFareSettings] = useState<FareSetting[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [fares, platform] = await Promise.all([
        fareSettingsService.getFareSettings(),
        fareSettingsService.getPlatformSettings(),
      ]);
      setFareSettings(fares);
      setPlatformSettings(platform);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load fare settings');
    } finally {
      setLoading(false);
    }
  };

  const handleFareChange = (id: string, field: keyof FareSetting, value: any) => {
    setFareSettings((prev) =>
      prev.map((fare) =>
        fare.id === id ? { ...fare, [field]: value } : fare
      )
    );
  };

  const handlePlatformChange = (key: string, value: number) => {
    setPlatformSettings((prev) =>
      prev.map((setting) =>
        setting.setting_key === key
          ? { ...setting, setting_value: value }
          : setting
      )
    );
  };

  const saveFareSettings = async () => {
    try {
      setSaving(true);
      
      // Update all fare settings
      await Promise.all(
        fareSettings.map((fare) =>
          fareSettingsService.updateFareSetting(fare.id, {
            base_fare: fare.base_fare,
            is_active: fare.is_active,
          })
        )
      );

      // Update platform settings
      await Promise.all(
        platformSettings.map((setting) =>
          fareSettingsService.updatePlatformSetting(
            setting.setting_key,
            setting.setting_value
          )
        )
      );

      toast.success('Fare settings updated successfully');
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save fare settings');
    } finally {
      setSaving(false);
    }
  };

  const appFee = platformSettings.find((s) => s.setting_key === 'app_usage_fee');

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Fare Settings</h1>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(30,40%,45%)]" />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Fare Settings</h1>
        <div className="space-y-6 max-w-4xl">
        {/* Platform Fee Card */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Platform Settings</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="app_fee">
                KanggaXpress App Usage Fee (per completed ride)
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg">₱</span>
                <Input
                  id="app_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={appFee?.setting_value || 5}
                  onChange={(e) =>
                    handlePlatformChange('app_usage_fee', parseFloat(e.target.value))
                  }
                  className="max-w-[200px]"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                This fee is deducted from the driver/courier for each completed ride
              </p>
            </div>
          </div>
        </Card>

        {/* Fare Settings Table */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Service Base Fares</h2>
          <div className="space-y-4">
            {fareSettings.map((fare) => (
              <div
                key={fare.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{fare.display_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {fare.service_type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`fare-${fare.id}`}>Base Fare</Label>
                  <span className="text-lg">₱</span>
                  <Input
                    id={`fare-${fare.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={fare.base_fare}
                    onChange={(e) =>
                      handleFareChange(
                        fare.id,
                        'base_fare',
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-24"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`active-${fare.id}`}>Active</Label>
                  <Switch
                    id={`active-${fare.id}`}
                    checked={fare.is_active}
                    onCheckedChange={(checked) =>
                      handleFareChange(fare.id, 'is_active', checked)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <PrimaryButton onClick={saveFareSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </PrimaryButton>
        </div>
      </div>
      </div>
    </PageLayout>
  );
}
