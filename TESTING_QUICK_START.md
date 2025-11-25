# Quick Start Testing Guide

## Before You Test

### 1. Configure Email Templates (Required!)
Follow [EMAIL_TEMPLATE_CONFIGURATION.md](EMAIL_TEMPLATE_CONFIGURATION.md) to set up Supabase email templates.

**Quick steps:**
- Go to Supabase Dashboard → Authentication → Email Templates
- Update "Confirm Email" and "Reset Password" templates
- Set redirect URLs to your domain
- Configure sender name as "FunL"

### 2. Verify Environment Variables
```bash
echo $NEXT_PUBLIC_SITE_URL  # Should be http://localhost:3000 or production URL
```

---

## Test the Full Flow (15 minutes)

### Test 1: New User Signup → Trial
```
1. Open incognito: http://localhost:3000/signup
2. Fill in details, click "Create account"
3. ✓ Should see "Check your email" page
4. Check email, click confirmation link
5. ✓ Should see "Email confirmed!" success page
6. ✓ Auto-redirect to plan selection
7. Select a plan with trial period
8. Click "Start free trial"
9. ✓ Should redirect to onboarding (NO payment required)
10. Complete 3 onboarding steps
11. Click "Go to Dashboard"
12. ✓ Should land on dashboard with access
```

### Test 2: Password Reset
```
1. Go to: http://localhost:3000/forgot-password
2. Enter email address
3. ✓ Should see "Check your email" message
4. Check email, click reset link
5. ✓ Should land on /reset-password
6. Enter new password
7. Click "Reset password"
8. ✓ Should see success, auto-redirect to login
9. Login with new password
10. ✓ Should work
```

### Test 3: User Subscription Management
```
1. Login as a user (not admin)
2. Click "Subscription" in nav
3. ✓ Should see current plan details
4. ✓ Should see trial end date OR next billing date
5. Scroll down to payment history
6. ✓ Should see past payments (if any)
7. Click "Cancel Subscription"
8. Confirm
9. ✓ Should show "will cancel at period end" message
```

### Test 4: Admin User Management
```
1. Login as admin
2. Click "Businesses" in admin nav
3. ✓ Should see all businesses with stats
4. Search for a test user
5. Click "Reset Password"
6. Enter new password and reason
7. ✓ Should succeed
8. Click "Delete" on a test business
9. Enter reason, confirm
10. ✓ Should remove from list
```

---

## Common Issues

### Email not arriving
- Check Supabase logs: Authentication → Logs
- Check spam folder
- Verify email template configured
- Verify redirect URL matches NEXT_PUBLIC_SITE_URL

### 404 on confirmation link
- Verify `NEXT_PUBLIC_SITE_URL` is set
- Check redirect URL in email template matches
- Make sure pages exist: `/email-confirmed`, `/reset-password`

### Stuck on "Check your email" page
- Email templates MUST be configured in Supabase dashboard
- Cannot test without configuring email redirect URLs
- See [EMAIL_TEMPLATE_CONFIGURATION.md](EMAIL_TEMPLATE_CONFIGURATION.md)

### No plans showing on /select-plan
- Run: `npm run seed` (if seed script exists)
- Or manually create plans in `/admin/plans`
- Make sure plans are marked as "active"

### Middleware redirect loop
- Clear browser cookies
- Check middleware logic in [middleware.ts](funl-app/middleware.ts)
- Verify business record has correct flags

---

## Full Testing Checklist

For comprehensive testing, use:
**[ADMIN_GUIDE_SUBSCRIPTIONS.md](ADMIN_GUIDE_SUBSCRIPTIONS.md)**

Sections to complete:
- ✓ Section 3: Email Confirmation Flow
- ✓ Section 4: Plan Selection & Onboarding
- ✓ Section 5: Customer Subscription Flow
- ✓ Section 6: User Subscription Management
- ✓ Section 7: Admin User Management

---

## Quick Database Checks

### Check user onboarding status:
```sql
SELECT id, name, email, email_confirmed_at, onboarding_completed, created_at
FROM businesses
ORDER BY created_at DESC
LIMIT 10;
```

### Check subscriptions:
```sql
SELECT sh.*, sp.name as plan_name
FROM subscription_history sh
JOIN subscription_plans sp ON sh.plan_id = sp.id
WHERE sh.status IN ('active', 'trialing')
ORDER BY sh.created_at DESC
LIMIT 10;
```

### Check admin audit log:
```sql
SELECT * FROM admin_audit_log
ORDER BY created_at DESC
LIMIT 20;
```

---

## Support

For issues, see:
- **Action Plan:** [ONBOARDING_FIXES_ACTION_PLAN.md](ONBOARDING_FIXES_ACTION_PLAN.md)
- **Implementation:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Detailed Tests:** [ADMIN_GUIDE_SUBSCRIPTIONS.md](ADMIN_GUIDE_SUBSCRIPTIONS.md)
