import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Copy, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { collectProjectState, getStatusBadge } from '@/lib/stateCollector';

export default function QAState() {
  const [state] = useState(collectProjectState());
  const stateJSON = JSON.stringify(state, null, 2);

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(stateJSON);
      toast.success('JSON copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy JSON');
    }
  };

  const StatusBadge = ({ status }: { status: 'success' | 'warning' | 'error' }) => {
    const config = {
      success: { icon: CheckCircle2, variant: 'default' as const, text: 'OK' },
      warning: { icon: AlertCircle, variant: 'secondary' as const, text: 'Warning' },
      error: { icon: XCircle, variant: 'destructive' as const, text: 'Missing' },
    };
    const { icon: Icon, variant, text } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Project State | KanggaXpress QA</title>
      </Helmet>

      <div className="min-h-screen bg-background p-8" data-testid="qa-state">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              Project State Dashboard
            </h1>
            <p className="text-muted-foreground">
              Human-friendly view of what's currently implemented
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Meta Information */}
              <Card className="p-6">
                <h2 className="text-xl font-heading font-semibold mb-4">Meta Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">App Name:</span>
                    <p className="font-semibold">{state.meta.app_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Version:</span>
                    <p className="font-semibold">{state.meta.version}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Build Timestamp:</span>
                    <p className="font-mono text-sm">{state.meta.build_ts}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Commit:</span>
                    <p className="font-mono text-sm">{state.meta.commit}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-sm text-muted-foreground">Base URL:</span>
                    <p className="font-mono text-sm">{state.meta.base_url}</p>
                  </div>
                </div>
              </Card>

              {/* Routes */}
              <Card className="p-6">
                <h2 className="text-xl font-heading font-semibold mb-4">Routes</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3">Path</th>
                        <th className="text-left py-2 px-3">Component</th>
                        <th className="text-left py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.routes.map((route, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 px-3 font-mono text-xs">{route.path}</td>
                          <td className="py-2 px-3">{route.component}</td>
                          <td className="py-2 px-3">
                            <StatusBadge status={getStatusBadge(route.exists)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Admin v2 */}
              <Card className="p-6">
                <h2 className="text-xl font-heading font-semibold mb-4">Admin v2</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Admin System Present</span>
                    <StatusBadge status={getStatusBadge(state.admin.present)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Google Disabled in Admin</span>
                    <StatusBadge status={getStatusBadge(state.admin.google_disabled_in_admin)} />
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm font-semibold mb-2">Allowlist Configuration:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Primary Email</span>
                        <StatusBadge status={getStatusBadge(state.admin.allowlist.primary_email_set)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Allowed Emails</span>
                        <StatusBadge status={getStatusBadge(state.admin.allowlist.allowed_emails_set)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Allowed Domains</span>
                        <StatusBadge status={getStatusBadge(state.admin.allowlist.allowed_domains_set)} />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Onboarding & OCR */}
              <Card className="p-6">
                <h2 className="text-xl font-heading font-semibold mb-4">Onboarding & OCR</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Get Started Route</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{state.onboarding.get_started_to}</span>
                      <StatusBadge status={getStatusBadge(state.onboarding.ok)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auth Tabs Present</span>
                    <StatusBadge status={getStatusBadge(state.onboarding.auth_tabs_present)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>OCR Enabled</span>
                    <StatusBadge status={getStatusBadge(state.onboarding.ocr_enabled)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>KYC Documents Table</span>
                    <StatusBadge status={getStatusBadge(state.onboarding.kyc_documents_table_present)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>OCR Confidence Threshold</span>
                    <span className="font-mono text-sm">{state.onboarding.ocr_conf_threshold}</span>
                  </div>
                </div>
              </Card>

              {/* Maps */}
              <Card className="p-6">
                <h2 className="text-xl font-heading font-semibold mb-4">Maps Integration</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Provider</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{state.maps.provider}</span>
                      <StatusBadge status={getStatusBadge(state.maps.provider)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Google Maps Key Configured</span>
                    <StatusBadge status={getStatusBadge(state.maps.has_google_key)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Places Library Loaded</span>
                    <StatusBadge status={getStatusBadge(state.maps.places_loaded)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Geometry Library Loaded</span>
                    <StatusBadge status={getStatusBadge(state.maps.geometry_loaded)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Reverse Geocode Ready</span>
                    <StatusBadge status={getStatusBadge(state.maps.reverse_geocode_ready)} />
                  </div>
                </div>
              </Card>

              {/* Realtime & PWA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h2 className="text-xl font-heading font-semibold mb-4">Realtime</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Driver Presence Channel</span>
                      <StatusBadge status={getStatusBadge(state.realtime.driver_presence_channel_configured)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Vehicle Marker Icons</span>
                      <StatusBadge status={getStatusBadge(state.realtime.marker_icons_by_vehicle)} />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-heading font-semibold mb-4">PWA</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">PWA Enabled</span>
                      <StatusBadge status={getStatusBadge(state.pwa.enabled)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Install Prompt Route</span>
                      <StatusBadge status={getStatusBadge(state.pwa.ok)} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Branding & Environment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h2 className="text-xl font-heading font-semibold mb-4">Branding</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Carabao Animation</span>
                      <StatusBadge status={getStatusBadge(state.branding.carabao_animation_class_present)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Footer Admin Link</span>
                      <StatusBadge status={getStatusBadge(state.branding.footer_admin_link)} />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-heading font-semibold mb-4">Environment</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Supabase URL</span>
                      <StatusBadge status={getStatusBadge(state.env_presence.supabase_url)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Supabase Anon Key</span>
                      <StatusBadge status={getStatusBadge(state.env_presence.supabase_anon_key)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Google Maps Key</span>
                      <StatusBadge status={getStatusBadge(state.env_presence.google_maps_key)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mapbox Token</span>
                      <StatusBadge status={getStatusBadge(state.env_presence.mapbox_token)} />
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-semibold">JSON Export</h2>
                  <Button onClick={handleCopyJSON} variant="outline" className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copy JSON
                  </Button>
                </div>
                <Textarea
                  value={stateJSON}
                  readOnly
                  className="font-mono text-xs h-[600px]"
                  data-testid="qa-state-json"
                />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
