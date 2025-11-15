# KanggaXpress State Report
**Generated:** 2025-11-15T00:00:00.000Z  
**Version:** 2.1.0  
**Commit:** unknown  
**Environment:** Preview  
**Base URL:** [Will be populated at runtime]

---

## Routes Present

| Path | Component | Status |
|------|-----------|--------|
| `/` | Landing | ✅ |
| `/login` | Login | ✅ |
| `/signup` | Signup | ✅ |
| `/passenger/book-ride` | BookRide | ✅ |
| `/passenger/my-rides` | MyRides | ✅ |
| `/driver/dashboard` | DriverDashboard | ✅ |
| `/driver/setup` | DriverSetup | ✅ |
| `/sender/dashboard` | SenderDashboard | ✅ |
| `/sender/create-delivery` | CreateDelivery | ✅ |
| `/sender/my-deliveries` | MyDeliveries | ✅ |
| `/courier/dashboard` | CourierDashboard | ✅ |
| `/courier/setup` | CourierSetup | ✅ |
| `/qa/hero-anim` | HeroAnim | ✅ |
| `/qa/state` | QAState | ✅ |
| `/qa/sot` | QASOT | ✅ |

---

## Admin v2 Status

- **Admin System Present:** ❌
- **Google Disabled in Admin:** ❌

### Allowlist Configuration
- Primary Email Set: ❌
- Allowed Emails Set: ❌
- Allowed Domains Set: ❌

### Sections Present
- drivers: ❌
- riders: ❌
- trips: ❌
- deliveries: ❌
- kyc: ❌
- finance: ❌
- fare_matrix: ❌
- promotions: ❌
- ops: ❌
- disputes: ❌
- audit: ❌
- settings: ❌

---

## Onboarding & OCR

- **Get Started Route:** `/signup` ✅
- **Auth Tabs Present:** ✅
- **OCR Enabled:** ❌
- **KYC Documents Table:** ❌
- **OCR Confidence Threshold:** 0.65

---

## Maps Integration

- **Provider:** stub
- **Google Maps Key Configured:** ❌
- **Places Library Loaded:** ❌
- **Geometry Library Loaded:** ❌
- **Reverse Geocode Ready:** ❌
- **Passenger Map Renders:** ❌

---

## Realtime & PWA

### Realtime
- **Driver Presence Channel:** ❌
- **Vehicle Marker Icons:** ❌

### PWA
- **PWA Enabled:** ✅
- **Install Prompt Route:** `/` ✅

---

## Branding

- **Carabao Animation Class (.carabao-anim):** ✅
- **Footer Admin Link:** ❌

---

## Environment Variables (Presence Only)

- **Supabase URL:** ✅
- **Supabase Anon Key:** ✅
- **Google Maps Key:** ❌
- **Mapbox Token:** ❌

---

## JSON Snapshot

```json
{
  "meta": {
    "app_name": "KanggaXpress",
    "version": "2.1.0",
    "build_ts": "2025-11-15T00:00:00.000Z",
    "commit": "unknown",
    "base_url": "[Runtime]"
  },
  "routes": [
    { "path": "/", "component": "Landing", "exists": true },
    { "path": "/login", "component": "Login", "exists": true },
    { "path": "/signup", "component": "Signup", "exists": true },
    { "path": "/passenger/book-ride", "component": "BookRide", "exists": true },
    { "path": "/passenger/my-rides", "component": "MyRides", "exists": true },
    { "path": "/driver/dashboard", "component": "DriverDashboard", "exists": true },
    { "path": "/driver/setup", "component": "DriverSetup", "exists": true },
    { "path": "/sender/dashboard", "component": "SenderDashboard", "exists": true },
    { "path": "/sender/create-delivery", "component": "CreateDelivery", "exists": true },
    { "path": "/sender/my-deliveries", "component": "MyDeliveries", "exists": true },
    { "path": "/courier/dashboard", "component": "CourierDashboard", "exists": true },
    { "path": "/courier/setup", "component": "CourierSetup", "exists": true },
    { "path": "/qa/hero-anim", "component": "HeroAnim", "exists": true },
    { "path": "/qa/state", "component": "QAState", "exists": true },
    { "path": "/qa/sot", "component": "QASOT", "exists": true }
  ],
  "admin": {
    "present": false,
    "google_disabled_in_admin": false,
    "allowlist": {
      "primary_email_set": false,
      "allowed_emails_set": false,
      "allowed_domains_set": false
    },
    "sections_present": {
      "drivers": false,
      "riders": false,
      "trips": false,
      "deliveries": false,
      "kyc": false,
      "finance": false,
      "fare_matrix": false,
      "promotions": false,
      "ops": false,
      "disputes": false,
      "audit": false,
      "settings": false
    }
  },
  "onboarding": {
    "get_started_to": "/signup",
    "ok": true,
    "auth_tabs_present": true,
    "ocr_enabled": false,
    "kyc_documents_table_present": false,
    "ocr_conf_threshold": 0.65
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
    "footer_admin_link": false
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
