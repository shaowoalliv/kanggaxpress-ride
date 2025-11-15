import { Helmet } from 'react-helmet';
import { PageLayout } from '@/components/layout/PageLayout';
import { CheckCircle, XCircle, Map } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

export default function MapsKeys() {
  const provider = import.meta.env.VITE_MAPS_PROVIDER || 'stub';
  const hasGoogleKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [testKey, setTestKey] = useState('');

  const handleTestKey = () => {
    if (!testKey.trim()) {
      toast.error('Please enter a Google Maps API key');
      return;
    }
    
    // Test if key is valid format (starts with AIza)
    if (!testKey.startsWith('AIza')) {
      toast.error('Invalid key format. Google Maps API keys start with "AIza"');
      return;
    }

    toast.success('Key format is valid. Add to .env as VITE_GOOGLE_MAPS_API_KEY');
  };

  return (
    <>
      <Helmet>
        <title>Maps & Keys QA - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">
                Maps Provider & Keys Test
              </h1>
              <p className="text-muted-foreground">
                Test and validate maps configuration
              </p>
            </div>

            {/* Current Status */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Map className="w-5 h-5" />
                Current Configuration
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Maps Provider</span>
                  <span className="text-sm bg-muted px-3 py-1 rounded-md font-mono">
                    {provider}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Google Maps API Key</span>
                  <div className="flex items-center gap-2">
                    {hasGoogleKey ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {hasGoogleKey ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                </div>

                {!hasGoogleKey && provider === 'stub' && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-3 text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                      Using Stub Provider
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Add a Google Maps API key to enable real maps functionality
                    </p>
                  </div>
                )}

                {hasGoogleKey && provider === 'stub' && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md p-3 text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Key Found - Provider Still Stub
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Set VITE_MAPS_PROVIDER=google to enable Google Maps
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Key Tester */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Test API Key</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Google Maps API Key
                  </label>
                  <Input
                    type="password"
                    placeholder="AIza..."
                    value={testKey}
                    onChange={(e) => setTestKey(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                
                <Button onClick={handleTestKey} className="w-full">
                  Validate Key Format
                </Button>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Google Maps API keys start with "AIza"</p>
                  <p>• Add to .env as VITE_GOOGLE_MAPS_API_KEY</p>
                  <p>• Set VITE_MAPS_PROVIDER=google to activate</p>
                </div>
              </div>
            </div>

            {/* Implementation Guide */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Implementation Steps</h2>
              
              <ol className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Get API key from Google Cloud Console</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>Enable Maps JavaScript API, Places API, and Geocoding API</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <span>Add VITE_GOOGLE_MAPS_API_KEY to .env file</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">4.</span>
                  <span>Set VITE_MAPS_PROVIDER=google in .env</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">5.</span>
                  <span>Restart dev server to apply changes</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
