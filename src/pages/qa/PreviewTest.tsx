import { Helmet } from 'react-helmet';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { devPreview, isDevPreviewActive } from '@/lib/devPreview';
import { getPreviewRole } from '@/hooks/useDevPreviewSession';

export default function PreviewTest() {
  const isActive = isDevPreviewActive();
  const currentRole = getPreviewRole();

  const tests = [
    {
      id: 'host-allowed',
      name: 'Host allowlist check',
      status: devPreview.hostAllowed ? 'pass' : 'fail',
      notes: `Current host: ${window.location.host}`,
    },
    {
      id: 'preview-enabled',
      name: 'Preview mode enabled',
      status: devPreview.enabled ? 'pass' : 'fail',
      notes: `VITE_DEV_PREVIEW_ON=${devPreview.enabled}`,
    },
    {
      id: 'current-role',
      name: 'Current preview role',
      status: currentRole ? 'pass' : 'unknown',
      notes: currentRole ? `Viewing as: ${currentRole}` : 'No role set',
    },
    {
      id: 'non-admin-bypass',
      name: 'Non-admin route bypass',
      status: isActive ? 'pass' : 'fail',
      notes: isActive ? 'Can bypass on non-admin routes' : 'Bypass not active',
    },
    {
      id: 'admin-protected',
      name: 'Admin routes protected',
      status: devPreview.blockAdmin ? 'pass' : 'fail',
      notes: devPreview.blockAdmin ? 'Admin requires real auth' : 'Admin NOT protected',
    },
  ];

  const passCount = tests.filter(t => t.status === 'pass').length;
  const failCount = tests.filter(t => t.status === 'fail').length;
  const unknownCount = tests.filter(t => t.status === 'unknown').length;

  return (
    <>
      <Helmet>
        <title>Preview Test - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">
                Dev Preview Test Results
              </h1>
              <p className="text-muted-foreground">
                Validation for development preview mode
              </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-600 dark:text-green-400">PASS</span>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {passCount}
                </div>
              </Card>

              <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="font-semibold text-red-600 dark:text-red-400">FAIL</span>
                </div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {failCount}
                </div>
              </Card>

              <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-amber-600 dark:text-amber-400">UNKNOWN</span>
                </div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {unknownCount}
                </div>
              </Card>
            </div>

            {/* Test Results */}
            <Card className="p-6">
              <div className="space-y-4">
                {tests.map(test => (
                  <div
                    key={test.id}
                    className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="mt-0.5">
                      {test.status === 'pass' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {test.status === 'fail' && <XCircle className="w-5 h-5 text-red-500" />}
                      {test.status === 'unknown' && <AlertCircle className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{test.name}</h3>
                        <Badge
                          variant={
                            test.status === 'pass'
                              ? 'default'
                              : test.status === 'fail'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {test.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{test.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => window.location.href = '/qa/dev-preview'}>
                  Open Role Switcher
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/passenger/book-ride'}>
                  Test Passenger Route
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/driver/dashboard'}>
                  Test Driver Route
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/admin'}>
                  Test Admin (Should Block)
                </Button>
              </div>
            </Card>

            {/* Configuration */}
            <Card className="p-6 space-y-3">
              <h2 className="text-xl font-semibold mb-3">Configuration</h2>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VITE_DEV_PREVIEW_ON:</span>
                  <span>{String(devPreview.enabled)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VITE_DEV_PREVIEW_BLOCK_ADMIN:</span>
                  <span>{String(devPreview.blockAdmin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VITE_DEV_PREVIEW_ALLOW_ROLES:</span>
                  <span>{devPreview.allowRoles.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VITE_DEV_PREVIEW_BADGE:</span>
                  <span>{devPreview.badge}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
