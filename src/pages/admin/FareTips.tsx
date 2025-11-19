import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { toast } from 'sonner';
import { DollarSign, Save } from 'lucide-react';

interface TipSettings {
  tip_option_1: number;
  tip_option_2: number;
  tip_option_3: number;
  enable_fare_tips: number;
}

export default function AdminFareTips() {
  const [settings, setSettings] = useState<TipSettings>({
    tip_option_1: 20,
    tip_option_2: 50,
    tip_option_3: 100,
    enable_fare_tips: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['tip_option_1', 'tip_option_2', 'tip_option_3', 'enable_fare_tips']);

      if (error) throw error;

      if (data) {
        const settingsObj: any = {};
        data.forEach((item) => {
          settingsObj[item.setting_key] = item.setting_value;
        });
        setSettings({
          tip_option_1: settingsObj.tip_option_1 || 20,
          tip_option_2: settingsObj.tip_option_2 || 50,
          tip_option_3: settingsObj.tip_option_3 || 100,
          enable_fare_tips: settingsObj.enable_fare_tips ?? 1,
        });
      }
    } catch (error: any) {
      toast.error('Failed to load settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update each setting
      const updates = [
        { key: 'tip_option_1', value: settings.tip_option_1 },
        { key: 'tip_option_2', value: settings.tip_option_2 },
        { key: 'tip_option_3', value: settings.tip_option_3 },
        { key: 'enable_fare_tips', value: settings.enable_fare_tips },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key);

        if (error) throw error;
      }

      toast.success('Tip settings saved successfully');
    } catch (error: any) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Fare Tips Settings - Admin - KanggaXpress</title>
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <div className="p-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Fare Tips Settings - Admin - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold font-heading mb-2 flex items-center gap-2">
            <DollarSign className="w-8 h-8" />
            Fare Tips/Bonus Settings
          </h2>
          <p className="text-muted-foreground">
            Configure the quick-select bonus fare amounts that passengers can add on top of the base fare
          </p>
        </div>

        <ThemedCard className="p-6">
          <div className="space-y-6">
            {/* Enable/Disable Tips */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <Label className="text-base font-semibold">Enable Fare Tips</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Allow passengers to add bonus fare to their rides
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enable_fare_tips: settings.enable_fare_tips ? 0 : 1 })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enable_fare_tips ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enable_fare_tips ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Quick Select Options */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Quick Select Amounts</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tip1" className="text-sm">Option 1</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                    <Input
                      id="tip1"
                      type="number"
                      value={settings.tip_option_1}
                      onChange={(e) => setSettings({ ...settings, tip_option_1: Number(e.target.value) })}
                      className="pl-7"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tip2" className="text-sm">Option 2</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                    <Input
                      id="tip2"
                      type="number"
                      value={settings.tip_option_2}
                      onChange={(e) => setSettings({ ...settings, tip_option_2: Number(e.target.value) })}
                      className="pl-7"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tip3" className="text-sm">Option 3</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                    <Input
                      id="tip3"
                      type="number"
                      value={settings.tip_option_3}
                      onChange={(e) => setSettings({ ...settings, tip_option_3: Number(e.target.value) })}
                      className="pl-7"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                These amounts will appear as quick-select buttons for passengers to add bonus fare
              </p>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t">
              <Label className="text-base font-semibold mb-3 block">Preview</Label>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Quick select buttons:</p>
                <div className="flex gap-2">
                  <div className="flex-1 py-2 px-3 rounded-lg bg-primary/10 text-primary text-center text-sm font-semibold">
                    +₱{settings.tip_option_1}
                  </div>
                  <div className="flex-1 py-2 px-3 rounded-lg bg-primary/10 text-primary text-center text-sm font-semibold">
                    +₱{settings.tip_option_2}
                  </div>
                  <div className="flex-1 py-2 px-3 rounded-lg bg-primary/10 text-primary text-center text-sm font-semibold">
                    +₱{settings.tip_option_3}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving} size="lg">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </ThemedCard>
      </div>
    </>
  );
}
