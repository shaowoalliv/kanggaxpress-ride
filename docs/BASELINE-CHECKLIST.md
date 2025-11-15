# KanggaXpress Baseline Checklist
**Version:** 2.3.5  
**Date:** 2025-11-15  
**Status:** ✅ COMPLETE

---

## A) Routing (Phase 1 corrections) ✅

- [x] Landing "Get Started" → `/choose-role` (with 400ms fallback)
- [x] `/choose-role` page with three role cards
- [x] `/login` and `/signup` redirect to `/auth?role=...`
- [x] State: `onboarding.get_started_to === "/choose-role"`

## B) Admin v2 Minimal Shell ✅

### Routes
- [x] `/admin-sign-in` - Email + password (NO Google)
- [x] `/admin` - Dashboard shell with sidebar
- [x] 14 sections stubbed: Drivers, Riders, Trips, Deliveries, Pricing, KYC, Finance, Fare Matrix, Promotions, Ops, Disputes, Audit, Settings

### Security
- [x] AdminGate requires `kx_admin` role from `user_roles` table
- [x] Allowlist env presence checks:
  - `VITE_ADMIN_PRIMARY_EMAIL=admin@kanggaxpress.com`
  - `ADMIN_ALLOWED_EMAILS=admin@kanggaxpress.com`
  - `ADMIN_ALLOWED_DOMAINS=kanggaxpress.com`
- [x] All admin pages: `<meta name="robots" content="noindex,nofollow" />`

### State JSON
- [x] `admin.present=true`
- [x] `admin.google_disabled_in_admin=true`
- [x] All 14 sections booleans = `true`
- [x] Allowlist presence booleans from env

## C) OCR/KYC Enablement ✅

### Environment
- [x] `.env.example` includes:
  ```env
  VITE_OCR_PROVIDER=wasm
  VITE_OCR_CONFIDENCE_MIN=0.65
  VITE_ENABLE_OCR=true
  ```

### Database
- [x] `kyc_documents` table exists with RLS
- [x] Storage bucket `kyc` configured for images

### Integration
- [x] Driver Setup: 4 OCR capture cards (DRIVER_LICENSE, OR, CR, SELFIE)
- [x] Courier Setup: 4 OCR capture cards (same)
- [x] OcrReviewModal with autofill and confidence gating
- [x] Image upload to Supabase Storage
- [x] Admin KYC page with image previews

### State JSON
- [x] `onboarding.ocr_enabled=true`
- [x] `onboarding.kyc_documents_table_present=true`
- [x] `onboarding.driver_ocr_wired=true`
- [x] `onboarding.courier_ocr_wired=true`
- [x] `onboarding.ocr_conf_threshold=0.65`
- [x] `kyc.storage_bucket_present=true`

### QA Pages
- [x] `/qa/ocr` - OCR smoke tests
- [x] `/qa/kyc-admin` - Admin workflow tests

## D) Maps Provider + QA ✅

### Implementation
- [x] Maps adapter checks `VITE_GOOGLE_MAPS_API_KEY` presence
- [x] If key present → `provider="google"`
- [x] If no key → `provider="stub"` with banner
- [x] `/qa/maps-keys` page with:
  - Env key presence check
  - Key format validator
  - Implementation guide

### State JSON
- [x] `maps.provider` = "stub" or "google" (based on key)
- [x] `maps.has_google_key` boolean
- [x] `maps.places_loaded` boolean
- [x] `maps.geometry_loaded` boolean
- [x] `maps.reverse_geocode_ready` boolean
- [x] `maps.passenger_map_renders` boolean

## E) Realtime Flags (Baseline Wiring) ✅

### Channel Contract
- [x] Driver presence channel: `presence:CALAPAN`

### Publisher (Driver Dashboard)
- [x] Stub publishes on "Go Online" toggle
- [x] Payload: `{ driver_id, vehicle_type, location, online_at }`
- [x] Console log: `[Realtime] Publishing driver presence...`

### Subscriber (Passenger Map)
- [x] Stub subscribes to `presence:CALAPAN`
- [x] Console log: `[Realtime] Subscribing to presence...`
- [x] Ready for green markers by vehicle_type

### State JSON
- [x] `realtime.driver_presence_channel_configured=true`
- [x] `realtime.marker_icons_by_vehicle=true`

## F) Branding: Footer Admin Link ✅

- [x] Landing footer includes "Admin" link → `/admin-sign-in`
- [x] State: `branding.footer_admin_link=true`

## G) QA & State Reporters ✅

### `/qa/state`
- [x] All new fields populate correctly
- [x] JSON export includes full state snapshot

### `/qa/sot`
- [x] Routing check: get_started_to = "/choose-role"
- [x] Admin presence check
- [x] Admin sections count (14/14)
- [x] OCR enabled check
- [x] Driver/Courier OCR wired check
- [x] Maps provider check
- [x] Realtime configured check
- [x] Footer admin link check
- [x] KYC storage bucket check

### New QA Pages
- [x] `/qa/admin-smoke` - Admin authentication tests
- [x] `/qa/ocr` - OCR confidence gating tests
- [x] `/qa/kyc-admin` - KYC admin workflow tests
- [x] `/qa/maps-keys` - Maps key validation and guide

## H) SOT Documentation ✅

- [x] Updated `/docs/kanggaxpress-spec.md` with Phase 3.3
- [x] Created `/docs/state-report-phase3.3.md`
- [x] spec_id: `kanggaxpress-v2.3.5`
- [x] Security notes included (no secrets logged, admin noindex)

---

## Environment Variables Summary

### Required (Configured)
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY`
- ✅ `VITE_SUPABASE_PROJECT_ID`
- ✅ `VITE_ADMIN_PRIMARY_EMAIL`
- ✅ `ADMIN_ALLOWED_EMAILS`
- ✅ `ADMIN_ALLOWED_DOMAINS`
- ✅ `VITE_OCR_PROVIDER=wasm`
- ✅ `VITE_OCR_CONFIDENCE_MIN=0.65`
- ✅ `VITE_ENABLE_OCR=true`
- ✅ `VITE_MAPS_PROVIDER=stub`

### Optional (Future)
- ⏳ `VITE_GOOGLE_MAPS_API_KEY` (for real maps)
- ⏳ `VITE_ENABLE_REALTIME=true` (for live presence)

---

## Database Schema Summary

### Tables
- ✅ `profiles` (user base data)
- ✅ `user_roles` (admin role assignments)
- ✅ `driver_profiles`
- ✅ `courier_profiles`
- ✅ `rides`
- ✅ `delivery_orders`
- ✅ `kyc_documents` (with image_path)
- ✅ `fare_configs`

### Storage Buckets
- ✅ `kyc` (private, for document images)

### Functions
- ✅ `has_role(_user_id, _role)` - Admin role checker
- ✅ `update_updated_at_column()` - Timestamp trigger

---

## Security Checklist ✅

- [x] Admin password-only (Google disabled)
- [x] Admin allowlist configured (email + domain)
- [x] All admin routes `noindex,nofollow`
- [x] RLS policies on all tables
- [x] KYC documents: owner read/write, admin full access
- [x] Storage bucket `kyc`: private with RLS
- [x] Signed URLs for image access (60s TTL)
- [x] No secrets logged to console
- [x] Admin gate checks `kx_admin` role + allowlist

---

## Test Coverage

### QA Pages
- `/qa/state` - Full state JSON export
- `/qa/sot` - SOT compliance checks
- `/qa/admin-smoke` - Admin authentication
- `/qa/ocr` - OCR confidence gating
- `/qa/kyc-admin` - KYC admin workflow
- `/qa/maps-keys` - Maps configuration
- `/qa/routing-phase-1` - Routing flow tests
- `/qa/hero-anim` - Animation tests

### Manual Test Scenarios
1. ✅ Landing → Choose Role → Auth (all 3 roles)
2. ✅ Admin sign-in with password (reject non-admin)
3. ✅ Driver setup with OCR (all 4 documents)
4. ✅ Courier setup with OCR (all 4 documents)
5. ✅ Admin KYC review with image previews
6. ✅ Toggle driver availability (realtime stub logs)
7. ✅ Passenger book ride (realtime stub logs)

---

## Next Steps (Phase 4 Candidates)

1. **Google Maps Integration**
   - Add `VITE_GOOGLE_MAPS_API_KEY`
   - Switch `VITE_MAPS_PROVIDER=google`
   - Implement autocomplete for addresses
   - Enable real geocoding and route calculation

2. **Realtime Presence (Live)**
   - Set `VITE_ENABLE_REALTIME=true`
   - Replace stubs with actual Supabase Realtime
   - Implement live driver markers on passenger map
   - Add 5-second location updates

3. **Push Notifications**
   - Web Push API integration
   - Ride status updates
   - Driver acceptance notifications
   - Delivery status updates

4. **Analytics Dashboard**
   - Ride statistics (daily/monthly)
   - Revenue charts
   - Active drivers/passengers count
   - KYC approval metrics

5. **Enhanced KYC Workflow**
   - Bulk approve/reject
   - Document zoom viewer
   - Audit trail logging
   - Automated flagging (low confidence)

---

*Baseline complete. All red items resolved. Project ready for Phase 4.*
