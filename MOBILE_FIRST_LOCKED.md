# 🔒 MOBILE-FIRST DESIGN SYSTEM - LOCKED CONFIGURATION

> **CRITICAL**: This document defines the locked mobile-first design system for KanggaXpress.
> ALL future changes MUST adhere to these guidelines to maintain the mobile user experience.

## 🚨 NON-NEGOTIABLE RULES

### 1. MOBILE-FIRST ALWAYS
- **Design for 360px-414px width FIRST**
- Desktop is enhancement, NOT the baseline
- If it doesn't work on mobile, it doesn't ship

### 2. MINIMUM SIZES (LOCKED)
```css
/* NEVER go below these values */
body font-size: 17px (mobile), 16px (desktop)
Interactive elements: min-height: 48px (mobile)
Input fields: h-14 (56px) on mobile, h-10 (40px) on desktop
Buttons: h-14 (56px) on mobile, h-11 (44px) on desktop
Labels: text-lg (19px) on mobile, text-sm (14px) on desktop
Headings: text-2xl+ on mobile
Tap targets: 48x48px minimum
```

### 3. RESPONSIVE PATTERN (LOCKED)
```tsx
// ALWAYS use this pattern for mobile-first sizing
className="h-14 sm:h-12 md:h-10"           // Heights
className="text-lg sm:text-base md:text-sm" // Text
className="space-y-4 sm:space-y-3"         // Spacing
className="p-5 sm:p-4 md:p-3"              // Padding

// NEVER use desktop-first or mobile-only
❌ className="h-10 max-sm:h-14"  // WRONG
✅ className="h-14 md:h-10"      // CORRECT
```

### 4. CONTRAST & ACCESSIBILITY (LOCKED)
- Text on yellow backgrounds: ALWAYS use `text-foreground` (dark brown)
- Focus states: ALWAYS use `focus:ring-2 focus:ring-primary focus:ring-offset-2`
- Links/buttons: ALWAYS have 48px minimum tap target on mobile
- NEVER disable zoom (`user-scalable=no`)

### 5. PWA REQUIREMENTS (LOCKED)
```html
<!-- NEVER remove or modify these -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#FFC727" />
```

```css
/* NEVER remove safe area support */
#root {
  padding-bottom: env(safe-area-inset-bottom);
}
```

## 📋 COMPONENT CHECKLIST

Before adding/modifying ANY component, verify:

- [ ] All interactive elements are 48px minimum on mobile
- [ ] Text is 17px minimum (uses text-mobile-base or larger)
- [ ] Inputs use `h-14 sm:h-12 md:h-10` pattern
- [ ] Buttons use `h-14 sm:h-12 md:h-11` pattern
- [ ] Labels use `text-lg sm:text-base md:text-sm` pattern
- [ ] Spacing uses mobile-first approach (`space-y-4 sm:space-y-3`)
- [ ] Focus states are visible and properly sized
- [ ] Tested on 360x800 viewport with NO horizontal scroll
- [ ] Text is readable WITHOUT zooming
- [ ] Safe area insets respected (no content hidden by notches)

## 🛡️ PROTECTED FILES

These files contain locked mobile-first configurations:

### src/index.css
```css
/* 🔒 LOCKED: Mobile-first base configuration */
body {
  font-size: 17px;        /* DO NOT REDUCE */
  line-height: 1.6;       /* DO NOT REDUCE */
}

@media (max-width: 768px) {
  button, a[role="button"] {
    min-height: 48px;     /* DO NOT REDUCE */
  }
  
  input, select, textarea {
    min-height: 48px;     /* DO NOT REDUCE */
    font-size: 17px;      /* DO NOT REDUCE - Prevents iOS zoom */
  }
}
```

### tailwind.config.ts
```typescript
fontSize: {
  'mobile-base': ['17px', { lineHeight: '1.5' }],  // 🔒 LOCKED
  'mobile-lg': ['19px', { lineHeight: '1.5' }],    // 🔒 LOCKED
}
```

### public/manifest.json
```json
{
  "display": "standalone",           // 🔒 LOCKED - PWA requirement
  "theme_color": "#FFC727",         // 🔒 LOCKED - Brand color
  "background_color": "#FFF9E6"     // 🔒 LOCKED - Brand color
}
```

## 📱 TESTING REQUIREMENTS

ALL changes must be tested on:

1. **360x800 viewport** (small phone)
   - No horizontal scroll
   - All text readable
   - All buttons tappable

2. **Chrome DevTools Mobile Emulation**
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - Pixel 5 (393x851)

3. **Actual Device** (before production)
   - Test PWA installation
   - Verify safe areas on notched phones
   - Test with system zoom at 150%

## 🚫 COMMON MISTAKES TO AVOID

### ❌ Desktop-First Sizing
```tsx
// WRONG - Desktop first
<Button className="h-10 max-sm:h-14" />

// CORRECT - Mobile first
<Button className="h-14 md:h-10" />
```

### ❌ Fixed Small Sizes
```tsx
// WRONG - Too small for mobile
<input className="h-9 text-sm" />

// CORRECT - Mobile-first sizing
<input className="h-14 sm:h-12 md:h-10 text-mobile-base sm:text-base" />
```

### ❌ Tiny Tap Targets
```tsx
// WRONG - Not tappable on mobile
<button className="p-1">
  <Icon className="w-4 h-4" />
</button>

// CORRECT - Proper tap target
<button className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center">
  <Icon className="w-6 h-6 sm:w-5 sm:h-5" />
</button>
```

### ❌ Removing Safe Areas
```css
/* WRONG - Breaks on notched phones */
#root {
  padding-bottom: 0;
}

/* CORRECT - Respects device safe areas */
#root {
  padding-bottom: env(safe-area-inset-bottom);
}
```

## 🎯 MOBILE-FIRST COMPONENT TEMPLATE

Use this template for all new components:

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function MobileFirstComponent() {
  return (
    <div className="w-full max-w-[420px] mx-auto p-4 space-y-4 sm:space-y-3">
      {/* Heading - Large on mobile */}
      <h2 className="text-2xl sm:text-xl md:text-lg font-bold">
        Component Title
      </h2>
      
      {/* Form field - Mobile-first sizing */}
      <div className="space-y-2 sm:space-y-1">
        <Label className="text-lg sm:text-base md:text-sm">
          Field Label
        </Label>
        <Input 
          className="h-14 sm:h-12 md:h-10 text-mobile-base sm:text-base"
          placeholder="Enter value"
        />
      </div>
      
      {/* Button - Large tap target on mobile */}
      <Button className="w-full h-14 sm:h-12 md:h-11 text-lg sm:text-base font-bold">
        Submit
      </Button>
      
      {/* Link - Proper tap target */}
      <button className="text-base sm:text-sm underline min-h-[48px] px-2 py-2 inline-flex items-center">
        Helper Link
      </button>
    </div>
  );
}
```

## 📚 REFERENCE IMPLEMENTATIONS

Perfect mobile-first examples in the codebase:

1. **src/pages/auth/Auth.tsx** - Login/Register forms
2. **src/index.css** - Global mobile-first CSS
3. **src/components/ocr/OcrCaptureCard.tsx** - Camera button (icon-only, 48px tap target)

## 🔄 WHEN TO UPDATE THIS DOCUMENT

Update this document when:
- Adding new mobile-first patterns
- Discovering mobile UX issues
- Adding new breakpoint requirements
- Expanding PWA features

## ⚠️ ENFORCEMENT

Any PR/change that violates these rules should be:
1. Immediately flagged
2. Revised to meet mobile-first requirements
3. Re-tested on 360x800 viewport
4. Approved only after passing mobile tests

---

**Last Updated**: 2025-11-17  
**Status**: 🔒 LOCKED - Do not modify without mobile testing  
**Owner**: KanggaXpress Development Team
