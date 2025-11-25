# Subscription Management Guide

## Overview
FunL uses a subscription-based model where customers pay monthly for access to create and manage funnels. This guide walks you through testing and managing the subscription system.

---

## 1. Understanding the Subscription Flow

### How It Works
1. Customer signs up and gets a trial (if configured)
2. Trial period runs for X days (configurable per plan)
3. After trial, Stripe automatically charges the customer
4. Subscription status updates automatically via webhooks
5. Access to features is controlled by subscription status

### Key Concepts
- **Plans**: Define what customers can buy (price, funnel limits, trial period)
- **Subscriptions**: Customer's active payment relationship
- **Funnel Limits**: Plans restrict how many funnels a customer can create
- **Grace Period**: Brief period after failed payment before access is revoked

---

## 2. Setting Up Plans

### Navigate to Plans
- [ ] Go to `/admin/plans`
- [ ] Review existing plans (Basic, Pro, etc.)

### Create a New Plan
- [ ] Click "Create Plan"
- [ ] Fill in details:
  - Name: e.g., "Starter"
  - Slug: e.g., "starter" (URL-friendly)
  - Description: What this plan offers
  - Price: In cents (e.g., 990 = $9.90)
  - Billing Period: "monthly"
  - Funnel Limit: e.g., 5
  - Trial Days: e.g., 14
- [ ] Set as "Default" if this should be the default plan
- [ ] Mark as "Featured" if you want it highlighted
- [ ] Click "Create"

### Test Plan Configuration
- [ ] Verify plan appears in the list
- [ ] Check stats show correct total/active plans
- [ ] Edit the plan and change funnel limit
- [ ] Verify changes saved correctly

---

## 3. Testing Email Confirmation Flow

### Test New User Signup
- [ ] Open incognito browser
- [ ] Go to `/signup`
- [ ] Fill in:
  - Business Name: "Test Business"
  - Email: `test+trial@example.com`
  - Phone: "0400123456"
  - Business Category: Select one
  - Password: "password123"
  - Confirm Password: "password123"
- [ ] Click "Create account"
- [ ] Verify redirected to `/confirm-email` with clear instructions
- [ ] Check email inbox for confirmation email
- [ ] Verify email is from "FunL" (not raw Supabase)
- [ ] Click confirmation link in email
- [ ] Verify redirected to `/email-confirmed` success page
- [ ] Verify auto-redirect to `/select-plan` after 2 seconds

### Test Password Reset Flow
- [ ] Go to `/forgot-password`
- [ ] Enter email address
- [ ] Click "Send reset link"
- [ ] Check email for password reset link
- [ ] Click reset link
- [ ] Verify redirected to `/reset-password`
- [ ] Enter new password (min 6 characters)
- [ ] Confirm new password
- [ ] Click "Reset password"
- [ ] Verify success message and redirect to login
- [ ] Login with new password
- [ ] Verify login successful

---

## 4. Testing Plan Selection & Onboarding

### Test Plan Selection
- [ ] After email confirmation, land on `/select-plan`
- [ ] Verify all active plans displayed
- [ ] Test billing period toggle (Monthly/Weekly)
- [ ] Verify prices update when toggling
- [ ] Select a plan with trial period
- [ ] Verify "Start free trial" button shown
- [ ] Click to select plan
- [ ] For trial plan: Verify NO payment required
- [ ] Verify redirected to `/onboarding`

### Test Onboarding Wizard
- [ ] Verify progress bar shows "Step 1 of 3"
- [ ] **Step 1**: Review plan details
  - [ ] Verify correct plan name shown
  - [ ] Verify funnel limit shown
  - [ ] If trial: Verify trial end date shown
  - [ ] Verify billing period shown
  - [ ] Click "Continue"
- [ ] **Step 2**: Confirm business details
  - [ ] Verify business name shown
  - [ ] Verify email shown
  - [ ] Verify phone shown (if provided)
  - [ ] Click "Continue"
- [ ] **Step 3**: Next steps guide
  - [ ] Verify three action items shown
  - [ ] Click "Go to Dashboard"
- [ ] Verify redirected to `/dashboard`
- [ ] Verify `onboarding_completed` set to true in database

---

## 5. Testing Customer Subscription Flow

### Test Trial Subscription (No Payment)
- [ ] Follow email confirmation flow
- [ ] Select plan with trial period on `/select-plan`
- [ ] Verify NO payment form shown
- [ ] Complete onboarding
- [ ] Go to `/admin/subscriptions`
- [ ] Verify new subscription shown with status "trialing"
- [ ] Verify trial end date is correct
- [ ] Verify customer can access dashboard

### Test Paid Subscription (With Stripe)
- [ ] Follow email confirmation flow
- [ ] Select plan without trial OR with $0 trial
- [ ] Verify redirected to Stripe Checkout
- [ ] Enter Stripe test card: `4242 4242 4242 4242`
  - Expiry: Any future date
  - CVC: Any 3 digits
  - ZIP: Any 5 digits
- [ ] Complete checkout
- [ ] Verify redirected to dashboard
- [ ] Check `/admin/subscriptions` shows new subscription
- [ ] Verify subscription status is "trialing"
- [ ] Verify trial end date is correct

### Test Funnel Limits
- [ ] As test customer, create funnels
- [ ] Try to create more funnels than plan allows
- [ ] Verify you're blocked with upgrade message
- [ ] Upgrade to higher plan
- [ ] Verify you can now create more funnels

### Test Failed Payment
- [ ] In Stripe Dashboard, find test subscription
- [ ] Click "Update payment method"
- [ ] Add card that will fail: `4000 0000 0000 0341`
- [ ] Wait for next billing cycle or trigger manually
- [ ] Verify subscription status changes to "past_due"
- [ ] Verify customer gets notification
- [ ] Verify customer access is restricted (configurable)

### Test Successful Renewal
- [ ] Update payment method to working card: `4242 4242 4242 4242`
- [ ] Trigger renewal in Stripe Dashboard
- [ ] Verify subscription status returns to "active"
- [ ] Verify customer access restored

---

## 4. Managing Active Subscriptions

### View All Subscriptions
- [ ] Go to `/admin/subscriptions`
- [ ] Review metrics:
  - Total subscribers
  - Active subscriptions
  - Trial conversions
  - Monthly recurring revenue

### Filter and Search
- [ ] Use "All Plans" dropdown to filter by plan
- [ ] Use "All Statuses" to filter by status
- [ ] Search for specific customer email
- [ ] Verify filters work correctly

### View Subscription Details
- [ ] Click on any subscription
- [ ] Verify you see:
  - Customer details
  - Plan details
  - Payment history
  - Current period dates
  - Stripe links

### Cancel a Subscription
- [ ] Find a test subscription
- [ ] Click "Cancel Subscription"
- [ ] Choose "Cancel Immediately" or "End of Period"
- [ ] Confirm cancellation
- [ ] Verify status updates to "canceled"
- [ ] Test customer can no longer access paid features

### Reactivate Subscription
- [ ] Go to Stripe Dashboard
- [ ] Find canceled subscription
- [ ] Click "Reactivate"
- [ ] Verify status updates in admin
- [ ] Verify customer access restored

---

## 6. Testing User Subscription Management

### Access User Subscription Page
- [ ] Login as a customer (not admin)
- [ ] Navigate to `/account/subscription`
- [ ] Verify page loads correctly

### View Current Plan
- [ ] Verify current plan name displayed
- [ ] Verify status shown (active/trialing/past_due)
- [ ] Verify billing period shown (monthly/weekly)
- [ ] Verify funnel limit shown
- [ ] If trial: Verify trial end date shown
- [ ] If active: Verify next billing date shown

### View Payment History
- [ ] Scroll to "Payment History" section
- [ ] Verify past payments listed
- [ ] Verify each payment shows:
  - [ ] Date
  - [ ] Description
  - [ ] Amount
  - [ ] Status
  - [ ] Receipt link (if available)
- [ ] Click "View" on a receipt link
- [ ] Verify Stripe receipt opens in new tab

### Test Plan Upgrade
- [ ] Click "Change Plan" button
- [ ] Verify redirected to `/select-plan`
- [ ] Select a different plan
- [ ] Complete checkout (if paid)
- [ ] Return to `/account/subscription`
- [ ] Verify new plan shown

### Test Subscription Cancellation
- [ ] Click "Cancel Subscription"
- [ ] Verify confirmation dialog appears
- [ ] Confirm cancellation
- [ ] Verify success message
- [ ] Refresh page
- [ ] Verify "Subscription will cancel at period end" message shown
- [ ] Verify customer still has access until period end

---

## 7. Testing Admin User Management

### Access Business Management
- [ ] Login as admin
- [ ] Navigate to `/admin/businesses`
- [ ] Verify page loads with business list

### View Business Statistics
- [ ] Verify "Total Businesses" count correct
- [ ] Verify "Email Confirmed" count correct
- [ ] Verify "Onboarded" count correct
- [ ] Verify "Total Funnels" count correct

### Search Businesses
- [ ] Use search box to search by business name
- [ ] Verify filtered results shown
- [ ] Clear search
- [ ] Search by email address
- [ ] Verify filtered results shown

### Test Password Reset (Admin)
- [ ] Find a test business in the list
- [ ] Click "Reset Password" button
- [ ] Enter new password (min 6 characters)
- [ ] Enter reason (min 10 characters): "Customer forgot password and requested reset"
- [ ] Confirm
- [ ] Verify success message
- [ ] Log out and login as that user with new password
- [ ] Verify login successful
- [ ] Check admin audit log for password reset entry

### Test Business Deletion
- [ ] Find a test business (not production data!)
- [ ] Click "Delete" button
- [ ] Enter reason (min 10 characters): "Test account cleanup"
- [ ] Confirm deletion in dialog
- [ ] Verify success message
- [ ] Verify business removed from list
- [ ] Check admin audit log for deletion entry
- [ ] Verify related data handled appropriately

---

## 8. Testing Webhooks

### Verify Webhook Endpoint
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Find your webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Verify status is "Enabled"
- [ ] Check recent deliveries for errors

### Test Key Webhook Events
- [ ] Create subscription → Verify creates in database
- [ ] Update payment method → Verify updates in admin
- [ ] Fail payment → Verify status changes
- [ ] Cancel subscription → Verify status changes
- [ ] Refund payment → Verify in payment history

### Check Webhook Logs
- [ ] Go to `/api/admin/logs` (if available)
- [ ] Review webhook processing logs
- [ ] Look for any errors or failures
- [ ] Fix any issues found

---

## 9. Email Template Configuration

### Configure Supabase Email Templates
- [ ] Go to Supabase Dashboard → Authentication → Email Templates
- [ ] See [EMAIL_TEMPLATE_CONFIGURATION.md](EMAIL_TEMPLATE_CONFIGURATION.md) for detailed instructions
- [ ] Update "Confirm Email" template with FunL branding
- [ ] Update "Reset Password" template with FunL branding
- [ ] Set redirect URLs to production domain
- [ ] Configure sender name as "FunL"
- [ ] Configure sender email (noreply@funl.au)
- [ ] For production: Set up custom SMTP provider
- [ ] Test all email flows end-to-end

### Test Email Delivery
- [ ] Sign up with new test account
- [ ] Verify confirmation email arrives
- [ ] Check email branding and styling
- [ ] Verify links work correctly
- [ ] Test password reset email
- [ ] Verify password reset email arrives
- [ ] Check branding matches
- [ ] Verify reset link works

---

## 10. Common Issues & Solutions

### Customer Can't Subscribe
- [ ] Check Stripe API keys are set correctly
- [ ] Verify webhook endpoint is accessible
- [ ] Check plan is marked as "active"
- [ ] Review Stripe logs for errors

### Subscription Status Not Updating
- [ ] Check webhook deliveries in Stripe
- [ ] Look for failed webhook calls
- [ ] Verify webhook signature validation
- [ ] Manually sync from Stripe if needed

### Funnel Limits Not Working
- [ ] Check subscription status is "active" or "trialing"
- [ ] Verify plan funnel_limit is set correctly
- [ ] Check database for subscription record
- [ ] Review application logs

### Failed Payments Not Notified
- [ ] Verify webhook is receiving events
- [ ] Check email service is configured
- [ ] Review notification queue/logs
- [ ] Test with Stripe test cards

---

## 11. Monthly Checklist

### First of Month
- [ ] Review revenue metrics
- [ ] Check failed payment rate
- [ ] Review trial conversion rate
- [ ] Identify churned customers

### Weekly Tasks
- [ ] Monitor failed payments
- [ ] Review new subscriptions
- [ ] Check for unusual activity
- [ ] Follow up on cancellations

### As Needed
- [ ] Update plan pricing
- [ ] Adjust funnel limits
- [ ] Modify trial periods
- [ ] Analyze upgrade patterns

---

## 12. Test Cards Reference

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
Lost Card: 4000 0000 0000 9987
Expired Card: 4000 0000 0000 0069
Processing Error: 4000 0000 0000 0119
3D Secure Required: 4000 0027 6000 3184
```

---

## 13. Pre-Flight Checklist

Before going live, verify:

### User Experience
- [ ] Email confirmation flow works end-to-end
- [ ] Email templates use FunL branding (not Supabase)
- [ ] Password reset flow works correctly
- [ ] Plan selection page displays all plans
- [ ] Trial subscriptions work (no payment required)
- [ ] Paid subscriptions work (Stripe checkout)
- [ ] Onboarding wizard completes successfully
- [ ] Users can access dashboard after onboarding

### Subscription Management
- [ ] All test subscriptions work end-to-end
- [ ] Webhooks are processing correctly
- [ ] Failed payments trigger correct actions
- [ ] Email notifications are sent
- [ ] Funnel limits are enforced
- [ ] Cancellations work correctly
- [ ] Upgrades/downgrades work
- [ ] Trial periods work as expected
- [ ] Payment history displays correctly
- [ ] Users can view/manage their subscription

### Admin Features
- [ ] Admin can view all businesses
- [ ] Admin can reset user passwords
- [ ] Admin can delete businesses
- [ ] All admin actions are logged in audit log
- [ ] Business search and filters work
- [ ] Business statistics are accurate

### Production Configuration
- [ ] Stripe keys switched to production
- [ ] Webhook endpoint uses production URL
- [ ] Email templates configured for production domain
- [ ] Custom SMTP configured (not Supabase SMTP)
- [ ] NEXT_PUBLIC_SITE_URL set to production domain
- [ ] All redirect URLs point to production
- [ ] SPF/DKIM records configured for email domain

### Documentation
- [ ] Customer support process documented
- [ ] Refund process documented
- [ ] Admin guide reviewed and up to date
- [ ] Email template configuration documented

---

## Support Resources

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Test Mode: https://dashboard.stripe.com/test
- Stripe Webhooks: https://dashboard.stripe.com/webhooks
- Test Cards: https://stripe.com/docs/testing
