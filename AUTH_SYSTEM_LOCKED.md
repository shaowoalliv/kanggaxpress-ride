# 🔒 AUTHENTICATION SYSTEM - LOCKED CONFIGURATION

## ⚠️ CRITICAL - DO NOT MODIFY

This document defines the LOCKED authentication system configuration for KanggaXpress. These patterns and implementations are locked to maintain consistency and prevent breaking changes.

---

## 🛡️ Protected Files

**CRITICAL:** The following files contain locked authentication logic and must not be modified without explicit approval:

### Core Authentication Files
- `src/pages/auth/Auth.tsx` - Main unified auth page (login/signup for all roles)
- `src/pages/auth/Login.tsx` - Standalone login page
- `src/pages/auth/Signup.tsx` - Standalone signup page  
- `src/pages/auth/PassengerRegister.tsx` - Passenger registration
- `src/pages/auth/LoginRedirect.tsx` - Login redirect handler
- `src/pages/auth/SignupRedirect.tsx` - Signup redirect handler
- `src/contexts/AuthContext.tsx` - Authentication context provider

### Supporting Files
- `src/integrations/supabase/client.ts` - Supabase client (auto-generated)
- `src/services/profiles.ts` - Profile service
- `src/services/drivers.ts` - Driver service

---

## 📋 LOCKED PATTERNS

### 1. Email Verification Settings

**LOCKED RULE:** Email verification is ENABLED by default for production security.

```typescript
// REQUIRED in all signUp calls
const { error } = await supabase.auth.signUp({
  email: email.trim(),
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/`,
    data: {
      full_name: formData.fullName,
      role: selectedRole,
      phone: formData.phone,
    }
  }
});
```

**Testing Override:**
- For testing ONLY: Enable "Auto-confirm email signups" in Supabase Cloud settings
- NEVER disable email verification in code
- NEVER implement auto-confirm in application logic

---

### 2. Privacy Consent Checkbox

**LOCKED RULE:** Privacy consent checkbox MUST be:
- Placed below the data privacy paragraph
- Centered horizontally
- Required for form submission
- Displayed for ALL user types (passenger, driver, courier)

```typescript
// REQUIRED placement
<div className="flex items-center justify-center">
  <Checkbox
    id="consent"
    checked={consent}
    onCheckedChange={(checked) => setConsent(checked as boolean)}
    required
  />
  <Label htmlFor="consent" className="ml-2 text-sm">
    I agree to the terms and conditions
  </Label>
</div>
```

---

### 3. Authentication Flow

**LOCKED RULE:** Authentication must follow this exact flow:

#### Registration Flow
1. User selects role (passenger, driver, sender, courier)
2. User fills required fields based on role
3. User accepts privacy consent checkbox
4. Form validation using Zod schema
5. Supabase `signUp` with emailRedirectTo
6. Success toast + redirect to appropriate dashboard
7. Email verification sent (if not auto-confirmed in settings)

#### Login Flow
1. User enters email and password
2. Form validation using Zod schema
3. Supabase `signInWithPassword`
4. Success toast
5. Automatic redirect based on user role from profile
6. Handle invalid credentials gracefully

---

### 4. Role-Based Registration Fields

**LOCKED RULE:** Each role has specific required fields:

#### Passenger Registration
```typescript
const passengerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  address: z.string().min(5, 'Address is required'),
  contactNumber: z.string().min(10, 'Valid contact number is required'),
});
```

#### Driver/Courier Registration
- Same as passenger PLUS:
- Vehicle information (collected in Setup page after registration)
- Document photos using PhotoCaptureCard (in Setup page)

---

### 5. Session Management

**LOCKED RULE:** Session handling in AuthContext:

```typescript
useEffect(() => {
  // Set up listener FIRST
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
    }
  );

  // THEN check for existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      fetchUserProfile(session.user.id);
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

**CRITICAL:**
- Store BOTH user AND session
- Use setTimeout(0) to defer Supabase calls inside onAuthStateChange
- Never use async functions directly in onAuthStateChange callback

---

### 6. Redirect URLs

**LOCKED RULE:** All authentication redirects use window.location.origin:

```typescript
// REQUIRED format
emailRedirectTo: `${window.location.origin}/`
```

**NEVER hardcode:**
- localhost URLs
- Production URLs
- Specific port numbers

---

### 7. Error Handling

**LOCKED RULE:** Display user-friendly error messages:

```typescript
// Example pattern
if (error) {
  if (error.message.includes('Invalid login credentials')) {
    toast.error('Invalid email or password');
  } else if (error.message.includes('User already registered')) {
    toast.error('An account with this email already exists');
  } else {
    toast.error(error.message);
  }
  return;
}
```

---

### 8. Input Validation

**LOCKED RULE:** All forms MUST use Zod validation:

```typescript
// REQUIRED pattern
try {
  authSchema.parse({ email, password, /* ... */ });
  // Proceed with submission
} catch (error) {
  if (error instanceof z.ZodError) {
    toast.error(error.errors[0].message);
  }
  return;
}
```

**Security Requirements:**
- Trim email inputs
- Minimum password length: 6 characters
- Email format validation
- Required field validation

---

## 🚫 FORBIDDEN CHANGES

### NEVER:
1. ❌ Disable email verification in code
2. ❌ Implement anonymous sign-ups
3. ❌ Remove privacy consent checkbox
4. ❌ Change session storage from localStorage
5. ❌ Hardcode redirect URLs
6. ❌ Remove Zod validation
7. ❌ Use async functions directly in onAuthStateChange
8. ❌ Skip error handling
9. ❌ Modify Supabase client configuration
10. ❌ Change role-based redirect logic

### ALWAYS:
1. ✅ Keep email verification enabled
2. ✅ Require privacy consent
3. ✅ Use window.location.origin for redirects
4. ✅ Validate all inputs with Zod
5. ✅ Store both user and session
6. ✅ Handle errors gracefully
7. ✅ Use setTimeout(0) for deferred Supabase calls
8. ✅ Maintain role-based registration fields
9. ✅ Keep emailRedirectTo in all signUp calls
10. ✅ Show loading states during auth operations

---

## ✅ Testing Checklist

Before approving ANY changes to authentication files:

- [ ] Email verification is enabled (emailRedirectTo present)
- [ ] Privacy consent checkbox is centered below paragraph
- [ ] All roles (passenger, driver, courier, sender) work
- [ ] Zod validation is present and working
- [ ] Error messages are user-friendly
- [ ] Session and user are both stored in AuthContext
- [ ] onAuthStateChange uses setTimeout(0) for deferred calls
- [ ] Redirects use window.location.origin
- [ ] Loading states are shown during operations
- [ ] Role-based redirects work correctly

---

## 🔍 Quick Verification Commands

```bash
# Verify emailRedirectTo is present
grep -r "emailRedirectTo" src/pages/auth/

# Verify privacy consent checkbox exists
grep -r "consent" src/pages/auth/Auth.tsx

# Verify Zod validation
grep -r "z.object" src/pages/auth/

# Verify session storage
grep -r "setSession" src/contexts/AuthContext.tsx

# Verify no hardcoded URLs
grep -r "localhost" src/pages/auth/
grep -r "lovable.app" src/pages/auth/
```

---

## 📚 Related Documentation

- See `LOCKED_CONFIGURATIONS.md` for mobile-first and photo capture rules
- See `PHOTO_CAPTURE_LOCKED.md` for document upload rules
- See `DRIVER_COURIER_REGISTRATION_LOCKED.md` for driver/courier setup

---

## 🆘 Support

If you need to make changes to authentication:

1. **First**, review this document thoroughly
2. **Second**, check if the change violates any locked rules
3. **Third**, if the change is necessary, document WHY it's needed
4. **Finally**, update this locked configuration document with the new pattern

**Remember:** These configurations are locked for security, consistency, and user experience. Breaking these rules can lead to authentication failures, security vulnerabilities, and poor user experience.

---

**Last Updated:** 2025-11-17  
**Status:** 🔒 LOCKED - Do not modify without explicit approval
