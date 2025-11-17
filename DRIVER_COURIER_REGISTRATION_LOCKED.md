# 🔒 DRIVER & COURIER REGISTRATION - LOCKED CONFIGURATION

**Status**: LOCKED ✅  
**Last Updated**: 2025-11-17  
**DO NOT MODIFY** without updating this document

---

## Overview

Driver and Courier registration in `/auth?role=driver` and `/auth?role=courier` uses a comprehensive form with photo capture for all required documents. **NO OCR processing** - photos are uploaded for manual admin review.

---

## Required Fields

### Personal Information
- First Name *
- Middle Name *
- Last Name *
- Birthdate *
- Personal Mobile Number *

### Emergency Contact
- Emergency Contact Name *
- Relation *
- Emergency Contact Number *

### Address
- Complete Address *

### Vehicle Information
- Vehicle Color *
- Plate Number *
- Driver's License Expiry Date *
- CR (Certificate of Registration) Expiry Date *

### Account
- Email *
- Password *
- Confirm Password *

### Privacy
- Data Privacy Consent (checkbox) *

---

## Required Document Photos

All document photos are captured using **PhotoCaptureCard** (NOT OcrCaptureCard).

### Required Photos:
1. **Driver's License** (`DRIVER_LICENSE`)
   - Stored with vehicle info in parsed field
   
2. **Official Receipt (OR)** (`OR`)
   - Vehicle OR document photo
   
3. **Certificate of Registration (CR)** (`CR`)
   - Vehicle CR document photo
   - Expiry date stored in parsed field
   
4. **Selfie Photo** (`SELFIE`)
   - User holding driver's license

---

## Technical Implementation

### State Management
```typescript
const [driverData, setDriverData] = useState({
  email: '',
  password: '',
  passwordConfirm: '',
  firstName: '',
  middleName: '',
  lastName: '',
  birthdate: '',
  personalMobile: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContact: '',
  completeAddress: '',
  vehicleColor: '',
  vehiclePlate: '',
  licenseExpiry: '',
  crExpiry: '',
  privacyConsent: false,
});

const [driverPhotosStaged, setDriverPhotosStaged] = useState<PhotoStaged[]>([]);
```

### Photo Upload Structure
```typescript
// Driver's License - includes vehicle info
{
  user_id: userId,
  doc_type: 'DRIVER_LICENSE',
  parsed: {
    vehicle_color: driverData.vehicleColor,
    plate_no: driverData.vehiclePlate,
    expiry_date: driverData.licenseExpiry,
  },
  confidence: 1.0, // Always 1.0 - no OCR
  status: 'PENDING',
  image_path: imagePath,
}

// CR - includes expiry date
{
  user_id: userId,
  doc_type: 'CR',
  parsed: {
    expiry_date: driverData.crExpiry,
  },
  confidence: 1.0,
  status: 'PENDING',
  image_path: imagePath,
}

// OR - simple photo
{
  user_id: userId,
  doc_type: 'OR',
  parsed: {},
  confidence: 1.0,
  status: 'PENDING',
  image_path: imagePath,
}

// Selfie - simple photo
{
  user_id: userId,
  doc_type: 'SELFIE',
  parsed: {},
  confidence: 1.0,
  status: 'PENDING',
  image_path: imagePath,
}
```

---

## Validation Schema

```typescript
const driverSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  passwordConfirm: z.string().min(6, 'Password confirmation required'),
  firstName: z.string().min(1, 'First name required'),
  middleName: z.string().min(1, 'Middle name required'),
  lastName: z.string().min(1, 'Last name required'),
  birthdate: z.string().min(1, 'Birthdate required'),
  personalMobile: z.string().min(10, 'Valid mobile number required'),
  emergencyContactName: z.string().min(2, 'Emergency contact name required'),
  emergencyContactRelation: z.string().min(2, 'Relationship required'),
  emergencyContact: z.string().min(10, 'Valid emergency contact required'),
  completeAddress: z.string().min(5, 'Complete address required'),
  vehicleColor: z.string().min(2, 'Vehicle color required'),
  vehiclePlate: z.string().min(2, 'Plate number required'),
  licenseExpiry: z.string().min(1, 'License expiry date required'),
  crExpiry: z.string().min(1, 'CR expiry date required'),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the data privacy policy',
  }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ['passwordConfirm'],
});
```

---

## Photo Validation

Before submission, verify all 4 required photos are captured:
```typescript
const hasLicense = driverPhotosStaged.some(p => p.docType === 'DRIVER_LICENSE');
const hasOR = driverPhotosStaged.some(p => p.docType === 'OR');
const hasCR = driverPhotosStaged.some(p => p.docType === 'CR');
const hasSelfie = driverPhotosStaged.some(p => p.docType === 'SELFIE');

if (!hasLicense || !hasOR || !hasCR || !hasSelfie) {
  // Show error
  return;
}
```

---

## CRITICAL RULES - DO NOT VIOLATE

### ❌ FORBIDDEN:
- **NO OCR processing** - use PhotoCaptureCard only
- **NO OcrCaptureCard** component
- **NO text recognition** or document parsing
- **NO OCR error handling** or retry logic
- **NO removing** required fields (expiry dates, vehicle info)
- **NO removing** required photos (all 4 must be uploaded)
- **NO modifying** photo upload structure

### ✅ REQUIRED:
- **USE PhotoCaptureCard** for all photo captures
- **ALWAYS store** confidence: 1.0 (no OCR)
- **ALWAYS store** status: 'PENDING'
- **VALIDATE all 4 photos** before submission
- **STORE vehicle info** in DRIVER_LICENSE parsed field
- **STORE CR expiry** in CR parsed field
- **INCLUDE expiry dates** in form fields

---

## Testing Checklist

Before deploying changes:
- [ ] All 4 photo capture cards visible
- [ ] All form fields present (vehicle color, plate, expiry dates)
- [ ] Form validation works for all fields
- [ ] Photo validation requires all 4 photos
- [ ] Photos upload without OCR processing
- [ ] Vehicle info stored in DRIVER_LICENSE document
- [ ] CR expiry stored in CR document
- [ ] Confirmation message shows after successful registration
- [ ] Works for both driver and courier roles

---

## Quick Verification Commands

Check for forbidden OCR usage:
```bash
# Should return NO results
grep -r "OcrCaptureCard" src/pages/auth/
grep -r "ocrProvider" src/pages/auth/
grep -r "OCR failed" src/pages/auth/
```

Verify photo capture components:
```bash
# Should show 4 PhotoCaptureCard components for driver/courier
grep -A2 "PhotoCaptureCard" src/pages/auth/Auth.tsx | grep -E "(DRIVER_LICENSE|OR|CR|SELFIE)"
```

---

## Related Documents
- `PHOTO_CAPTURE_LOCKED.md` - General photo capture guidelines
- `LOCKED_CONFIGURATIONS.md` - Master lock registry
- `src/pages/auth/Auth.tsx` - Implementation file

---

**Remember**: This is a LOCKED configuration. Any changes must be documented here first and approved.
