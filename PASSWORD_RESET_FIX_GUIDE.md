# PASSWORD RESET FIX - STEP BY STEP GUIDE

## THE PROBLEM
Supabase Auth is configured with a Password Recovery Hook that returns 500 errors.
This breaks the password reset flow on /auth.

## THE SOLUTION (Choose ONE)

### OPTION A: USE SUPABASE BUILT-IN EMAIL (RECOMMENDED - SIMPLEST)

1. **Disable the Password Recovery Hook:**
   - Open Lovable Cloud → Click "Cloud" tab
   - Go to "Users" section
   - Click on "Email" tab
   - Look for "Custom SMTP" or "Email Hooks" settings
   - Find "Password Recovery Hook" 
   - **DELETE or DISABLE** the hook URL
   - Save changes

2. **Configure Supabase Email Settings:**
   - Still in Email settings
   - Make sure "Enable Email Sign-in" is ON
   - Make sure "Auto-confirm Email" is ON (for testing)
   - Site URL should be: `https://b4592a02-6869-4c5c-bafa-73bc90a7e646.lovableproject.com`
   - Add redirect URL: `https://b4592a02-6869-4c5c-bafa-73bc90a7e646.lovableproject.com/auth/reset-password`

3. **Test:**
   - Go to /auth
   - Click "Forgot Password?"
   - Enter: yourit.head@gmail.com
   - Should see: "Email Sent" toast
   - Check email for Supabase reset link

### OPTION B: USE RESEND WITH EDGE FUNCTION (IF OPTION A DOESN'T WORK)

1. **Verify Resend Setup:**
   - Go to https://resend.com/domains
   - Make sure you have at least one verified domain
   - Or use the default: onboarding@resend.dev

2. **Verify API Key:**
   - Go to https://resend.com/api-keys
   - Copy your API key (starts with `re_`)
   - Make sure it's active

3. **Update Secrets:**
   - In Lovable, the secrets are already configured:
     - RESEND_API_KEY
     - SEND_EMAIL_HOOK_SECRET

4. **Configure Password Recovery Hook:**
   - Lovable Cloud → Users → Email
   - Set Password Recovery Hook URL to:
     `https://jaxiekqndscqnrdtmxli.supabase.co/functions/v1/send-password-reset`
   - Set Hook Secret to the value of SEND_EMAIL_HOOK_SECRET

5. **Test:**
   - Go to /auth
   - Click "Forgot Password?"
   - Enter: yourit.head@gmail.com
   - Check edge function logs for success
   - Check email inbox

## HOW TO ACCESS SUPABASE AUTH SETTINGS

Since you're using Lovable Cloud, you have two options:

1. **Via Lovable Cloud UI:**
   - Click "Cloud" button in Lovable
   - Go to "Users" section
   - Click "Email" or "Settings" tab
   - Look for hook configuration

2. **If You Can't Find It:**
   - The hook might be configured at Supabase level
   - You may need to contact Lovable support
   - Provide them this project ID: jaxiekqndscqnrdtmxli
   - Ask them to disable the Password Recovery Hook

## CURRENT STATUS

✅ Frontend code is correct - uses standard Supabase password reset
✅ Edge function is deployed and will return 400 (not 500) on errors
❌ Password Recovery Hook is still configured and pointing to broken endpoint

**YOU NEED TO:** Disable the hook via Lovable Cloud UI or contact support.

## TESTING CHECKLIST

After disabling the hook:

- [ ] Go to /auth page
- [ ] Click "Forgot Password?"
- [ ] Enter test email: yourit.head@gmail.com
- [ ] See success toast (not error)
- [ ] Check email inbox for reset link
- [ ] Click reset link
- [ ] Should redirect to /auth/reset-password with token
- [ ] Enter new password
- [ ] See "Password updated successfully"
- [ ] Can log in with new password

## IF STILL BROKEN AFTER DISABLING HOOK

Contact Lovable Support with:
- Project ID: b4592a02-6869-4c5c-bafa-73bc90a7e646
- Supabase Project ID: jaxiekqndscqnrdtmxli
- Issue: Password Recovery Hook returning 500 errors
- Request: Disable all email hooks and use Supabase built-in email
