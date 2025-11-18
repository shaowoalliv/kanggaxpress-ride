# 🔒 LOCKED CONFIGURATION: /passenger/book-ride

**Status:** LOCKED  
**File:** `src/pages/passenger/BookRide.tsx`  
**Last Updated:** 2025-11-18

---

## Overview

The `/passenger/book-ride` route is configured as a **canonical mobile-first ride home screen** similar to Grab/Uber. This layout is **LOCKED** and must NOT be restructured without explicit user approval.

---

## Locked Layout Structure (Top to Bottom)

### 1. Top App Bar
- **Source:** Via `PageLayout` component
- **Left:** Hamburger menu icon
- **Right:** Profile and notifications icons
- **Background:** KanggaXpress yellow (`bg-primary`)
- **Position:** Sticky to top

### 2. Greeting + Location
- **Greeting text:** "Good {Morning/Afternoon/Evening}, {firstName}!"
- **Fallback:** "Good Day, User!" if no profile name
- **Location:** GPS or stored address with 📍 icon
- **Fallback text:** "📍 Set your pickup location"

### 3. Destination Search Bar
- **Style:** Full-width rounded card, white background
- **Icon:** Search icon on left
- **Placeholder:** "Where are you heading?"
- **Functionality:** Uses existing destination search logic

### 4. Recent Searches Section
- **Title:** "Recent Searches"
- **Card content:**
  - Shows most recent destination
  - Shows pickup address on second line
  - If empty: "No recent searches yet..." message
- **Storage:** localStorage (`kanggaxpress_recent_searches`)
- **Limit:** Stores last 5 searches

### 5. Quick Access Buttons
- **Title:** "Quick Access"
- **Layout:** 4 circular buttons in a row
- **Buttons:**
  1. Home (Home icon)
  2. Office (Building2 icon)
  3. Market (ShoppingCart icon)
  4. Terminal (MapPinned icon)
- **Style:** White circles with subtle shadow, dark icons
- **Behavior:** Toast notification (feature coming soon)

### 6. All Kanggaxpress Services Grid 🔒 **LOCKED**
- **Title:** "All Kanggaxpress Services"
- **Layout:** 2x2 grid
- **Services (in order):**

  1. **Car**
     - Icon: `car-icon.png` (custom PNG)
     - Base Fare: ₱80
     - Type: `car`

  2. **Motorcycle**
     - Icon: `motorcycle-icon.png` (custom PNG)
     - Base Fare: ₱40
     - Type: `motor`

  3. **Tricycle**
     - Icon: `tricycle-icon.png` (custom PNG)
     - Base Fare: ₱50
     - Type: `tricycle`

  4. **Send Package**
     - Icon: `courier-icon.png` (custom PNG)
     - Base Fare: ₱45
     - Type: `package`
     - Special: Redirects to `/sender/dashboard`

- **Card Structure:**
  - Centered icon container (16x16, object-contain)
  - Service name text
  - Base fare (₱XX format)
  - White rounded rectangle with shadow
  - Equal spacing and height

- **Behavior:**
  - Clicking "Send Package" → Navigate to `/sender/dashboard`
  - Clicking other services → Scroll to booking form
  - All cards have hover/active states

### 7. Booking Form (Conditional)
- **Visibility:** Only shown when a service is selected (not "Send Package")
- **Fields:**
  - Pickup Location (text input)
  - Number of Passengers (number input, 1-8)
  - Notes (optional textarea)
  - Estimated Fare (read-only display)
- **Submit:** "Request Ride" button
- **Action:** Creates ride, saves to recent searches, navigates to `/passenger/my-rides`

---

## 🔒 Critical Lock Rules

### DO NOT:
1. ❌ Reorder sections (must stay in exact sequence 1-7)
2. ❌ Remove or add sections between the locked structure
3. ❌ Change service order in the grid (Car, Motorcycle, Tricycle, Send Package)
4. ❌ Modify service icons (must use custom PNGs from `src/assets/`)
5. ❌ Change service names or base fares
6. ❌ Alter the 2x2 grid layout
7. ❌ Remove icon aspect ratio preservation (`object-contain`)
8. ❌ Change "Send Package" redirect behavior

### You MAY:
- ✅ Add behavior BEHIND the existing layout (e.g., GPS integration, fare calculation)
- ✅ Enhance existing functionality without changing UI structure
- ✅ Fix bugs that don't alter the locked layout
- ✅ Add new features in the booking form section (Section 7)

---

## Technical Implementation

### Services Array Location
```typescript
// src/pages/passenger/BookRide.tsx (lines ~31-51)
const services: Array<{ type: RideType | 'package'; name: string; icon: string; baseFare: number; isPackage?: boolean }> = [
  { type: 'car' as RideType, name: 'Car', icon: carIcon, baseFare: 80 },
  { type: 'motor' as RideType, name: 'Motorcycle', icon: motorcycleIcon, baseFare: 40 },
  { type: 'tricycle' as RideType, name: 'Tricycle', icon: tricycleIcon, baseFare: 50 },
  { type: 'package', name: 'Send Package', icon: courierIcon, baseFare: 45, isPackage: true },
];
```

### Icon Files
- `src/assets/car-icon.png`
- `src/assets/motorcycle-icon.png`
- `src/assets/tricycle-icon.png`
- `src/assets/courier-icon.png`

### State Management
- `destination` - User-entered destination
- `pickup` - User-entered pickup location
- `selectedType` - Selected ride type (RideType | null)
- `recentSearches` - Array stored in localStorage

---

## Testing Checklist

When making any changes near locked sections, verify:
- [ ] All 7 sections render in correct order
- [ ] Service grid shows exactly 4 cards in 2x2 layout
- [ ] Custom PNG icons display properly (no stretching)
- [ ] Base fares match locked values (80, 40, 50, 45)
- [ ] "Send Package" redirects to `/sender/dashboard`
- [ ] Other services scroll to booking form
- [ ] Recent searches persist across sessions
- [ ] Greeting changes based on time of day

---

## Related Lock Files
- `DRIVER_COURIER_REGISTRATION_LOCKED.md` - Driver/Courier registration
- `LOCKED_CONFIGURATIONS.md` - Master lock registry

---

**⚠️ IMPORTANT:** Any modification to locked sections requires explicit user approval. When in doubt, ask before making changes.
