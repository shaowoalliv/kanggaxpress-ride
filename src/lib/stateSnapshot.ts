import { collectProjectState } from './stateCollector';

export function generateStateMarkdown(): string {
  const state = collectProjectState();
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  const markdown = `# KanggaXpress State Report
**Generated:** ${state.meta.build_ts}  
**Version:** ${state.meta.version}  
**Commit:** ${state.meta.commit}  
**Environment:** Preview  
**Base URL:** ${state.meta.base_url}

---

## Routes Present

| Path | Component | Status |
|------|-----------|--------|
${state.routes.map(r => `| \`${r.path}\` | ${r.component} | ${r.exists ? '✅' : '❌'} |`).join('\n')}

---

## Admin v2 Status

- **Admin System Present:** ${state.admin.present ? '✅' : '❌'}
- **Google Disabled in Admin:** ${state.admin.google_disabled_in_admin ? '✅' : '❌'}

### Allowlist Configuration
- Primary Email Set: ${state.admin.allowlist.primary_email_set ? '✅' : '❌'}
- Allowed Emails Set: ${state.admin.allowlist.allowed_emails_set ? '✅' : '❌'}
- Allowed Domains Set: ${state.admin.allowlist.allowed_domains_set ? '✅' : '❌'}

### Sections Present
${Object.entries(state.admin.sections_present).map(([key, val]) => 
  `- ${key}: ${val ? '✅' : '❌'}`
).join('\n')}

---

## Onboarding & OCR

- **Get Started Route:** \`${state.onboarding.get_started_to}\` ${state.onboarding.ok ? '✅' : '❌'}
- **Auth Tabs Present:** ${state.onboarding.auth_tabs_present ? '✅' : '❌'}
- **OCR Enabled:** ${state.onboarding.ocr_enabled ? '✅' : '❌'}
- **KYC Documents Table:** ${state.onboarding.kyc_documents_table_present ? '✅' : '❌'}
- **OCR Confidence Threshold:** ${state.onboarding.ocr_conf_threshold}

---

## Maps Integration

- **Provider:** ${state.maps.provider}
- **Google Maps Key Configured:** ${state.maps.has_google_key ? '✅' : '❌'}
- **Places Library Loaded:** ${state.maps.places_loaded ? '✅' : '❌'}
- **Geometry Library Loaded:** ${state.maps.geometry_loaded ? '✅' : '❌'}
- **Reverse Geocode Ready:** ${state.maps.reverse_geocode_ready ? '✅' : '❌'}
- **Passenger Map Renders:** ${state.maps.passenger_map_renders ? '✅' : '❌'}

---

## Realtime & PWA

### Realtime
- **Driver Presence Channel:** ${state.realtime.driver_presence_channel_configured ? '✅' : '❌'}
- **Vehicle Marker Icons:** ${state.realtime.marker_icons_by_vehicle ? '✅' : '❌'}

### PWA
- **PWA Enabled:** ${state.pwa.enabled ? '✅' : '❌'}
- **Install Prompt Route:** \`${state.pwa.install_prompt_deferred_to}\` ${state.pwa.ok ? '✅' : '❌'}

---

## Branding

- **Carabao Animation Class (.carabao-anim):** ${state.branding.carabao_animation_class_present ? '✅' : '❌'}
- **Footer Admin Link:** ${state.branding.footer_admin_link ? '✅' : '❌'}

---

## Environment Variables (Presence Only)

- **Supabase URL:** ${state.env_presence.supabase_url ? '✅' : '❌'}
- **Supabase Anon Key:** ${state.env_presence.supabase_anon_key ? '✅' : '❌'}
- **Google Maps Key:** ${state.env_presence.google_maps_key ? '✅' : '❌'}
- **Mapbox Token:** ${state.env_presence.mapbox_token ? '✅' : '❌'}

---

## JSON Snapshot

\`\`\`json
${JSON.stringify(state, null, 2)}
\`\`\`

---

*This report was automatically generated on ${today}*
`;

  return markdown;
}
