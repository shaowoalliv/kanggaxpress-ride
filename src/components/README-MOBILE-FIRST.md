# Component Development - Mobile-First Guidelines

## 🚨 BEFORE Creating Any Component

1. Read: `MOBILE_FIRST_LOCKED.md` in project root
2. Use: Template below
3. Test: On 360x800 viewport

## ✅ Component Template

```tsx
/**
 * 🔒 MOBILE-FIRST COMPONENT
 * 
 * This component follows KanggaXpress mobile-first guidelines.
 * DO NOT reduce sizes below mobile minimums.
 * See: MOBILE_FIRST_LOCKED.md
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MyComponentProps {
  // Props
}

export function MyComponent({ ...props }: MyComponentProps) {
  return (
    {/* 🔒 Container: max-w-[420px] for mobile optimization */}
    <div className="w-full max-w-[420px] mx-auto p-4 space-y-4 sm:space-y-3">
      
      {/* 🔒 Heading: Large on mobile (text-2xl), smaller on desktop */}
      <h2 className="text-2xl sm:text-xl md:text-lg font-bold text-foreground">
        My Component
      </h2>
      
      {/* 🔒 Form Field: Mobile-first sizing pattern */}
      <div className="space-y-2 sm:space-y-1">
        <Label 
          htmlFor="my-input"
          className="text-lg sm:text-base md:text-sm font-medium"
        >
          Field Label
        </Label>
        <Input
          id="my-input"
          className="h-14 sm:h-12 md:h-10 text-mobile-base sm:text-base bg-white"
          placeholder="Enter value"
        />
      </div>
      
      {/* 🔒 Primary Button: Large tap target on mobile */}
      <Button 
        className="w-full h-14 sm:h-12 md:h-11 text-lg sm:text-base font-bold"
        variant="secondary"
      >
        Submit
      </Button>
      
      {/* 🔒 Text Link: Minimum 48px tap target on mobile */}
      <button 
        type="button"
        className="text-base sm:text-sm text-foreground hover:text-primary underline min-h-[48px] px-2 py-2 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
      >
        Helper Link
      </button>
      
      {/* 🔒 Icon Button: Proper tap target */}
      <button
        type="button"
        aria-label="Action"
        className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <Icon className="w-6 h-6 sm:w-5 sm:h-5" />
        <span className="sr-only">Action Description</span>
      </button>
      
    </div>
  );
}
```

## 📋 Component Checklist

Before marking component complete:

- [ ] All text is 17px+ on mobile (use `text-mobile-base` or larger)
- [ ] All inputs are `h-14 sm:h-12 md:h-10`
- [ ] All buttons are `h-14 sm:h-12 md:h-11`
- [ ] All labels are `text-lg sm:text-base md:text-sm`
- [ ] All interactive elements have 48px minimum tap target
- [ ] All spacing uses mobile-first (`space-y-4 sm:space-y-3`)
- [ ] Focus states are visible (`focus:ring-2 focus:ring-primary`)
- [ ] Tested on 360x800 viewport with NO horizontal scroll
- [ ] Text is readable WITHOUT zooming
- [ ] Works with browser zoom at 150%

## 🚫 Common Mistakes

### ❌ Wrong: Desktop-first
```tsx
<Button className="h-10 max-sm:h-14" />
```

### ✅ Correct: Mobile-first
```tsx
<Button className="h-14 md:h-10" />
```

### ❌ Wrong: Too small
```tsx
<input className="h-9 text-sm" />
```

### ✅ Correct: Mobile-optimized
```tsx
<input className="h-14 sm:h-12 md:h-10 text-mobile-base sm:text-base" />
```

### ❌ Wrong: Tiny tap target
```tsx
<button className="p-1">
  <Icon className="w-4 h-4" />
</button>
```

### ✅ Correct: Proper tap target
```tsx
<button className="min-h-[48px] min-w-[48px] p-2 flex items-center justify-center">
  <Icon className="w-6 h-6 sm:w-5 sm:h-5" />
</button>
```

## 📱 Testing Requirements

Test ALL components on:

1. **Chrome DevTools**
   - 360x800 (small phone)
   - 390x844 (iPhone 12)
   
2. **Checks**
   - No horizontal scroll
   - All buttons easily tappable
   - Text readable without zoom
   - Focus states visible

3. **Accessibility**
   - Test with Tab key navigation
   - Verify focus indicators
   - Check ARIA labels on icon buttons

## 🔗 Resources

- Main Guidelines: `MOBILE_FIRST_LOCKED.md`
- Examples: `src/pages/auth/Auth.tsx`
- Rules: `.mobile-first-rules`
