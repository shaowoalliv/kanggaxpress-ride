import { Helmet } from 'react-helmet';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, User, Car, Package, Shield } from 'lucide-react';
import { devPreview, isDevPreviewActive } from '@/lib/devPreview';
import { setPreviewRole, getPreviewRole } from '@/hooks/useDevPreviewSession';

export default function DevPreview() {
  const currentRole = getPreviewRole();
  const isActive = isDevPreviewActive();

  const handleSetRole = (role: 'passenger' | 'driver' | 'courier') => {
    setPreviewRole(role);
  };

  const handleClear = () => {
    setPreviewRole(null);
  };

  return (
    <>
      <Helmet>
        <title>Dev Preview Mode - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">
                Dev Preview Mode
              </h1>
              <p className="text-muted-foreground">
                Browse the app without authentication (development only)
              </p>
            </div>

            {/* Status Card */}
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Current Status</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Preview Enabled</span>
                  {devPreview.enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Host Allowed</span>
                  {devPreview.hostAllowed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Admin Blocked</span>
                  {devPreview.blockAdmin ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active</span>
                  {isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Host:</span>
                    <span className="font-mono">{window.location.host}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allowed Roles:</span>
                    <span className="font-mono">{devPreview.allowRoles.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Preview:</span>
                    {currentRole ? (
                      <Badge variant="secondary">{currentRole}</Badge>
                    ) : (
                      <Badge variant="outline">None</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Role Switcher */}
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Role Switcher</h2>
              
              {!isActive && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-4 text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Preview mode is not active
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    Ensure VITE_DEV_PREVIEW_ON=true and host is in allowlist
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={currentRole === 'passenger' ? 'default' : 'outline'}
                  onClick={() => handleSetRole('passenger')}
                  disabled={!isActive}
                  className="h-auto py-4 flex flex-col gap-2"
                >
                  <User className="w-6 h-6" />
                  <span>Passenger</span>
                </Button>

                <Button
                  variant={currentRole === 'driver' ? 'default' : 'outline'}
                  onClick={() => handleSetRole('driver')}
                  disabled={!isActive}
                  className="h-auto py-4 flex flex-col gap-2"
                >
                  <Car className="w-6 h-6" />
                  <span>Driver</span>
                </Button>

                <Button
                  variant={currentRole === 'courier' ? 'default' : 'outline'}
                  onClick={() => handleSetRole('courier')}
                  disabled={!isActive}
                  className="h-auto py-4 flex flex-col gap-2"
                >
                  <Package className="w-6 h-6" />
                  <span>Courier</span>
                </Button>
              </div>

              {currentRole && (
                <Button
                  variant="destructive"
                  onClick={handleClear}
                  className="w-full"
                >
                  Clear Preview Mode
                </Button>
              )}
            </Card>

            {/* Security Notice */}
            <Card className="p-6 space-y-4 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Security & Limitations
                  </h3>
                  <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                    <li>• Preview mode ONLY works on development/preview hosts</li>
                    <li>• Admin routes (/admin*) always require real authentication</li>
                    <li>• No real Supabase session is created (UI-only simulation)</li>
                    <li>• Data mutations should be blocked or show warnings</li>
                    <li>• NEVER enable in production (set VITE_DEV_PREVIEW_ON=false)</li>
                    <li>• Keyboard shortcut: Ctrl/Cmd + Alt + D to open this page</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Quick Navigation */}
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Test Navigation</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => window.location.href = '/passenger/book-ride'}>
                  Passenger: Book Ride
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/driver/dashboard'}>
                  Driver: Dashboard
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/courier/dashboard'}>
                  Courier: Dashboard
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/admin'}>
                  Admin (Should Block)
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
