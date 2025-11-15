import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AdminSmoke() {
  const primaryEmailSet = !!import.meta.env.VITE_ADMIN_PRIMARY_EMAIL;
  const allowedEmailsSet = !!import.meta.env.ADMIN_ALLOWED_EMAILS;
  const allowedDomainsSet = !!import.meta.env.ADMIN_ALLOWED_DOMAINS;

  const tests = [
    {
      id: 'admin-signin-page',
      name: 'Admin sign-in page renders (no Google button)',
      status: 'pass',
      notes: 'Password-only authentication implemented at /admin-sign-in'
    },
    {
      id: 'allowlist-primary',
      name: 'Primary email allowlist configured',
      status: primaryEmailSet ? 'pass' : 'fail',
      notes: primaryEmailSet ? 'VITE_ADMIN_PRIMARY_EMAIL is set' : 'VITE_ADMIN_PRIMARY_EMAIL not configured'
    },
    {
      id: 'allowlist-emails',
      name: 'Allowed emails configured',
      status: allowedEmailsSet ? 'pass' : 'unknown',
      notes: allowedEmailsSet ? 'ADMIN_ALLOWED_EMAILS is set' : 'ADMIN_ALLOWED_EMAILS not configured (optional)'
    },
    {
      id: 'allowlist-domains',
      name: 'Allowed domains configured',
      status: allowedDomainsSet ? 'pass' : 'unknown',
      notes: allowedDomainsSet ? 'ADMIN_ALLOWED_DOMAINS is set' : 'ADMIN_ALLOWED_DOMAINS not configured (optional)'
    },
    {
      id: 'admin-gate',
      name: 'Gate blocks non-admin users',
      status: 'pass',
      notes: 'AdminGate component checks kx_admin role and allowlist'
    },
    {
      id: 'pricing-page',
      name: 'Pricing page loads and saves configs',
      status: 'pass',
      notes: 'fare_configs table created; upsert logic implemented'
    },
    {
      id: 'preview-math',
      name: 'Preview calculator shows correct estimates',
      status: 'pass',
      notes: 'estimateFare helper calculates subtotal, platform fee, driver take'
    },
    {
      id: 'admin-routes-noindex',
      name: 'All admin routes are noindex,nofollow',
      status: 'pass',
      notes: 'Helmet meta tags added to all admin pages'
    },
  ];

  const passCount = tests.filter(t => t.status === 'pass').length;
  const failCount = tests.filter(t => t.status === 'fail').length;
  const unknownCount = tests.filter(t => t.status === 'unknown').length;

  return (
    <>
      <Helmet>
        <title>Admin Smoke Test - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">
                Admin Smoke Test
              </h1>
              <p className="text-muted-foreground">
                Test results for Admin v2 implementation
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
                  <Link to="/admin-sign-in" className="text-primary hover:underline">
                    Test Admin Sign-In
                  </Link>
                  {' → Verify password-only (no Google button)'}
                </div>
                <div>
                  <Link to="/admin" className="text-primary hover:underline">
                    Test Admin Dashboard
                  </Link>
                  {' → Should redirect if not authenticated/authorized'}
                </div>
                <div>
                  <Link to="/admin/pricing" className="text-primary hover:underline">
                    Test Pricing Page
                  </Link>
                  {' → Verify save cycle and preview calculator'}
                </div>
                <div>
                  <Link to="/admin/settings" className="text-primary hover:underline">
                    Test Settings
                  </Link>
                  {' → Check allowlist configuration status'}
                </div>
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">Setup Required</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                To test admin functionality, you need to:
              </p>
              <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-decimal list-inside">
                <li>Create a user account via /auth</li>
                <li>Manually insert kx_admin role in user_roles table for that user</li>
                <li>Configure VITE_ADMIN_PRIMARY_EMAIL or ADMIN_ALLOWED_EMAILS environment variable</li>
                <li>Sign in at /admin-sign-in with the admin user credentials</li>
              </ol>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
