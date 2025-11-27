# Email Template Configuration Guide

This guide explains how to configure Supabase email templates for FunL.

## Overview

Supabase sends emails for:
1. **Email Confirmation** - When users sign up
2. **Password Reset** - When users request a password reset
3. **Magic Link** - For passwordless login (if enabled)

## Configuration Steps

### Access Email Templates

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your FunL project
3. Navigate to **Authentication** → **Email Templates**

---

## 1. Confirm Email Template

### Purpose
Sent when a user signs up to verify their email address.

### Configuration

**Subject Line:**
```
Confirm your FunL account
```

**Message Body:**
```html
<h2>Welcome to FunL!</h2>

<p>Thanks for signing up! Please confirm your email address to get started.</p>

<p>Click the button below to verify your email:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Confirm Email Address</a></p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 24 hours.</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

<p style="color: #6b7280; font-size: 14px;">
If you didn't create a FunL account, you can safely ignore this email.
</p>

<p style="color: #6b7280; font-size: 14px;">
Questions? Contact us at support@funl.au
</p>
```

### Redirect URL
Set the redirect URL to:
```
https://yourdomain.com/email-confirmed
```

For local development:
```
http://localhost:3000/email-confirmed
```

---

## 2. Reset Password Template

### Purpose
Sent when a user requests to reset their password.

### Configuration

**Subject Line:**
```
Reset your FunL password
```

**Message Body:**
```html
<h2>Reset your password</h2>

<p>We received a request to reset the password for your FunL account.</p>

<p>Click the button below to set a new password:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset Password</a></p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 1 hour.</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

<p style="color: #6b7280; font-size: 14px;">
If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
</p>

<p style="color: #6b7280; font-size: 14px;">
Questions? Contact us at support@funl.au
</p>
```

### Redirect URL
Set the redirect URL to:
```
https://yourdomain.com/reset-password
```

For local development:
```
http://localhost:3000/reset-password
```

---

## 3. Magic Link Template (Optional)

### Purpose
Sent for passwordless login if you enable this feature.

### Configuration

**Subject Line:**
```
Your FunL login link
```

**Message Body:**
```html
<h2>Sign in to FunL</h2>

<p>Click the button below to securely sign in to your account:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Sign In</a></p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 1 hour.</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

<p style="color: #6b7280; font-size: 14px;">
If you didn't request this login link, you can safely ignore this email.
</p>

<p style="color: #6b7280; font-size: 14px;">
Questions? Contact us at support@funl.au
</p>
```

---

## Additional Settings

### Sender Details

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure:
   - **Sender name:** FunL
   - **Sender email:** noreply@funl.au (or your verified email)

### Custom SMTP (Production)

For production, it's recommended to use a custom SMTP provider like:
- SendGrid
- AWS SES
- Postmark
- Mailgun

**To configure custom SMTP:**

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Toggle "Enable Custom SMTP"
3. Enter your SMTP credentials:
   - Host
   - Port
   - Username
   - Password
   - Sender email
   - Sender name

---

## Testing Email Templates

### Test Confirmation Email

1. Sign up with a test email address
2. Check that email arrives
3. Verify branding and styling
4. Click the confirmation link
5. Verify redirect to `/email-confirmed`

### Test Password Reset Email

1. Go to `/forgot-password`
2. Enter a test email
3. Check that email arrives
4. Verify branding and styling
5. Click the reset link
6. Verify redirect to `/reset-password`

---

## Troubleshooting

### Emails not arriving

1. Check Supabase logs: **Authentication** → **Logs**
2. Check spam folder
3. Verify email address is correct
4. Check SMTP settings are configured

### Wrong redirect URL

1. Go to **Authentication** → **URL Configuration**
2. Update "Site URL" to your production URL
3. Add redirect URLs to the allowlist:
   - https://yourdomain.com/email-confirmed
   - https://yourdomain.com/reset-password

### Emails look broken

1. Test HTML in email testing tool
2. Verify all variables are correct: `{{ .ConfirmationURL }}`
3. Check CSS is inline (email clients don't support `<style>` tags)

---

## Production Checklist

Before going live:

- [ ] Update all redirect URLs to production domain
- [ ] Configure custom SMTP provider
- [ ] Verify sender email/domain
- [ ] Test all email flows end-to-end
- [ ] Check emails in multiple email clients (Gmail, Outlook, Apple Mail)
- [ ] Verify SPF/DKIM records are set up for custom domain
- [ ] Add unsubscribe link if required by law
- [ ] Ensure compliance with CAN-SPAM/GDPR requirements

---

## Environment Variables

Make sure these are set:

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # Production URL
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

---

## Support

For issues with email delivery, contact Supabase support or check:
- [Supabase Email Docs](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
