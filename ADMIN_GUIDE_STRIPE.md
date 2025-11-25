# Stripe Integration Setup & Testing Guide

## Overview
This guide walks you through setting up Stripe for FunL, configuring webhooks, testing all payment flows, and verifying the integration is production-ready.

---

## 1. Initial Stripe Setup

### Create Stripe Account
- [ ] Go to https://stripe.com
- [ ] Sign up or log in
- [ ] Complete business verification (for production)
- [ ] Add bank account for payouts

### Activate Test Mode
- [ ] Toggle to "Test Mode" in Stripe Dashboard
- [ ] You'll use test mode for all setup and testing
- [ ] Test mode has its own API keys and data

---

## 2. Get API Keys

### Locate API Keys
- [ ] In Stripe Dashboard, go to: Developers → API Keys
- [ ] Find "Test mode" toggle is ON

### Copy Test Keys
- [ ] **Publishable key** (starts with `pk_test_...`)
- [ ] Click "Reveal test key" for **Secret key** (starts with `sk_test_...`)
- [ ] Copy both keys

### Add Keys to FunL
- [ ] Open your `.env.local` file
- [ ] Add the following lines:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
- [ ] Save the file
- [ ] Restart your development server

### Verify Keys Work
- [ ] Go to `/admin/plans`
- [ ] Try to create a plan
- [ ] Should work without errors
- [ ] Check Stripe Dashboard → Developers → Logs
- [ ] Should see API calls from your app

---

## 3. Configure Webhook Endpoint

### Install Stripe CLI (for local testing)
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_X.X.X_linux_x86_64.tar.gz
tar -xvf stripe_X.X.X_linux_x86_64.tar.gz
```

### Login to Stripe CLI
```bash
stripe login
```
- [ ] Follow prompts to authenticate
- [ ] Verify you see "Done! You're authenticated"

### Forward Webhooks to Local
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
- [ ] Keep this terminal window open
- [ ] Copy the webhook signing secret (starts with `whsec_...`)
- [ ] Add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```
- [ ] Restart your server

### Verify Webhook Working
- [ ] Check terminal shows: "Ready! Your webhook signing secret is whsec_..."
- [ ] Keep this running during testing
- [ ] You'll see webhook events appear here in real-time

---

## 4. Configure Products in Stripe

### Create Product for Subscriptions
- [ ] In Stripe Dashboard, go to: Products → Add Product
- [ ] Name: "FunL Subscription"
- [ ] Description: "Monthly subscription to FunL funnel builder"
- [ ] Click "Add product"

### Create Prices
For each subscription plan in FunL:
- [ ] Click "Add price" on the product
- [ ] Pricing model: "Standard pricing"
- [ ] Price: Enter amount (e.g., $9.99)
- [ ] Billing period: "Monthly"
- [ ] Click "Add price"
- [ ] Copy the Price ID (starts with `price_...`)
- [ ] Store this - you'll need it later

### Create Product for QR Stickers
- [ ] In Stripe, go to: Products → Add Product
- [ ] Name: "QR Code Stickers"
- [ ] Description: "Physical QR code stickers"
- [ ] Click "Add product"
- [ ] Note: For products with dynamic pricing (tiers), we'll create prices via API

---

## 5. Testing Subscription Payments

### Test Customer Signup
- [ ] Open incognito browser
- [ ] Go to your app signup page
- [ ] Sign up as: `test+sub1@example.com`
- [ ] Select a plan
- [ ] On Stripe Checkout, use test card: `4242 4242 4242 4242`
- [ ] Expiry: any future date (e.g., 12/25)
- [ ] CVC: any 3 digits (e.g., 123)
- [ ] ZIP: any 5 digits (e.g., 12345)
- [ ] Click "Subscribe"

### Verify Subscription Created
- [ ] Check you're redirected to success page
- [ ] In Stripe CLI terminal, see webhook event: `customer.subscription.created`
- [ ] In Stripe Dashboard → Customers
- [ ] Find customer with email `test+sub1@example.com`
- [ ] Click customer → Subscriptions tab
- [ ] Verify subscription is "Active"

### Verify in FunL Admin
- [ ] Go to `/admin/subscriptions`
- [ ] Find subscription for `test+sub1@example.com`
- [ ] Verify shows:
  - Status: "Active" or "Trialing"
  - Plan name
  - Current period dates
  - Next billing date

### Test Trial Period
- [ ] Create another test user: `test+trial@example.com`
- [ ] Subscribe to plan with 14-day trial
- [ ] Complete checkout with test card
- [ ] Verify subscription status: "Trialing"
- [ ] Verify trial end date is 14 days from now
- [ ] Verify no charge yet in Stripe

---

## 6. Testing One-Time Payments (Products)

### Test Product Purchase
- [ ] Sign in as test customer (or create new: `test+product@example.com`)
- [ ] Browse products
- [ ] Add "Classic Square QR Stickers" to cart (quantity: 10)
- [ ] Click "Checkout"
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete purchase

### Verify Payment
- [ ] Check Stripe CLI shows: `checkout.session.completed`
- [ ] In Stripe Dashboard → Payments
- [ ] Find payment for $X.XX
- [ ] Verify status: "Succeeded"
- [ ] Verify customer email matches

### Verify Order Created
- [ ] In FunL, go to `/admin/orders`
- [ ] Find order for test customer
- [ ] Verify shows:
  - Status: "Paid"
  - Correct items
  - Correct total
  - Stripe payment ID

---

## 7. Testing Failed Payments

### Test Declined Card
- [ ] Try to subscribe/purchase with card: `4000 0000 0000 0002`
- [ ] Should see error: "Your card was declined"
- [ ] Verify no subscription/order created
- [ ] Verify customer returned to payment form

### Test Insufficient Funds
- [ ] Try card: `4000 0000 0000 9995`
- [ ] Should see error: "Insufficient funds"
- [ ] Verify payment not processed

### Test Other Failures
```
Lost Card: 4000 0000 0000 9987
Expired Card: 4000 0000 0000 0069
Processing Error: 4000 0000 0000 0119
```
- [ ] Test each and verify appropriate error shown

---

## 8. Testing Webhook Events

### Test Successful Payment
- [ ] Create subscription
- [ ] Watch Stripe CLI terminal
- [ ] Should see:
  - `customer.created`
  - `payment_method.attached`
  - `customer.subscription.created`
  - `invoice.created`
  - `invoice.paid`
- [ ] Verify each event processes without errors

### Test Failed Payment
- [ ] In Stripe Dashboard, find test subscription
- [ ] Click "..." → Update payment method
- [ ] Change to failing card: `4000 0000 0000 0341`
- [ ] Trigger invoice: "..." → Send invoice
- [ ] Watch webhook events:
  - `invoice.payment_failed`
- [ ] Verify subscription status updates to "past_due"

### Test Subscription Canceled
- [ ] In admin, cancel a subscription
- [ ] Watch webhook:
  - `customer.subscription.deleted`
- [ ] Verify status updates correctly

### Test Refund
- [ ] In Stripe Dashboard → Payments
- [ ] Find successful payment
- [ ] Click "Refund payment"
- [ ] Enter amount → Refund
- [ ] Watch webhook:
  - `charge.refunded`
- [ ] Verify refund recorded in admin

---

## 9. Testing Subscription Lifecycle

### Test Monthly Renewal
- [ ] Find active subscription in Stripe
- [ ] Note billing date
- [ ] Use Stripe CLI to advance clock:
```bash
stripe trigger customer.subscription.created
```
- [ ] Or in Dashboard → Billing → Test clocks
- [ ] Create test clock, advance 30 days
- [ ] Verify renewal invoice created and paid
- [ ] Verify subscription remains active

### Test Upgrade Plan
- [ ] As customer, go to subscription settings
- [ ] Click "Upgrade Plan"
- [ ] Select higher-tier plan
- [ ] Complete upgrade
- [ ] Verify prorated charge created
- [ ] Verify plan changed in admin
- [ ] Verify funnel limit updated

### Test Downgrade Plan
- [ ] Click "Change Plan"
- [ ] Select lower-tier plan
- [ ] Choose "Apply at period end"
- [ ] Verify scheduled change shown
- [ ] Advance time to period end
- [ ] Verify plan changed
- [ ] Verify credit applied

---

## 10. Testing 3D Secure (SCA)

### Test 3DS Required Card
- [ ] Use card: `4000 0027 6000 3184`
- [ ] Complete checkout
- [ ] Should see 3D Secure modal
- [ ] Click "Authenticate"
- [ ] Verify payment completes
- [ ] Check webhook shows `payment_intent.succeeded`

### Test 3DS Failed
- [ ] Use same card: `4000 0027 6000 3184`
- [ ] When modal appears, click "Fail"
- [ ] Verify payment fails
- [ ] Verify customer sees error
- [ ] Verify no charge created

---

## 11. Setting Up Production Webhooks

### Get Production URL
- [ ] Deploy your app to production
- [ ] Note your domain: `https://yourdomain.com`

### Create Production Webhook
- [ ] In Stripe Dashboard, toggle "Test mode" OFF
- [ ] Go to: Developers → Webhooks
- [ ] Click "Add endpoint"
- [ ] Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Description: "FunL Production Webhook"
- [ ] Select events to listen to:
  - `customer.created`
  - `customer.updated`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.created`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `checkout.session.completed`
  - `charge.refunded`
- [ ] Click "Add endpoint"

### Get Webhook Secret
- [ ] Click on webhook endpoint
- [ ] Click "Reveal" under "Signing secret"
- [ ] Copy secret (starts with `whsec_...`)
- [ ] Add to production environment variables

### Test Production Webhook
- [ ] In webhook details, click "Send test webhook"
- [ ] Select event type: `customer.subscription.created`
- [ ] Click "Send test webhook"
- [ ] Verify response is 200 OK
- [ ] Check your app logs for webhook processing

---

## 12. Switch to Production Mode

### Get Production API Keys
- [ ] In Stripe Dashboard, toggle "Test mode" OFF
- [ ] Go to: Developers → API Keys
- [ ] Copy **Publishable key** (starts with `pk_live_...`)
- [ ] Reveal and copy **Secret key** (starts with `sk_live_...`)

### Update Production Environment
- [ ] In your hosting platform (Vercel, etc.)
- [ ] Update environment variables:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (from step 11)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```
- [ ] Deploy the changes
- [ ] Restart your app

### Verify Production Setup
- [ ] Go to your live site
- [ ] Try to create subscription (use real card or test mode still active)
- [ ] Check Stripe Dashboard (Live mode) for activity
- [ ] Verify webhooks processing correctly

---

## 13. Pre-Flight Checklist

Before accepting real payments:

### Configuration
- [ ] Production API keys set
- [ ] Production webhook configured and tested
- [ ] Webhook signing secret set
- [ ] App URL correct in environment variables
- [ ] All products created in Stripe
- [ ] All prices configured

### Testing
- [ ] Test subscription flow end-to-end
- [ ] Test product purchase flow end-to-end
- [ ] Test failed payments
- [ ] Test webhook processing
- [ ] Test subscription upgrades/downgrades
- [ ] Test cancellations
- [ ] Test refunds

### Business Setup
- [ ] Bank account added for payouts
- [ ] Business details verified
- [ ] Tax settings configured
- [ ] Email receipts enabled
- [ ] Customer portal enabled
- [ ] Invoice settings configured

### Monitoring
- [ ] Set up Stripe email notifications
- [ ] Configure failed payment alerts
- [ ] Set up revenue tracking
- [ ] Enable fraud protection

### Legal
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Refund policy defined
- [ ] Stripe terms accepted

---

## 14. Common Issues & Solutions

### Webhooks Not Processing
- [ ] Check webhook URL is accessible (not localhost)
- [ ] Verify webhook secret matches environment variable
- [ ] Check application logs for errors
- [ ] Test webhook manually in Stripe Dashboard
- [ ] Verify events are selected in webhook configuration

### Payments Showing as Incomplete
- [ ] Check webhook events are being received
- [ ] Verify `checkout.session.completed` handler
- [ ] Check database for subscription/order records
- [ ] Review Stripe logs for errors

### Customer Can't Subscribe
- [ ] Verify Stripe API keys are correct
- [ ] Check API key has correct permissions
- [ ] Verify price IDs are correct
- [ ] Check browser console for errors
- [ ] Review Stripe Dashboard → Logs

### Subscription Status Not Updating
- [ ] Check webhook deliveries in Stripe
- [ ] Verify webhook endpoint is responding 200 OK
- [ ] Check webhook signature validation
- [ ] Review application error logs
- [ ] Manually sync from Stripe if needed

---

## 15. Testing Checklist Summary

Print this checklist and mark off as you test:

### Subscriptions
- [ ] New subscription with trial
- [ ] New subscription without trial
- [ ] Subscription renewal
- [ ] Upgrade plan
- [ ] Downgrade plan
- [ ] Cancel subscription
- [ ] Reactivate subscription
- [ ] Failed payment handling
- [ ] Past due subscriptions

### One-Time Payments
- [ ] Product purchase
- [ ] Multiple items in cart
- [ ] Different quantity tiers
- [ ] Payment success
- [ ] Payment failure
- [ ] Refund processing

### Webhooks
- [ ] Subscription created
- [ ] Payment succeeded
- [ ] Payment failed
- [ ] Subscription canceled
- [ ] Invoice paid
- [ ] Refund processed

### Error Handling
- [ ] Declined card
- [ ] Expired card
- [ ] Insufficient funds
- [ ] 3D Secure required
- [ ] 3D Secure failed
- [ ] Network error

---

## Test Cards Reference

```
✅ SUCCESS
Card: 4242 4242 4242 4242
Use: Standard successful payment

❌ DECLINED
Card: 4000 0000 0000 0002
Use: Generic decline

💳 INSUFFICIENT FUNDS
Card: 4000 0000 0000 9995
Use: Insufficient funds error

🔒 3D SECURE REQUIRED
Card: 4000 0027 6000 3184
Use: Test 3D Secure authentication

⚠️ PROCESSING ERROR
Card: 4000 0000 0000 0119
Use: Processing error

📅 EXPIRED
Card: 4000 0000 0000 0069
Use: Expired card error

🔐 MORE TEST CARDS
https://stripe.com/docs/testing
```

---

## Support Resources

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Test Cards**: https://stripe.com/docs/testing
- **Webhook Testing**: https://stripe.com/docs/webhooks/test
- **API Docs**: https://stripe.com/docs/api
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
