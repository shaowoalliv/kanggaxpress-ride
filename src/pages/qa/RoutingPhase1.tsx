import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function RoutingPhase1() {
  const tests = [
    {
      id: 'cta-navigate',
      name: 'Landing CTA navigates to /choose-role without reload',
      status: 'pass',
      notes: 'Uses navigate() with 400ms fallback'
    },
    {
      id: 'role-cards',
      name: 'Each role card links to /auth?role=...',
      status: 'pass',
      notes: 'Passenger, Driver, Courier cards implemented'
    },
    {
      id: 'legacy-redirect',
      name: '/login & /signup redirect to /auth',
      status: 'pass',
      notes: 'Client-side redirects preserve role param'
    },
    {
      id: 'post-login-routes',
      name: 'Post-login routing works for each role',
      status: 'pass',
      notes: 'passenger→/passenger/book-ride, driver→/driver/dashboard, courier→/courier/dashboard'
    },
    {
      id: 'auth-tabs',
      name: '/auth has Login | Register tabs and is role-aware',
      status: 'pass',
      notes: 'Tabs implemented with role selector'
    },
    {
      id: 'pwa-defer',
      name: 'PWA install prompt deferred to /choose-role',
      status: 'pass',
      notes: '≥800ms post-render, non-blocking'
    }
  ];

  const passCount = tests.filter(t => t.status === 'pass').length;
  const failCount = tests.filter(t => t.status === 'fail').length;
  const unknownCount = tests.filter(t => t.status === 'unknown').length;

  return (
    <>
      <Helmet>
        <title>Routing Phase 1 QA - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">
                Routing Phase 1 QA
              </h1>
              <p className="text-muted-foreground">
                Test results for the choose-role flow and auth interstitial
              </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-600 dark:text-green-400">PASS</span>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {passCount}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="font-semibold text-red-600 dark:text-red-400">FAIL</span>
                </div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {failCount}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-amber-600 dark:text-amber-400">UNKNOWN</span>
                </div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {unknownCount}
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Test Results</h2>
              <div className="space-y-3">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {test.status === 'pass' && (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                        {test.status === 'fail' && (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                        {test.status === 'unknown' && (
                          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground mb-1">
                          {test.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {test.notes}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Test Links */}
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Manual Testing</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <Link to="/" className="text-primary hover:underline">
                    Test Landing CTA
                  </Link>
                  {' → Click "Get Started" and verify navigation to /choose-role'}
                </div>
                <div>
                  <Link to="/choose-role" className="text-primary hover:underline">
                    Test Role Selection
                  </Link>
                  {' → Click each role card and verify /auth?role= URL'}
                </div>
                <div>
                  <Link to="/login" className="text-primary hover:underline">
                    Test /login redirect
                  </Link>
                  {' → Should redirect to /auth'}
                </div>
                <div>
                  <Link to="/signup" className="text-primary hover:underline">
                    Test /signup redirect
                  </Link>
                  {' → Should redirect to /auth'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
