## COMPLETED - Product-Based Architecture Refactoring (Phase 1)

✅ **Database Schema Migration**
- Created `sellable_products` table for product catalog
- Created `subscription_plans` table for Basic & Pro plans
- Created `subscription_history` table for tracking subscriptions
- Created `subscription_addon_funnels` table for purchasable additional funnels
- Updated `businesses` table with subscription tracking
- Updated `purchase_orders` table to support product references
- Updated `reserved_codes` table for product-based inventory

✅ **Seed Data**
- Created Basic plan (5 funnels, $29/month, $7.50/week)
- Created Pro plan (10 funnels, $79/month, $20/week)
- Migrated all existing customers to Basic plan
- Created default sellable products from QR presets

✅ **Backend APIs**
- Subscription management (plans, current, upgrade, addon-funnels)
- Product catalog (list, details, pricing calculator)
- Funnel limit enforcement (can-create check)

✅ **Admin UI**
- Products management page with grid view
- Product editor component
- Updated admin navigation with Products link

✅ **Customer UI**
- Subscription management page with plan cards
- Current subscription panel with usage tracking
- Addon funnels panel with purchase/cancel
- Product shop page with featured/regular products
- Product cards with stock status

✅ **Funnel Limit System**
- Database functions for limit calculation
- Trigger to update funnel counts
- API endpoint to check creation ability
- FunnelLimitBanner component for warnings

✅ **Type Safety**
- All TypeScript errors resolved
- Type checking passes

---

## TODO - Remaining Work

### Phase 2: Stripe Integration for Subscriptions
- [ ] Create Stripe products for subscription plans
- [ ] Create Stripe prices for weekly/monthly billing
- [ ] Implement subscription creation webhook
- [ ] Implement subscription update webhook
- [ ] Add payment method management
- [ ] Test trial period flows

### Phase 3: Product Purchase Integration
- [ ] Update purchase flow to use sellable_products
- [ ] Create product-to-batch inventory mapping
- [ ] Build inventory allocation from batches
- [ ] Update checkout to show product details
- [ ] Test end-to-end purchase flow

### Phase 4: Inventory Management
- [ ] Build batch receipt workflow (auto-create/update inventory)
- [ ] Build manual inventory adjustment UI
- [ ] Create inventory movement tracking
- [ ] Build low stock alerts
- [ ] Test damaged/lost/found scenarios

### Phase 5: Testing & Documentation
- [ ] Test subscription upgrade/downgrade flows
- [ ] Test addon funnel purchase/cancel flows
- [ ] Test funnel creation with limits
- [ ] Test product purchase end-to-end
- [ ] Update user documentation

---

## Original Todo Items

Entry Pricing
$3.5 per week for each funl
Stickers $23 for 30x30 (white long term outdoor premium vinyl)
And goes down from there for volume - so very in expensive for 2m homes


Features
Removes friction - specifically designed to funl buyers in
Visually stunning - super easy for buyer to make contact - learn more - save property detail
You control the messaging
Fully Dynamic codes - updatable
Analytics - u learn what works - do more of it
Built in Messaging
Dead simple to use




commit
during debug, you said
I notice that the API calls are going directly to https://wwxcimelgqyilgzojyks.supabase.co/rest/v1/testimonials instead of our Next.js app's /api/testimonials route.

Are you able to review my entire code base to make sure the browser never goes direct to supabase?


Mobile preview is not matching user view
should be universal so they always match

funnel type (not tesimonial), when testimonials enabled, should not show share your experiences by default


Funel > Edit > mobile preview not showing wallet card, must match real preview

Video Showcase Funl is not built

Test process for deleting a funl that has purchased code assigned.

New customer onboarding process

A5 Flyer - Layout and test - Small business

Wallet card notifications system

Landing Page redesign

Pitch video

Re-order print workflow - build and test

Integrate stripe

Figure out initial pricing model

Integrate sms messaging


Build sticker in Create FUnl flow , throwing 404 error
body > div.min-h_100vh.bg_bg\.muted > main > div > div > button
/html/body/div[2]/main/div/div/button
<button class="color-palette_mint px_6 py_2 bg_colorPalette.default c_white fw_medium hover:bg_colorPalette.emphasized">Design Your Own Instead</button>

Reprint codes functionality for users to re buy
