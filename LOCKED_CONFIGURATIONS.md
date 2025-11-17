# 🔒 LOCKED CONFIGURATIONS SUMMARY

This document provides a quick reference to all locked configurations in KanggaXpress.

## 🚨 CRITICAL LOCKED SYSTEMS

### 1. 📱 Mobile-First Design System
**Document**: `MOBILE_FIRST_LOCKED.md`  
**Rules File**: `.mobile-first-rules`

**Key Rules:**
- Body font: 17px minimum (mobile), 16px (desktop)
- Tap targets: 48px minimum on mobile
- Input heights: h-14 (mobile), h-10 (desktop)
- Button heights: h-14 (mobile), h-11 (desktop)
- Labels: text-lg (mobile), text-sm (desktop)
- Pattern: Mobile-first sizing (e.g., `h-14 md:h-10`)
- PWA safe areas: `padding-bottom: env(safe-area-inset-bottom)`

**Protected Files:**
- `src/index.css` (🔒 base configuration)
- `tailwind.config.ts` (🔒 mobile font sizes)
- `public/manifest.json` (🔒 PWA config)
- `index.html` (🔒 viewport meta)

**Violations:**
- ❌ Desktop-first sizing (`h-10 max-md:h-14`)
- ❌ Small fonts below 17px on mobile
- ❌ Tap targets below 48px
- ❌ Removing safe area insets

---

### 2. 📸 Photo Capture (No OCR)
**Document**: `PHOTO_CAPTURE_LOCKED.md`  
**Rules File**: `.photo-capture-rules`

**Key Rules:**
- Identity Verification uses simple photo capture ONLY
- NO OCR processing, text recognition, or document parsing
- Use `PhotoCaptureCard` component (NOT `OcrCaptureCard`)
- Photos stored with `parsed: {}` (empty)
- Always `confidence: 1.0` (no OCR confidence)
- Simple messages: "Photo Captured" (NO "OCR failed")

**Protected Files:**
- `src/pages/auth/Auth.tsx` (🔒 photo capture section)
- `src/components/PhotoCaptureCard.tsx` (🔒 simple capture component)

**Violations:**
- ❌ Adding OCR imports (`OcrCaptureCard`, `performOcr`)
- ❌ Adding OCR processing logic
- ❌ Adding auto-fill from document scanning
- ❌ Adding OCR error messages
- ❌ Adding confidence calculations

---

### 3. 🚗 Driver & Courier Registration
**Document**: `DRIVER_COURIER_REGISTRATION_LOCKED.md`

**Key Rules:**
- Comprehensive registration with vehicle documentation
- Required fields: vehicle color, plate, license expiry, CR expiry
- Required photos: Driver's License, OR, CR, Selfie (4 total)
- NO OCR - uses `PhotoCaptureCard` only
- Vehicle info stored in DRIVER_LICENSE parsed field
- CR expiry stored in CR parsed field

**Protected Files:**
- `src/pages/auth/Auth.tsx` (🔒 driver/courier registration section)

**Violations:**
- ❌ Removing expiry date fields
- ❌ Removing any of the 4 required photos
- ❌ Removing vehicle information fields
- ❌ Adding OCR processing

---

## 📋 QUICK CHECK BEFORE CHANGES

### Mobile-First Check:
```bash
# Check for desktop-first patterns
grep -r "max-sm:" src/ | grep -E "h-|text-"
# Should return minimal results

# Check for small fonts
grep -r "text-xs" src/pages/auth/
# Should only be in specific places, not primary text

# Check for small tap targets
grep -r "h-\[1-8\]" src/pages/auth/
# Should return minimal results
```

### Photo Capture Check:
```bash
# Check for OCR imports
grep -r "OcrCaptureCard\|performOcr\|ocrProvider" src/pages/auth/
# Should return 0 results

# Check for PhotoCaptureCard usage
grep "PhotoCaptureCard" src/pages/auth/Auth.tsx
# Should return 2+ results (ID + Selfie)

# Check for OCR messages
grep -r "OCR failed\|Processing document" src/pages/auth/
# Should return 0 results
```

## 🛡️ PROTECTED CODE PATTERNS

### Mobile-First Pattern:
```tsx
// ✅ CORRECT
<Input className="h-14 sm:h-12 md:h-10 text-mobile-base sm:text-base" />
<Button className="h-14 md:h-11 text-lg sm:text-base" />
<Label className="text-lg sm:text-base md:text-sm" />

// ❌ WRONG
<Input className="h-10 max-md:h-14" />
<Button className="text-sm" />
<Label className="text-xs" />
```

### Photo Capture Pattern:
```tsx
// ✅ CORRECT
import { PhotoCaptureCard } from '@/components/PhotoCaptureCard';

const handlePhotoCapture = (docType: DocType) => (imageBlob: Blob, imageUrl: string) => {
  setPhotosStaged(prev => [...prev.filter(p => p.docType !== docType), {
    docType, imageBlob, imageUrl
  }]);
  toast.success('Photo saved');
};

<PhotoCaptureCard
  title="Government ID"
  onCapture={handlePhotoCapture('GOVT_ID')}
/>

// ❌ WRONG
import { OcrCaptureCard } from '@/components/ocr/OcrCaptureCard';
const result = await performOcr(image);
```

## 📚 DOCUMENTATION STRUCTURE

```
KanggaXpress/
├── MOBILE_FIRST_LOCKED.md          ← Mobile-first guidelines
├── PHOTO_CAPTURE_LOCKED.md         ← No-OCR photo capture
├── LOCKED_CONFIGURATIONS.md        ← This summary
├── .mobile-first-rules             ← Mobile-first checks
├── .photo-capture-rules            ← Photo capture checks
├── docs/
│   ├── NO_OCR_IDENTITY_VERIFICATION.md  ← OCR removal changelog
│   └── MOBILE_FIRST_IMPROVEMENTS.md     ← Mobile improvements changelog
└── src/
    ├── index.css                   ← 🔒 Mobile-first CSS
    ├── components/
    │   ├── README-MOBILE-FIRST.md  ← Component template
    │   └── PhotoCaptureCard.tsx    ← 🔒 Simple photo capture
    └── pages/auth/Auth.tsx         ← 🔒 Both systems protected
```

## ⚠️ ENFORCEMENT

### Mobile-First Violations:
1. Run checks in `.mobile-first-rules`
2. Test on 360x800 viewport
3. Verify no horizontal scroll
4. Check all tap targets are 48px minimum
5. Reject if violations found

### Photo Capture Violations:
1. Run checks in `.photo-capture-rules`
2. Test photo capture (no OCR errors should appear)
3. Verify PhotoCaptureCard usage
4. Check for OCR imports/calls
5. Reject if violations found

## 🔄 UPDATE PROCESS

When adding new locked configurations:

1. Create main guidelines document (`*_LOCKED.md`)
2. Create enforcement rules file (`.* -rules`)
3. Add 🔒 comments in protected code
4. Update this summary document
5. Test enforcement checks
6. Document in changelog

## 📱 TESTING CHECKLIST

Before approving ANY changes:

**Mobile-First:**
- [ ] Tested on 360x800 viewport
- [ ] No horizontal scroll
- [ ] All text readable without zoom
- [ ] All buttons easily tappable (48px+)
- [ ] PWA installable on mobile

**Photo Capture:**
- [ ] No OCR imports in code
- [ ] No OCR function calls
- [ ] No OCR error messages
- [ ] Photo capture works on mobile
- [ ] Simple success messages only
- [ ] Registration completes successfully

## 🎯 WHY THESE ARE LOCKED

### Mobile-First:
- **Problem**: Users complained about tiny text, small buttons, poor mobile experience
- **Solution**: Lock minimum sizes, mobile-first approach, PWA features
- **Benefit**: App feels like native mobile app, accessible for older users

### No OCR:
- **Problem**: OCR caused errors ("OCR failed"), slow processing, complexity
- **Solution**: Lock photo-only capture, no text recognition
- **Benefit**: Simple, fast, reliable photo upload, better UX

## 📞 SUPPORT

When in doubt:
1. Read the relevant `*_LOCKED.md` document
2. Check the `.* -rules` enforcement file
3. Look at protected code examples
4. Run automated checks
5. Test on actual devices

---

**Last Updated**: 2025-11-17  
**Status**: 🔒 ACTIVE - All locks enforced  
**Owner**: KanggaXpress Development Team

**Remember**: These locks exist to protect user experience. Don't bypass them without thorough testing and documentation of why the change is necessary.
