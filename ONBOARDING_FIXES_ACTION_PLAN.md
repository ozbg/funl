# User Onboarding & Authentication Fixes - Action Plan

## Overview
This document outlines all the issues identified during initial testing and the steps to fix them.

---

## Issues Identified

### 1. **Signup Flow Issues**
- ❌ After signup, user redirected to login with no explanation
- ❌ No clear message about email confirmation requirement
- ❌ Email confirmation link comes from Supabase, not FunL branding
- ❌ After clicking confirmation link, unclear that it worked
- ❌ No confirmation success page

### 2. **Post-Login Issues**
- ❌ After confirming email and logging in, no trial/plan selection shown
- ❌ No onboarding flow to guide new users
- ❌ User goes straight to dashboard without context
- ❌ No prompt to create first funnel

### 3. **User Subscription Management**
- ❌ No user-facing subscription management panel
- ❌ Users can't view their current plan
- ❌ Users can't see billing information
- ❌ Users can't upgrade/downgrade plans
- ❌ Users can't view payment history

### 4. **Password Reset**
- ❌ "Forgot password" link exists but route returns 404
- ❌ No password reset flow implemented
- ❌ No reset password page

### 5. **Admin Capabilities**
- ❌ Admin can't delete businesses
- ❌ Admin can't reset user passwords
- ❌ Limited user management features

---

## Implementation Plan

### Phase 1: Email Confirmation Flow (Priority: High)
**Files to modify:**
- `funl-app/app/api/auth/signup/route.ts`
- `funl-app/app/(auth)/signup/page.tsx`
- Create: `funl-app/app/(auth)/confirm-email/page.tsx`
- Create: `funl-app/app/(auth)/email-confirmed/page.tsx`

**Changes:**
1. Update signup API to configure email confirmation redirect to FunL domain
2. After signup, show success message with clear next steps
3. Create email confirmation waiting page with instructions
4. Create email confirmed success page
5. Configure Supabase email templates to use FunL branding

**Tasks:**
- [ ] Modify signup to NOT auto-redirect to dashboard
- [ ] Show "Check your email" message after signup
- [ ] Create `/confirm-email` page with clear instructions
- [ ] Create `/email-confirmed` success page
- [ ] Update Supabase email templates (via dashboard)
- [ ] Configure `redirectTo` parameter in signUp call

---

### Phase 2: Password Reset Flow (Priority: High)
**Files to create:**
- `funl-app/app/(auth)/forgot-password/page.tsx`
- `funl-app/app/(auth)/reset-password/page.tsx`
- `funl-app/app/api/auth/reset-password/route.ts`

**Changes:**
1. Create forgot password page (email entry)
2. Create reset password page (token-based)
3. Add API route for password reset
4. Update Supabase email templates for password reset

**Tasks:**
- [ ] Create `/forgot-password` page with email input
- [ ] Create `/reset-password` page with new password form
- [ ] Add API endpoint for password reset requests
- [ ] Handle password reset tokens from email links
- [ ] Test full password reset flow
- [ ] Configure Supabase password reset email template

---

### Phase 3: Plan Selection & Trial Flow (Priority: High)
**Files to create:**
- `funl-app/app/(auth)/select-plan/page.tsx`
- `funl-app/app/(auth)/checkout/page.tsx`
- `funl-app/app/api/subscriptions/create/route.ts`

**Files to modify:**
- `funl-app/app/api/auth/signup/route.ts`

**Changes:**
1. After email confirmation, redirect to plan selection
2. Show all available plans with trial information
3. Implement Stripe checkout for plan selection
4. Create trial subscription without payment for trial plans
5. Store subscription in database

**Tasks:**
- [ ] Create plan selection page with pricing cards
- [ ] Show trial period information prominently
- [ ] Integrate Stripe Checkout
- [ ] Handle trial subscriptions (no payment required)
- [ ] Create subscription record in database
- [ ] Redirect to onboarding after plan selection

---

### Phase 4: User Onboarding Flow (Priority: High)
**Files to create:**
- `funl-app/app/(auth)/onboarding/page.tsx`
- `funl-app/app/api/onboarding/complete/route.ts`

**Changes:**
1. Multi-step onboarding wizard after plan selection
2. Collect/confirm business information
3. Guide user to create first funnel
4. Set onboarding_completed flag

**Tasks:**
- [ ] Create onboarding wizard with steps:
  - Step 1: Welcome & plan confirmation
  - Step 2: Business details confirmation
  - Step 3: Quick tutorial
  - Step 4: Create first funnel prompt
- [ ] Add `onboarding_completed` field to businesses table
- [ ] Create API to mark onboarding complete
- [ ] Redirect to dashboard after completion
- [ ] Show "Create your first funnel" CTA

---

### Phase 5: User Subscription Management Panel (Priority: Medium)
**Files to create:**
- `funl-app/app/account/subscription/page.tsx`
- `funl-app/app/api/subscriptions/current/route.ts`
- `funl-app/app/api/subscriptions/upgrade/route.ts`
- `funl-app/app/api/subscriptions/cancel/route.ts`
- `funl-app/app/api/subscriptions/payment-history/route.ts`
- `funl-app/components/account/SubscriptionCard.tsx`
- `funl-app/components/account/PaymentHistory.tsx`
- `funl-app/components/account/PlanUpgradeDialog.tsx`

**Changes:**
1. Create user-facing subscription management page
2. Show current plan details and limits
3. Display next billing date and amount
4. Show payment history
5. Allow plan upgrades/downgrades
6. Allow subscription cancellation

**Tasks:**
- [ ] Create `/account/subscription` page
- [ ] Display current plan and usage
- [ ] Show billing information (next charge, amount)
- [ ] Create payment history table
- [ ] Add "Upgrade Plan" functionality
- [ ] Add "Cancel Subscription" functionality
- [ ] Add "Update Payment Method" link to Stripe portal
- [ ] Show trial status if applicable
- [ ] Add subscription navigation to main menu

---

### Phase 6: Admin User Management Enhancements (Priority: Medium)
**Files to create:**
- `funl-app/app/api/admin/businesses/[id]/delete/route.ts`
- `funl-app/app/api/admin/businesses/[id]/reset-password/route.ts`
- `funl-app/components/admin/DeleteBusinessDialog.tsx`
- `funl-app/components/admin/ResetPasswordDialog.tsx`

**Files to modify:**
- `funl-app/app/admin/businesses/page.tsx` (if exists, or create)

**Changes:**
1. Add delete business functionality
2. Add reset password for users
3. Create admin business management page
4. Add audit logging for admin actions

**Tasks:**
- [ ] Create DELETE endpoint for businesses
- [ ] Add cascade delete or orphan handling
- [ ] Create password reset endpoint for admins
- [ ] Add delete button to business list/detail
- [ ] Add reset password button
- [ ] Implement confirmation dialogs
- [ ] Log all admin actions to admin_audit_log
- [ ] Create admin businesses management page

---

### Phase 7: Database Schema Updates (Priority: High - Do First)
**Migration needed:**
- `funl-app/supabase/migrations/YYYYMMDDHHMMSS_onboarding_improvements.sql`

**Changes:**
1. Add `onboarding_completed` to businesses table
2. Add `email_confirmed_at` to track confirmation
3. Add indexes for performance

**Tasks:**
- [ ] Create migration file
- [ ] Add `onboarding_completed BOOLEAN DEFAULT FALSE`
- [ ] Add `email_confirmed_at TIMESTAMP`
- [ ] Add indexes
- [ ] Test migration locally
- [ ] Apply to production

---

### Phase 8: Email Template Configuration (Priority: High)
**Configure in Supabase Dashboard:**

**Tasks:**
- [ ] Update confirmation email template with FunL branding
- [ ] Update password reset email template
- [ ] Configure email redirect URLs to FunL domain
- [ ] Test all email flows
- [ ] Update email sender name to "FunL"

---

### Phase 9: Update Admin Guide (Priority: Medium)
**Files to modify:**
- `ADMIN_GUIDE_SUBSCRIPTIONS.md`

**Changes:**
1. Add new testing sections for all new flows
2. Update preflight checklist
3. Add troubleshooting for new features

**Tasks:**
- [ ] Add "Testing Email Confirmation" section
- [ ] Add "Testing Password Reset" section
- [ ] Add "Testing Plan Selection" section
- [ ] Add "Testing Onboarding Flow" section
- [ ] Add "Testing User Subscription Management" section
- [ ] Update preflight checklist with new items

---

## Testing Checklist (After Implementation)

### Email Confirmation Flow
- [ ] Sign up new user
- [ ] Verify "check your email" message shown
- [ ] Check email arrives from FunL (not raw Supabase)
- [ ] Click confirmation link
- [ ] Verify lands on success page
- [ ] Login and verify can access app

### Password Reset Flow
- [ ] Click "Forgot Password"
- [ ] Enter email address
- [ ] Verify email received
- [ ] Click reset link
- [ ] Enter new password
- [ ] Verify can login with new password

### Plan Selection & Trial
- [ ] After email confirmation, see plan selection
- [ ] Verify all plans displayed with trial info
- [ ] Select plan with trial
- [ ] Verify NO payment required for trial
- [ ] Verify subscription created in database
- [ ] Verify redirected to onboarding

### Onboarding Flow
- [ ] Complete onboarding steps
- [ ] Verify business info can be updated
- [ ] Verify guided to create first funnel
- [ ] Verify onboarding_completed set to true
- [ ] Verify don't see onboarding again on next login

### User Subscription Management
- [ ] Navigate to account/subscription page
- [ ] Verify current plan displayed
- [ ] Verify billing date shown
- [ ] View payment history
- [ ] Test upgrade plan flow
- [ ] Test cancel subscription flow
- [ ] Update payment method via Stripe portal

### Admin User Management
- [ ] View businesses list
- [ ] Delete a test business
- [ ] Reset password for a user
- [ ] Verify audit logs created

---

## File Structure Summary

### New Files to Create (26 files)
```
funl-app/
├── app/
│   ├── (auth)/
│   │   ├── confirm-email/page.tsx (NEW)
│   │   ├── email-confirmed/page.tsx (NEW)
│   │   ├── forgot-password/page.tsx (NEW)
│   │   ├── reset-password/page.tsx (NEW)
│   │   ├── select-plan/page.tsx (NEW)
│   │   ├── checkout/page.tsx (NEW)
│   │   └── onboarding/page.tsx (NEW)
│   ├── account/
│   │   └── subscription/page.tsx (NEW)
│   ├── admin/
│   │   └── businesses/page.tsx (NEW)
│   └── api/
│       ├── auth/
│       │   └── reset-password/route.ts (NEW)
│       ├── onboarding/
│       │   └── complete/route.ts (NEW)
│       ├── subscriptions/
│       │   ├── create/route.ts (NEW)
│       │   ├── current/route.ts (NEW)
│       │   ├── upgrade/route.ts (NEW)
│       │   ├── cancel/route.ts (NEW)
│       │   └── payment-history/route.ts (NEW)
│       └── admin/
│           └── businesses/
│               └── [id]/
│                   ├── delete/route.ts (NEW)
│                   └── reset-password/route.ts (NEW)
├── components/
│   ├── account/
│   │   ├── SubscriptionCard.tsx (NEW)
│   │   ├── PaymentHistory.tsx (NEW)
│   │   └── PlanUpgradeDialog.tsx (NEW)
│   └── admin/
│       ├── DeleteBusinessDialog.tsx (NEW)
│       └── ResetPasswordDialog.tsx (NEW)
└── supabase/
    └── migrations/
        └── YYYYMMDDHHMMSS_onboarding_improvements.sql (NEW)
```

### Files to Modify (3 files)
```
- funl-app/app/api/auth/signup/route.ts
- funl-app/app/(auth)/signup/page.tsx
- ADMIN_GUIDE_SUBSCRIPTIONS.md
```

---

## Estimated Implementation Time
- Phase 1: 4 hours
- Phase 2: 3 hours
- Phase 3: 6 hours
- Phase 4: 5 hours
- Phase 5: 8 hours
- Phase 6: 4 hours
- Phase 7: 2 hours
- Phase 8: 1 hour
- Phase 9: 1 hour

**Total: ~34 hours**

---

## Priority Order
1. **Phase 7** - Database Schema (foundational)
2. **Phase 1** - Email Confirmation (user can't use app without this)
3. **Phase 2** - Password Reset (critical for user recovery)
4. **Phase 3** - Plan Selection (core business requirement)
5. **Phase 4** - Onboarding (improves UX significantly)
6. **Phase 5** - User Subscription Management (user empowerment)
7. **Phase 6** - Admin Enhancements (admin quality of life)
8. **Phase 8** - Email Templates (polish)
9. **Phase 9** - Documentation (reference)

---

## Notes
- All new features should follow existing design patterns
- Use Panda CSS for styling (bg.subtle, fg.default, etc.)
- Maintain audit logging for admin actions
- Follow security best practices (RLS, service keys only when needed)
- Test thoroughly before marking complete
