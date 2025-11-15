# KanggaXpress Source of Truth (SOT)

This document serves as the authoritative Source of Truth for the KanggaXpress application, tracking all implemented features, specifications, and architectural decisions.

---

## Phase 3.3 — Driver & Courier OCR Autofill + Admin Previews (Completed)
**spec_id**: kanggaxpress-v2.3.5  
**date**: 2025-11-15

### Overview
Wired OCR → Review → Autofill into Driver and Courier setup pages with enforced confidence threshold (VITE_OCR_CONFIDENCE_MIN). Integrated image upload to Supabase Storage (`kyc` bucket) with signed-URL previews in Admin and owner-only in /account/kyc.

### Driver & Courier Setup
- Four capture sections: DRIVER_LICENSE, OR, CR, SELFIE
- On OCR complete → OcrReviewModal with parsed data + avgConfidence
- On Accept:
  - Upload image via `kycService.uploadDocumentImage(file, userId, docType)` → `image_path`
  - Stage `stagedKyc[docType]` with `{ doc_type, parsed, confidence, status, image_path }`
  - Autofill form fields (license_number, vehicle_plate, vehicle_model, vehicle_color)
- Submit gating:
  - Require all 4 documents captured
  - Enable Submit if avgConfidence ≥ OCR_MIN; otherwise require confirmation checkbox
- On Submit → insert kyc_documents rows, show success toast, route to dashboard

### Admin KYC Enhancements
- Image previews: 64×64 thumbnails via `kycService.getSignedUrl(image_path, 60)`
- JSON drawer: View formatted parsed data
- Approve/Reject: Update status with optional rejection reason
- Filters: Multi-select chips for status and doc_type, search box

### User Menu & KYC Status
- Link to /account/kyc from user/profile menu (all roles)
- Show doc cards with status chips and tiny previews (owner-signed URL)
- For REJECTED docs: "Fix & Re-upload" → capture + review; on Accept, insert new row

### QA Extensions
- /qa/ocr: "Hydrate Driver Setup" & "Hydrate Courier Setup" demos (0.58 blocked, 0.76 allowed)
- /qa/kyc-admin: "Show previews" toggle; PASS if ≥1 thumbnail renders
- /qa/state additions:
  - `onboarding.driver_ocr_wired=true`
  - `onboarding.courier_ocr_wired=true`
  - `kyc.storage_bucket_present=true`
  - `admin.kyc_previews_enabled=true`

### Security Notes
- Never log secrets; do not print signed URLs to public logs
- All admin routes: `noindex,nofollow`
- Admin remains password-only (no Google)

---

## Phase 3 — Camera + OCR + KYC (Completed)
**spec_id**: kanggaxpress-v2.3.3-final  
**date**: 2025-11-15



## Phase 3 — Camera + OCR + KYC (Completed)
**spec_id**: kanggaxpress-v2.3.3-final  
**date**: 2025-11-15

### Overview
Integrated camera capture and OCR (tesseract.js) across all registration flows with confidence-based gating, field autofill, and admin review queue.

### Components & Services
- **OcrReviewModal**: Editable fields, confidence meter, threshold-based Accept gating
- **OcrCaptureCard**: Camera/file capture with review modal integration
- **fieldMaps.ts**: Normalizes OCR output to strict JSONB schemas
- **kycService**: CRUD operations for kyc_documents table

### Database
- **kyc_documents** table with JSONB parsed field, confidence score, status (PENDING/REVIEW/APPROVED/REJECTED)
- **RLS**: Owners read/write PENDING/REVIEW only; kx_admin full access

### Document Schemas (lower_snake_case)
- **GOVT_ID/PRIVATE_ID**: id_no, fullname, birthdate, address, expiry_date
- **DRIVER_LICENSE**: license_no, fullname, address, restrictions
- **OR/CR**: Vehicle ownership documents
- **SELFIE**: pose_hint, lighting_hint

### Admin & QA
- **/admin/kyc**: Queue with Approve/Reject actions
- **/qa/ocr**: Confidence gating tests
- **/qa/kyc-admin**: Admin workflow tests

### Environment
```env
VITE_OCR_CONFIDENCE_MIN=0.65
```

---

## spec_id: kanggaxpress-v2.0.0
**Date:** 2025-01-15  
**Section:** Core Application Foundation

### Overview
KanggaXpress is a ride-hailing and delivery platform built with React, TypeScript, Tailwind CSS, and Supabase. The application supports four user roles: passenger, driver, sender, and courier.

### Technology Stack
- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui components
- **Backend:** Supabase (Lovable Cloud)
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL (via Supabase)

### Core User Roles
1. **Passenger** - Book rides, view ride history
2. **Driver** - Accept rides, manage availability, view dashboard
3. **Sender** - Create deliveries, track delivery orders
4. **Courier** - Accept deliveries, manage availability, view dashboard

### Database Schema
- `profiles` - User profiles with role assignment
- `rides` - Ride bookings and history
- `driver_profiles` - Driver-specific information (vehicle, license, availability)
- `delivery_orders` - Delivery requests and tracking
- `courier_profiles` - Courier-specific information (vehicle, license, availability)

### Authentication Flow
- Email/password authentication via Supabase
- Auto-confirm email signups enabled for development
- Role-based redirection after login
- Protected routes based on user role

---

## spec_id: kanggaxpress-v2.0.8
**Date:** 2025-11-14  
**Section:** PWA & Progressive Enhancement

### PWA Implementation
- Web app manifest configured (`public/manifest.json`)
- App icon: `public/kanggaxpress-icon.png` (carabao head on yellow background)
- Favicon configured in `index.html`
- Multiple icon sizes for various devices (192x192, 256x256, 512x512)

### Install Prompt
- Custom PWA install prompt using `beforeinstallprompt` event
- Component: `InstallPromptBanner.tsx`
- Hook: `usePWAInstallPrompt.ts`
- Banner displays at bottom of screen with "Install" and "Maybe later" options
- LocalStorage flag prevents repeated prompts (`pwa-install-dismissed`)
- iOS-specific hint for Safari "Add to Home Screen"
- Only shown when app is installable and not already in standalone mode

### Brand Colors
- **Primary Yellow:** `#FFC727` (45 100% 58%)
- **Dark Brown:** `#4E342E` (16 45% 25%)
- **Background Light:** `#FFF9E6` (48 100% 95%)

---

## spec_id: kanggaxpress-v2.0.10
**Date:** 2025-11-15  
**Section:** Carabao Logo Animation + QA

### Logo Animation
- Global animation styles in `src/styles/animations.css`
- Animation class: `.carabao-anim`
- Keyframes: `carabao-float` (vertical float)
- Default settings:
  - Amplitude: 8px (`--carabao-amplitude`)
  - Duration: 3.4s (`--carabao-duration`)
  - Easing: `cubic-bezier(.45, 0, .55, 1)` (`--carabao-ease`)
- Honors `prefers-reduced-motion` media query
- Applied to `KanggaLogo` component

### QA Page: /qa/hero-anim
- Route: `/qa/hero-anim` (noindex)
- Live preview of animated logo with controls
- Amplitude slider: 2–12 px (default: 8 px)
- Duration slider: 2.8–4.2 s (default: 3.4 s)
- Reduce motion toggle (simulates `prefers-reduced-motion`)
- Reset button to restore defaults
- Current values display

### Logo Text
- Primary: "KanggaXpress" (bold, font-heading)
- Tagline: "Rooted in Tradition" (small, muted)

---

## spec_id: kanggaxpress-v2.1.0
**Date:** 2025-11-15  
**Section:** State Reporting & SOT Compliance

### State Reporting System
Implemented comprehensive state reporting and compliance checking to provide visibility into what's actually implemented vs. what's documented.

#### /qa/state - Project State Dashboard
- **Route:** `/qa/state` (noindex, nofollow)
- **Purpose:** Human-friendly view + machine-readable JSON of project state
- **Tabs:**
  - **Overview Tab:** Categorized tables and badges showing implementation status
  - **JSON Tab:** Read-only textarea with complete state object + "Copy JSON" button
  
#### State Categories Tracked:
1. **Meta Information**
   - App name, version, build timestamp
   - Git commit hash (if available)
   - Base URL (window.location.origin)

2. **Routes**
   - Discovered routes with component names
   - Existence verification (boolean)
   - Covers: passenger, driver, sender, courier, QA, and admin routes

3. **Admin v2** (placeholder for future implementation)
   - Admin system presence
   - Google OAuth status
   - Allowlist configuration (primary email, allowed emails/domains)
   - Admin sections (drivers, riders, trips, deliveries, KYC, finance, etc.)

4. **Onboarding & OCR**
   - Get started route validation
   - Auth tabs presence (Login & Register)
   - OCR enablement status
   - KYC documents table presence
   - OCR confidence threshold setting

5. **Maps Integration**
   - Provider identification (Google/Mapbox/stub)
   - Google Maps API key presence (boolean only, no value)
   - Places/Geometry library load status
   - Reverse geocoding readiness
   - Passenger map render status

6. **Realtime & Presence**
   - Driver presence channel configuration
   - Vehicle marker icons by type

7. **PWA**
   - PWA enablement status
   - Install prompt route
   - Configuration validation

8. **Branding**
   - Carabao animation class presence
   - Footer admin link status

9. **Environment Variables**
   - Presence-only checks (boolean) for:
     - Supabase URL & anon key
     - Google Maps key
     - Mapbox token
   - **CRITICAL:** No actual secret values exposed

#### /qa/sot - SOT Compliance Checker
- **Route:** `/qa/sot` (noindex, nofollow)
- **Purpose:** Compare SOT documentation claims vs. actual implementation
- **Features:**
  - Summary cards showing PASS/FAIL/UNKNOWN counts
  - Compliance table with:
    - Item description
    - SOT version claim
    - Status badge (PASS/FAIL/UNKNOWN)
    - Notes explaining status
  - Real-time validation against current codebase
  - Automatic detection of:
    - Route existence
    - Feature implementation
    - Configuration completeness

#### State Snapshot Generation
- **Utility:** `src/lib/stateSnapshot.ts`
- **Function:** `generateStateMarkdown()`
- **Output:** Markdown document with:
  - Timestamp and version metadata
  - Route tables with existence status
  - Admin configuration status
  - Maps/OCR/PWA implementation details
  - Fenced JSON code block with complete state
- **Filename format:** `docs/state-report-YYYYMMDD.md`
- **Purpose:** Auditable snapshots of project state over time

#### Implementation Files
- `src/lib/stateCollector.ts` - Core state collection logic
- `src/lib/stateSnapshot.ts` - Markdown generation
- `src/pages/qa/QAState.tsx` - State dashboard UI
- `src/pages/qa/QASOT.tsx` - SOT compliance checker UI

#### Security
- All secret values are replaced with boolean presence checks
- No API keys, tokens, or credentials exposed in any output
- Noindex/nofollow meta tags on all QA pages
- State JSON is safe to copy and share

#### Access Points
- Direct navigation to `/qa/state` or `/qa/sot`
- Future: "View Project State" link in settings/error banners

---

---

## spec_id: kanggaxpress-v2.3.1
**Date:** 2025-11-15  
**Section:** Phase 1 — Routing & Choose Role

### Choose Role Flow
- Landing "Get Started" button navigates to `/choose-role` using `navigate()` with 400ms fallback to `window.location.href`
- `/choose-role` page displays three role cards: Passenger, Driver, Courier
- Each card links to `/auth?role={passenger|driver|courier}`
- Alternative "Sender" link available at bottom

### Auth Interstitial
- Route: `/auth` with role-aware tabs (Login | Register)
- Role selector allows switching between passenger, driver, courier, sender
- Role updates URL query parameter
- Login tab: email/password with show/hide toggle, "Forgot password?" placeholder
- Register tab: minimal fields (name, email, phone, password) with role-specific context
- Post-login routing:
  - passenger → `/passenger/book-ride`
  - driver → `/driver/dashboard`
  - courier → `/courier/dashboard`
  - sender → `/sender/dashboard`

### Legacy Route Redirects
- `/login` → client redirect to `/auth` (preserves role param)
- `/signup` → client redirect to `/auth` (preserves role param)

### PWA Install Prompt
- Deferred to `/choose-role` page only
- Shows ≥800ms post-render for non-blocking UX
- Respects `pwa-install-dismissed` localStorage flag

### QA Page
- Route: `/qa/routing-phase1` (noindex, nofollow)
- Displays PASS/FAIL status for all Phase 1 requirements
- Manual test links for CTA, role cards, and legacy redirects

---

## spec_id: kanggaxpress-v2.3.2
**Date:** 2025-11-15  
**Section:** Phase 2 — Admin v2 + Pricing

### Admin Authentication
- Password-only admin sign-in at `/admin-sign-in` (NO Google button)
- Role-based access control using `kx_admin` role in `user_roles` table
- Security definer function `has_role()` prevents RLS recursion
- Allowlist gating based on environment variables:
  - `VITE_ADMIN_PRIMARY_EMAIL` (primary admin email)
  - `ADMIN_ALLOWED_EMAILS` (comma-separated list)
  - `ADMIN_ALLOWED_DOMAINS` (comma-separated domains)
- AdminGate component enforces access control
- Post-login redirect to `/admin`

### Admin Dashboard
- Route: `/admin` with nested layout (header + sidebar + outlet)
- All admin routes include `<meta name="robots" content="noindex,nofollow" />`
- Dashboard sections (sidebar navigation):
  - Dashboard (home)
  - Drivers
  - Riders
  - Trips
  - Deliveries
  - **Pricing** (fully implemented)
  - KYC
  - Finance
  - Fare Matrix
  - Promotions
  - Ops
  - Disputes
  - Audit
  - Settings

### Pricing Page
- Route: `/admin/pricing` (protected by AdminGate)
- Region selector (default: CALAPAN)
- Service tabs: TRICYCLE | MOTORCYCLE | CAR | SEND_PACKAGE
- Configuration fields per service/region:
  - Base Fare (PHP)
  - Per-KM Rate (PHP/km)
  - Per-Minute Rate (PHP/min)
  - Minimum Fare (PHP)
  - Application Use Rate:
    - Type: FLAT (₱) | PCT (%)
    - Value: number
- Live Preview panel:
  - Input: distance (km), time (minutes)
  - Output: Estimated Fare, Platform Fee, Driver Take
- Save button upserts to `fare_configs` table

### Database Schema
- **user_roles table:**
  - Columns: id, user_id (FK to auth.users), role (app_role enum), created_at
  - Unique constraint on (user_id, role)
  - RLS: Users view own roles; admins manage all
- **fare_configs table:**
  - Columns: id, region_code, service_type, base_fare, per_km, per_min, min_fare, platform_fee_type, platform_fee_value, updated_by, updated_at
  - Unique constraint on (region_code, service_type)
  - RLS: Anyone can view; admins can manage
  - Trigger: auto-update updated_at and updated_by
  - Default configs inserted for CALAPAN region

### Fare Estimation Helper
- Function: `estimateFare(config, distance_km, time_min)`
- Located: `src/lib/fareEstimator.ts`
- Logic:
  - subtotal = base + (per_km × distance) + (per_min × time)
  - Apply min_fare if subtotal < min_fare
  - Platform fee:
    - FLAT: fixed amount
    - PCT: percentage of subtotal (rounded)
  - Driver take = subtotal - platform_fee
- Returns: { subtotal, platformFee, total, driverTake }

### QA Page
- Route: `/qa/admin-smoke` (noindex, nofollow)
- Validates:
  - Admin sign-in page renders (no Google button)
  - Allowlist configuration presence (booleans only)
  - AdminGate blocks non-admin users
  - Pricing page loads and saves configs
  - Preview calculator math is correct
  - All admin routes have noindex meta tags
- Manual test links for sign-in, dashboard, pricing, settings

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v2.0.0 | 2025-01-15 | Core application foundation |
| v2.0.8 | 2025-11-14 | PWA implementation with install prompt |
| v2.0.10 | 2025-11-15 | Carabao logo animation system |
| v2.1.0 | 2025-11-15 | State reporting & SOT compliance |
| v2.3.1 | 2025-11-15 | Phase 1 routing & choose-role flow |
| v2.3.2 | 2025-11-15 | Phase 2 Admin v2 + Pricing |

---

## Maintenance Notes

### Code Organization
- UI components in `src/components/ui/` (shadcn/ui)
- Layout components in `src/components/layout/`
- Page components organized by role in `src/pages/`
- QA pages in `src/pages/qa/`
- Services layer in `src/services/`
- Design system defined in `src/index.css` and `tailwind.config.ts`
- Global animations in `src/styles/animations.css`

### Design System
- All colors use HSL format in CSS variables
- Semantic tokens for foreground, background, primary, secondary, muted, accent
- Typography: Poppins (headings), Inter (body)
- Consistent border radius via `--radius` variable
- Brand colors: Primary Yellow (#FFC727), Dark Brown (#4E342E)

### Best Practices
- Use semantic color tokens, never hardcoded colors
- Keep components small and focused
- Follow role-based routing conventions
- Maintain RLS policies for all database tables
- Document all architectural decisions in this SOT
- Update state reporting system when adding major features
- Run SOT compliance checks after significant changes

---

*This document is the authoritative source for KanggaXpress specifications and should be updated with every significant change to the application.*
