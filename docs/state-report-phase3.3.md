# KanggaXpress State Report
**Generated:** 2025-11-15T14:00:00.000Z  
**Version:** 2.3.5  
**Commit:** Phase 3.3 Complete  
**Environment:** Preview  
**Base URL:** [Will be populated at runtime]

---

## Routes Present

| Path | Component | Status |
|------|-----------|--------|
| `/` | Landing | ✅ |
| `/choose-role` | ChooseRole | ✅ |
| `/auth` | Auth | ✅ |
| `/login` | LoginRedirect | ✅ |
| `/signup` | SignupRedirect | ✅ |
| `/passenger/book-ride` | BookRide | ✅ |
| `/passenger/my-rides` | MyRides | ✅ |
| `/driver/dashboard` | DriverDashboard | ✅ |
| `/driver/setup` | DriverSetup | ✅ |
| `/sender/dashboard` | SenderDashboard | ✅ |
| `/sender/create-delivery` | CreateDelivery | ✅ |
| `/sender/my-deliveries` | MyDeliveries | ✅ |
| `/courier/dashboard` | CourierDashboard | ✅ |
| `/courier/setup` | CourierSetup | ✅ |
| `/account/kyc` | KycStatus | ✅ |
| `/admin-sign-in` | AdminSignIn | ✅ |
| `/admin` | AdminDashboard | ✅ |
| `/qa/hero-anim` | HeroAnim | ✅ |
| `/qa/state` | QAState | ✅ |
| `/qa/sot` | QASOT | ✅ |
| `/qa/admin-smoke` | AdminSmoke | ✅ |
| `/qa/ocr` | QAOOCR | ✅ |
| `/qa/kyc-admin` | QAKYCAdmin | ✅ |
| `/qa/maps-keys` | MapsKeys | ✅ |

---

## Admin v2 Status

- **Admin System Present:** ✅
- **Google Disabled in Admin:** ✅ (Password-only)

### Allowlist Configuration
- Primary Email Set: ✅ (VITE_ADMIN_PRIMARY_EMAIL)
- Allowed Emails Set: ✅ (ADMIN_ALLOWED_EMAILS)
- Allowed Domains Set: ✅ (ADMIN_ALLOWED_DOMAINS)

### Sections Present
- Dashboard (Home): ✅
- Drivers: ✅
- Riders: ✅
- Trips: ✅
- Deliveries: ✅
- Pricing: ✅
- KYC: ✅
- Finance: ✅
- Fare Matrix: ✅
- Promotions: ✅
- Ops: ✅
- Disputes: ✅
- Audit: ✅
- Settings: ✅

---

## Onboarding & OCR

- **Get Started Route:** `/choose-role` ✅
- **Auth Tabs Present:** ✅
- **OCR Enabled:** ✅
- **Driver OCR Wired:** ✅
- **Courier OCR Wired:** ✅
- **KYC Documents Table:** ✅
- **OCR Confidence Threshold:** 0.65
- **OCR Provider:** wasm (tesseract.js)

---

## Maps Integration

- **Provider:** stub (configurable via VITE_MAPS_PROVIDER)
- **Google Maps Key Configured:** ❌
- **Places Library Loaded:** ❌
- **Geometry Library Loaded:** ❌
- **Reverse Geocode Ready:** ❌
- **Passenger Map Renders:** ❌
- **QA Page:** `/qa/maps-keys` ✅

---

## Realtime & PWA

### Realtime
- **Driver Presence Channel:** ❌ (VITE_ENABLE_REALTIME=false)
- **Vehicle Marker Icons:** ❌

### PWA
- **PWA Enabled:** ✅
- **Install Prompt Route:** `/` ✅

---

## Branding

- **Carabao Animation Class (.carabao-anim):** ✅
- **Footer Admin Link:** ✅

---

## KYC & Storage

- **Storage Bucket (kyc):** ✅
- **Image Upload:** ✅
- **Signed URL Previews:** ✅
- **Admin KYC Queue:** ✅
- **User KYC Status Page:** ✅

---

## Environment Variables (Configured)

- **Supabase URL:** ✅
- **Supabase Anon Key:** ✅
- **Admin Primary Email:** ✅
- **Admin Allowed Emails:** ✅
- **Admin Allowed Domains:** ✅
- **OCR Provider:** ✅
- **OCR Confidence Min:** ✅
- **Maps Provider:** ✅
- **Google Maps Key:** ❌
- **Mapbox Token:** ❌

---

## JSON Snapshot

```json
{
  "meta": {
    "app_name": "KanggaXpress",
    "version": "2.3.5",
    "build_ts": "2025-11-15T14:00:00.000Z",
    "commit": "Phase 3.3 Complete",
    "base_url": "[Runtime]"
  },
  "routes": [
    { "path": "/", "component": "Landing", "exists": true },
    { "path": "/choose-role", "component": "ChooseRole", "exists": true },
    { "path": "/auth", "component": "Auth", "exists": true },
    { "path": "/login", "component": "LoginRedirect", "exists": true },
    { "path": "/signup", "component": "SignupRedirect", "exists": true },
    { "path": "/passenger/book-ride", "component": "BookRide", "exists": true },
    { "path": "/passenger/my-rides", "component": "MyRides", "exists": true },
    { "path": "/driver/dashboard", "component": "DriverDashboard", "exists": true },
    { "path": "/driver/setup", "component": "DriverSetup", "exists": true },
    { "path": "/sender/dashboard", "component": "SenderDashboard", "exists": true },
    { "path": "/sender/create-delivery", "component": "CreateDelivery", "exists": true },
    { "path": "/sender/my-deliveries", "component": "MyDeliveries", "exists": true },
    { "path": "/courier/dashboard", "component": "CourierDashboard", "exists": true },
    { "path": "/courier/setup", "component": "CourierSetup", "exists": true },
    { "path": "/account/kyc", "component": "KycStatus", "exists": true },
    { "path": "/admin-sign-in", "component": "AdminSignIn", "exists": true },
    { "path": "/admin", "component": "AdminDashboard", "exists": true }
  ],
  "admin": {
    "present": true,
    "google_disabled_in_admin": true,
    "allowlist": {
      "primary_email_set": true,
      "allowed_emails_set": true,
      "allowed_domains_set": true
    },
    "sections_present": {
      "drivers": true,
      "riders": true,
      "trips": true,
      "deliveries": true,
      "kyc": true,
      "finance": true,
      "fare_matrix": true,
      "promotions": true,
      "ops": true,
      "disputes": true,
      "audit": true,
      "settings": true
    }
  },
  "onboarding": {
    "get_started_to": "/choose-role",
    "ok": true,
    "auth_tabs_present": true,
    "ocr_enabled": true,
    "kyc_documents_table_present": true,
    "ocr_conf_threshold": 0.65,
    "driver_ocr_wired": true,
    "courier_ocr_wired": true
  },
  "maps": {
    "provider": "stub",
    "has_google_key": false,
    "places_loaded": false,
    "geometry_loaded": false,
    "reverse_geocode_ready": false,
    "passenger_map_renders": false
  },
  "realtime": {
    "driver_presence_channel_configured": false,
    "marker_icons_by_vehicle": false
  },
  "pwa": {
    "enabled": true,
    "install_prompt_deferred_to": "/",
    "ok": true
  },
  "branding": {
    "carabao_animation_class_present": true,
    "footer_admin_link": true
  },
  "kyc": {
    "storage_bucket_present": true
  },
  "env_presence": {
    "supabase_url": true,
    "supabase_anon_key": true,
    "google_maps_key": false,
    "mapbox_token": false
  }
}
```

---

*This report was automatically generated on 20251115*
