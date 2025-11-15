# KanggaXpress Source of Truth (SOT)

This document serves as the authoritative Source of Truth for the KanggaXpress application, tracking all implemented features, specifications, and architectural decisions.

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

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v2.0.0 | 2025-01-15 | Core application foundation |
| v2.0.8 | 2025-11-14 | PWA implementation with install prompt |
| v2.0.10 | 2025-11-15 | Carabao logo animation system |
| v2.1.0 | 2025-11-15 | State reporting & SOT compliance |
| v2.3.1 | 2025-11-15 | Phase 1 routing & choose-role flow |

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
