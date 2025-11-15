# KanggaXpress - Delivery Module Documentation

## Overview

KanggaXpress now includes a complete **Delivery/Courier** module alongside the existing ride-hailing functionality. Both modules share the same branding, authentication system, and architectural patterns.

---

## Database Schema

### New Tables

#### 1. **courier_profiles**
Similar to `driver_profiles` but for delivery couriers.

**Columns:**
- `id` (UUID, primary key)
- `user_id` (UUID, references profiles.id)
- `vehicle_type` (enum: motor, tricycle, car)
- `vehicle_plate` (TEXT)
- `vehicle_model` (TEXT, optional)
- `vehicle_color` (TEXT, optional)
- `license_number` (TEXT, optional)
- `is_available` (BOOLEAN, default: true)
- `rating` (DECIMAL, default: 5.00)
- `total_deliveries` (INTEGER, default: 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Policies:**
- Couriers can view/update their own profile
- Senders can view available couriers

---

#### 2. **delivery_orders**
Stores all delivery requests and their status.

**Columns:**
- `id` (UUID, primary key)
- `sender_id` (UUID, references profiles.id)
- `courier_id` (UUID, references courier_profiles.id, nullable)
- `pickup_address` (TEXT)
- `dropoff_address` (TEXT)
- `package_description` (TEXT)
- `package_size` (enum: small, medium, large)
- `cod_amount` (DECIMAL, nullable) - Cash on Delivery
- `receiver_name` (TEXT)
- `receiver_phone` (TEXT)
- `status` (enum: requested, assigned, picked_up, in_transit, delivered, cancelled)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `assigned_at` (TIMESTAMP, nullable)
- `picked_up_at` (TIMESTAMP, nullable)
- `delivered_at` (TIMESTAMP, nullable)

**RLS Policies:**
- Senders can view their own deliveries
- Couriers can view deliveries assigned to them
- Couriers can view available (unassigned) deliveries
- Senders can create deliveries
- Couriers can update assigned deliveries

---

### Updated Tables

#### **profiles**
Extended `user_role` enum to include:
- `sender` - Users who request deliveries
- `courier` - Users who fulfill deliveries

---

## New Enums

```sql
-- Package sizes
CREATE TYPE package_size AS ENUM ('small', 'medium', 'large');

-- Delivery statuses
CREATE TYPE delivery_status AS ENUM (
  'requested',    -- Awaiting courier
  'assigned',     -- Courier accepted
  'picked_up',    -- Package collected
  'in_transit',   -- On the way
  'delivered',    -- Completed
  'cancelled'     -- Cancelled
);
```

---

## API Services

### 1. **deliveriesService** (`src/services/deliveries.ts`)

#### Methods:

**`createDelivery(senderId, data)`**
- Creates a new delivery request
- Sets status to `requested`
- Returns: DeliveryOrder

**`getSenderDeliveries(senderId)`**
- Lists all deliveries for a sender
- Ordered by creation date (newest first)
- Returns: DeliveryOrder[]

**`getAvailableDeliveries()`**
- Lists unassigned deliveries (for couriers)
- Includes sender profile data
- Returns: DeliveryOrderWithDetails[]

**`getCourierDeliveries(courierId)`**
- Lists deliveries assigned to a courier
- Includes sender profile data
- Returns: DeliveryOrderWithDetails[]

**`acceptDelivery(deliveryId, courierId)`**
- Assigns courier to delivery
- Updates status to `assigned`
- Sets `assigned_at` timestamp
- Returns: DeliveryOrder

**`updateDeliveryStatus(deliveryId, status)`**
- Updates delivery status
- Auto-sets timestamps (picked_up_at, delivered_at)
- Returns: DeliveryOrder

**`cancelDelivery(deliveryId)`**
- Sets status to `cancelled`
- Returns: DeliveryOrder

---

### 2. **couriersService** (`src/services/couriers.ts`)

#### Methods:

**`createCourierProfile(userId, data)`**
- Creates courier profile with vehicle details
- Returns: CourierProfile

**`getCourierProfile(userId)`**
- Fetches courier profile
- Returns: CourierProfile | null

**`updateAvailability(userId, isAvailable)`**
- Toggles courier online/offline status
- Returns: CourierProfile

**`updateCourierProfile(userId, updates)`**
- Updates vehicle/profile details
- Returns: CourierProfile

---

## User Flows

### Sender (Delivery Customer)

1. **Sign Up**
   - Select "Send Packages" role during signup
   - Route: `/signup`

2. **Dashboard**
   - View options: Create Delivery, My Deliveries
   - Route: `/sender/dashboard`

3. **Create Delivery**
   - Enter pickup/dropoff addresses
   - Describe package, select size (small/medium/large)
   - Optional: Add COD amount
   - Enter receiver name and phone
   - Submit → Creates delivery with status `requested`
   - Route: `/sender/create-delivery`

4. **My Deliveries**
   - View all delivery requests
   - Track status changes
   - Route: `/sender/my-deliveries`

---

### Courier (Delivery Provider)

1. **Sign Up**
   - Select "Deliver & Earn" role during signup
   - Route: `/signup`

2. **Setup Profile**
   - Add vehicle details (type, plate, model, color, license)
   - Route: `/courier/setup`

3. **Dashboard**
   - Toggle availability (online/offline)
   - View current delivery (if active)
   - View available deliveries (if online)
   - View delivery history
   - Route: `/courier/dashboard`

4. **Accept Delivery**
   - Click "Accept Delivery" on available delivery
   - Status changes: `requested` → `assigned`

5. **Update Status**
   - **Assigned** → "Mark as Picked Up" → `picked_up`
   - **Picked Up** → "Start Delivery" → `in_transit`
   - **In Transit** → "Mark as Delivered" → `delivered`
   - Can cancel at any stage

---

## Navigation & Role Handling

### Role-Based Redirects

After login/signup, users are redirected based on role:

| Role       | Redirect To                  |
|------------|------------------------------|
| passenger  | `/passenger/book-ride`       |
| driver     | `/driver/dashboard`          |
| sender     | `/sender/dashboard`          |
| courier    | `/courier/dashboard`         |

### Mode Switching

The `ModeSwitcher` component (currently basic) is ready for future expansion to allow users with multiple roles to switch between Rides and Deliveries modes.

---

## Routes

### Sender Routes
- `/sender/dashboard` - Main dashboard
- `/sender/create-delivery` - Create new delivery request
- `/sender/my-deliveries` - View delivery history

### Courier Routes
- `/courier/dashboard` - Main dashboard (available/active deliveries)
- `/courier/setup` - Complete courier profile

### Existing Ride Routes (Unchanged)
- `/passenger/book-ride` - Book a ride
- `/passenger/my-rides` - View ride history
- `/driver/dashboard` - Driver dashboard
- `/driver/setup` - Complete driver profile

---

## Package Pricing

| Size   | Weight      | Base Fee |
|--------|-------------|----------|
| Small  | Up to 5kg   | ₱80      |
| Medium | 5-15kg      | ₱120     |
| Large  | 15-30kg     | ₱180     |

---

## Key Features

### Cash on Delivery (COD)
- Senders can specify COD amount
- Displayed to couriers when accepting
- Courier collects cash from receiver
- Tracked separately from delivery fee

### Real-Time Status Tracking
Delivery statuses:
1. **Requested** - Awaiting courier
2. **Assigned** - Courier accepted
3. **Picked Up** - Package collected from sender
4. **In Transit** - On the way to receiver
5. **Delivered** - Successfully completed
6. **Cancelled** - Cancelled by sender or courier

---

## Future Integrations

The architecture is ready for:

**Maps API** (KANGGA_MAPS_API_KEY)
- Location autocomplete
- Route optimization
- Live courier tracking

**SMS/OTP** (KANGGA_SMS_API_KEY)
- Delivery notifications
- Receiver alerts
- OTP verification

**E-Wallet/Payments** (KANGGA_EWALLET_API_KEY)
- Online COD settlements
- Delivery fee payments
- Courier earnings

---

## Security

### Row-Level Security (RLS)

**All tables have RLS enabled:**

1. **courier_profiles**
   - Couriers can only see/edit their own profile
   - Senders can view available couriers

2. **delivery_orders**
   - Senders can only see their own deliveries
   - Couriers can only see:
     - Deliveries assigned to them
     - Available (unassigned) deliveries
   - Only assigned couriers can update status

---

## React Native Compatibility

All delivery APIs follow the same pattern as ride-hailing APIs:

**Authentication:**
- Same Supabase auth system
- JWT tokens work across all endpoints

**API Calls:**
- All services use Supabase client
- Can be called from React Native with same auth context

**Example React Native Usage:**
```javascript
// In React Native app
import { supabase } from './supabase-client';

// Create delivery (sender)
const { data, error } = await supabase
  .from('delivery_orders')
  .insert({
    sender_id: userId,
    pickup_address: '123 Main St',
    dropoff_address: '456 Oak Ave',
    // ... other fields
  });

// Get available deliveries (courier)
const { data, error } = await supabase
  .from('delivery_orders')
  .select('*, sender:profiles(*)')
  .eq('status', 'requested')
  .is('courier_id', null);
```

---

## Testing the Delivery Module

1. **Create Sender Account**
   - Go to `/signup`
   - Select "Send Packages"
   - Complete registration

2. **Create Delivery**
   - Navigate to `/sender/create-delivery`
   - Fill in all details
   - Submit delivery request

3. **Create Courier Account**
   - Sign out
   - Go to `/signup`
   - Select "Deliver & Earn"
   - Complete registration
   - Set up courier profile

4. **Accept & Complete Delivery**
   - Toggle availability ON
   - See delivery in "Available Deliveries"
   - Click "Accept Delivery"
   - Update status through delivery lifecycle

---

## What's NOT Broken

✅ **All ride-hailing features remain fully functional:**
- Passenger booking rides
- Driver accepting rides
- Ride status updates
- All existing pages and flows

✅ **Shared components work for both modules:**
- Authentication
- Header/Layout
- Theme & branding
- All UI components

---

## Customization

### Update Delivery Pricing
Edit `src/pages/sender/CreateDelivery.tsx`:
```typescript
const packageSizes = [
  { size: 'small', name: 'Small', description: 'Up to 5kg', price: 80 },
  { size: 'medium', name: 'Medium', description: '5-15kg', price: 120 },
  { size: 'large', name: 'Large', description: '15-30kg', price: 180 },
];
```

### Add New Package Size
```sql
ALTER TYPE package_size ADD VALUE 'extra_large';
```

### Modify Status Flow
Edit status enums in database and update frontend status labels in dashboard components.

---

## Summary

The KanggaXpress Delivery module is now fully integrated with:
- ✅ Complete database schema with RLS
- ✅ Full sender & courier workflows
- ✅ All CRUD operations via services
- ✅ Role-based routing & auth
- ✅ Consistent UI/UX with ride-hailing
- ✅ Ready for React Native integration
- ✅ Existing ride features unaffected
