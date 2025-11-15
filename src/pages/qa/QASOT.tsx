import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { collectProjectState } from '@/lib/stateCollector';

interface SOTItem {
  item: string;
  claimed_in_sot: string;
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  notes: string;
}

export default function QASOT() {
  const [sotItems, setSOTItems] = useState<SOTItem[]>([]);
  const [passCount, setPassCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);

  useEffect(() => {
    const state = collectProjectState();
    
    // Build SOT compliance checklist
    const items: SOTItem[] = [
      {
        item: 'Landing page exists',
        claimed_in_sot: 'v2.0.0',
        status: state.routes.find(r => r.path === '/')?.exists ? 'PASS' : 'FAIL',
        notes: 'Root route present',
      },
      {
        item: 'Auth system (Login & Signup)',
        claimed_in_sot: 'v2.0.0',
        status: state.onboarding.auth_tabs_present ? 'PASS' : 'FAIL',
        notes: 'Login and Signup pages exist',
      },
      {
        item: 'Passenger ride booking',
        claimed_in_sot: 'v2.0.0',
        status: state.routes.find(r => r.path === '/passenger/book-ride')?.exists ? 'PASS' : 'FAIL',
        notes: 'BookRide page exists',
      },
      {
        item: 'Driver dashboard',
        claimed_in_sot: 'v2.0.0',
        status: state.routes.find(r => r.path === '/driver/dashboard')?.exists ? 'PASS' : 'FAIL',
        notes: 'Driver dashboard page exists',
      },
      {
        item: 'Courier dashboard',
        claimed_in_sot: 'v2.0.0',
        status: state.routes.find(r => r.path === '/courier/dashboard')?.exists ? 'PASS' : 'FAIL',
        notes: 'Courier dashboard page exists',
      },
      {
        item: 'Delivery creation',
        claimed_in_sot: 'v2.0.0',
        status: state.routes.find(r => r.path === '/sender/create-delivery')?.exists ? 'PASS' : 'FAIL',
        notes: 'CreateDelivery page exists',
      },
      {
        item: 'PWA enabled',
        claimed_in_sot: 'v2.0.8',
        status: state.pwa.enabled ? 'PASS' : 'FAIL',
        notes: 'PWA manifest and install prompt configured',
      },
      {
        item: 'Carabao logo animation',
        claimed_in_sot: 'v2.0.10',
        status: state.branding.carabao_animation_class_present ? 'PASS' : 'FAIL',
        notes: '.carabao-anim class present',
      },
      {
        item: '/qa/hero-anim QA page',
        claimed_in_sot: 'v2.0.10',
        status: state.routes.find(r => r.path === '/qa/hero-anim')?.exists ? 'PASS' : 'FAIL',
        notes: 'Animation QA page exists',
      },
      {
        item: 'Supabase configured',
        claimed_in_sot: 'v2.0.0',
        status: state.env_presence.supabase_url && state.env_presence.supabase_anon_key ? 'PASS' : 'FAIL',
        notes: 'Supabase URL and anon key present',
      },
      {
        item: 'Admin v2 password-only',
        claimed_in_sot: 'TBD',
        status: state.admin.present ? (state.admin.google_disabled_in_admin ? 'PASS' : 'FAIL') : 'UNKNOWN',
        notes: 'Admin system not yet implemented',
      },
      {
        item: 'Google Maps integration',
        claimed_in_sot: 'TBD',
        status: state.maps.has_google_key ? 'PASS' : 'UNKNOWN',
        notes: 'Maps provider currently: ' + state.maps.provider,
      },
      {
        item: 'OCR for KYC documents',
        claimed_in_sot: 'TBD',
        status: state.onboarding.ocr_enabled ? 'PASS' : 'UNKNOWN',
        notes: 'OCR/Tesseract not yet configured',
      },
      {
        item: 'Driver realtime presence',
        claimed_in_sot: 'TBD',
        status: state.realtime.driver_presence_channel_configured ? 'PASS' : 'UNKNOWN',
        notes: 'Realtime presence channel not yet configured',
      },
    ];

    setSOTItems(items);
    setPassCount(items.filter(i => i.status === 'PASS').length);
    setFailCount(items.filter(i => i.status === 'FAIL').length);
    setUnknownCount(items.filter(i => i.status === 'UNKNOWN').length);
  }, []);

  const StatusIcon = ({ status }: { status: 'PASS' | 'FAIL' | 'UNKNOWN' }) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'FAIL':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'UNKNOWN':
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const StatusBadge = ({ status }: { status: 'PASS' | 'FAIL' | 'UNKNOWN' }) => {
    const variants = {
      PASS: 'default' as const,
      FAIL: 'destructive' as const,
      UNKNOWN: 'secondary' as const,
    };
    return (
      <Badge variant={variants[status]} className="gap-1">
        <StatusIcon status={status} />
        {status}
      </Badge>
    );
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>SOT Compliance | KanggaXpress QA</title>
      </Helmet>

      <div className="min-h-screen bg-background p-8" data-testid="qa-sot">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              SOT Compliance Checker
            </h1>
            <p className="text-muted-foreground">
              Compare Source of Truth claims vs. actual code implementation
            </p>
          </div>

          {/* Summary Card */}
          <Card className="p-6 bg-success/10 border-success/30">
            <h2 className="text-xl font-heading font-semibold mb-4 text-success-foreground">
              Compliance Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{passCount}</p>
                  <p className="text-sm text-muted-foreground">Passing</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{failCount}</p>
                  <p className="text-sm text-muted-foreground">Failing</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <HelpCircle className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{unknownCount}</p>
                  <p className="text-sm text-muted-foreground">Unknown</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Compliance Table */}
          <Card className="p-6">
            <h2 className="text-xl font-heading font-semibold mb-4">
              Compliance Checklist
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3">Item</th>
                    <th className="text-left py-3 px-3">Claimed in SOT</th>
                    <th className="text-left py-3 px-3">Status</th>
                    <th className="text-left py-3 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sotItems.map((item, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-3 font-medium">{item.item}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {item.claimed_in_sot}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* About SOT */}
          <Card className="p-6 bg-muted/50">
            <h2 className="text-lg font-heading font-semibold mb-2">
              About SOT Compliance
            </h2>
            <p className="text-sm text-muted-foreground">
              This page compares claims made in the Source of Truth documentation
              (docs/kanggaxpress-spec.md) against the actual implementation. Items marked as
              UNKNOWN indicate features that are planned but not yet fully implemented or
              features where the compliance check cannot be automatically verified.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
