import { Helmet } from 'react-helmet';

export default function AdminSettings() {
  const primaryEmailSet = !!import.meta.env.VITE_ADMIN_PRIMARY_EMAIL;
  const allowedEmailsSet = !!import.meta.env.ADMIN_ALLOWED_EMAILS;
  const allowedDomainsSet = !!import.meta.env.ADMIN_ALLOWED_DOMAINS;

  return (
    <>
      <Helmet>
        <title>Settings - Admin - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold font-heading mb-2">Settings</h2>
          <p className="text-muted-foreground">System configuration</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Allowlist Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primary Email Set:</span>
              <span className={primaryEmailSet ? 'text-green-600' : 'text-red-600'}>
                {primaryEmailSet ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allowed Emails Set:</span>
              <span className={allowedEmailsSet ? 'text-green-600' : 'text-red-600'}>
                {allowedEmailsSet ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allowed Domains Set:</span>
              <span className={allowedDomainsSet ? 'text-green-600' : 'text-red-600'}>
                {allowedDomainsSet ? '✓ Yes' : '✗ No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
