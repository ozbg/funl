# Admin Management & Product Architecture - Comprehensive Development Plan

**Project:** FunL - Complete Admin Management Layer for Product-Based Architecture
**Created:** 2025-01-23
**Status:** In Progress
**Estimated Duration:** 40-60 hours

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Phase 1: Admin Subscription Management](#phase-1-admin-subscription-management)
3. [Phase 2: Admin Product Management](#phase-2-admin-product-management)
4. [Phase 3: Product-Batch Inventory System](#phase-3-product-batch-inventory-system)
5. [Phase 4: Subscription Plan Management](#phase-4-subscription-plan-management)
6. [Phase 5: Admin Dashboard & Analytics](#phase-5-admin-dashboard--analytics)
7. [Phase 6: Stripe Integration](#phase-6-stripe-integration)
8. [Phase 7: Testing & Documentation](#phase-7-testing--documentation)

---

## Overview

### Current State
- ✅ Database schema complete (products, subscriptions, plans, addon funnels)
- ✅ Customer-facing UI complete (browse products, manage subscription)
- ✅ Customer APIs complete
- ❌ Admin management UI **completely missing**
- ❌ Admin management APIs **completely missing**
- ❌ Product-batch inventory linking **missing**

### Goals
Build a **best-in-class admin management interface** inspired by Shopify's admin panel for:
- Managing customer subscriptions (assign, upgrade, cancel)
- Managing sellable products (CRUD, pricing, inventory)
- Linking QR batches to product inventory
- Managing subscription plans
- Tracking revenue, churn, and inventory metrics

### Design Principles
1. **Shopify-Inspired UX** - Clean, efficient, powerful bulk actions
2. **Defensive Security** - All admin actions logged, validated, reversible where possible
3. **Real-time Feedback** - Instant updates, loading states, error handling
4. **Audit Trail** - Track all changes with timestamps and admin users
5. **Mobile-Responsive** - Works on tablets and desktop

---

## Phase 1: Admin Subscription Management

**Goal:** Enable admins to view, assign, modify, and manage all customer subscriptions.

### 1.1 Database Migrations

#### 1.1.1 Create Subscription Audit Log Table
**Purpose:** Track all subscription changes made by admins.

```sql
CREATE TABLE subscription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- What changed
  subscription_history_id UUID REFERENCES subscription_history(id),
  business_id UUID REFERENCES businesses(id),
  action TEXT NOT NULL, -- 'created', 'plan_changed', 'canceled', 'reactivated', 'trial_extended', 'manual_adjustment'

  -- Changes
  old_values JSONB,
  new_values JSONB,

  -- Who & Why
  admin_id UUID REFERENCES businesses(id),
  admin_email TEXT,
  reason TEXT,
  notes TEXT,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_subscription_audit_log_subscription_id ON subscription_audit_log(subscription_history_id);
CREATE INDEX idx_subscription_audit_log_business_id ON subscription_audit_log(business_id);
CREATE INDEX idx_subscription_audit_log_admin_id ON subscription_audit_log(admin_id);
CREATE INDEX idx_subscription_audit_log_created_at ON subscription_audit_log(created_at DESC);
```

**Tasks:**
- [x] Create migration file
- [x] Apply via Supabase MCP
- [x] Verify indexes created

#### 1.1.2 Create Admin Action Helper Function
**Purpose:** Centralize audit logging for all admin actions.

```sql
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB,
  p_new_values JSONB,
  p_admin_id UUID,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_email TEXT;
BEGIN
  -- Get admin email
  SELECT email INTO v_admin_email
  FROM businesses
  WHERE id = p_admin_id;

  -- Log based on entity type
  IF p_entity_type = 'subscription' THEN
    INSERT INTO subscription_audit_log (
      subscription_history_id,
      business_id,
      action,
      old_values,
      new_values,
      admin_id,
      admin_email,
      reason,
      notes
    ) VALUES (
      p_entity_id,
      (SELECT business_id FROM subscription_history WHERE id = p_entity_id),
      p_action,
      p_old_values,
      p_new_values,
      p_admin_id,
      v_admin_email,
      p_reason,
      p_notes
    ) RETURNING id INTO v_log_id;
  END IF;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Tasks:**
- [x] Create function migration
- [x] Apply via Supabase MCP
- [x] Test with sample data

---

### 1.2 Admin Subscription APIs

#### 1.2.1 ✅ GET /api/admin/subscriptions
**Purpose:** List all subscriptions with filtering and pagination.

**Query Parameters:**
- `status` - Filter by status (active, trialing, canceled, past_due)
- `plan_id` - Filter by plan
- `search` - Search by business name or email
- `page` - Pagination
- `limit` - Results per page (default 50)
- `sort` - Sort by (created_at, business_name, plan_name, current_period_end)
- `order` - asc/desc

**Response:**
```typescript
{
  subscriptions: [
    {
      id: string
      business: {
        id: string
        name: string
        email: string
      }
      subscription_plan: {
        id: string
        name: string
        slug: string
        funnel_limit: number
      }
      status: string
      billing_period: string
      current_period_start: string
      current_period_end: string
      trial_end: string | null
      cancel_at_period_end: boolean

      // Calculated
      funnel_usage: {
        current: number
        limit: number
        addon_funnels: number
      }
      days_until_renewal: number
      stripe_subscription_id: string | null
    }
  ]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
  stats: {
    total_active: number
    total_trialing: number
    total_canceled: number
    mrr: number // Monthly recurring revenue
  }
}
```

**Implementation:**
```typescript
// app/api/admin/subscriptions/route.ts
export async function GET(request: NextRequest) {
  // 1. Verify admin
  // 2. Parse query params
  // 3. Build Supabase query with filters
  // 4. Calculate stats
  // 5. Return paginated results
}
```

**Tasks:**
- [ ] Create API route file
- [x] Implement admin authentication check
- [x] Build query with filters
- [x] Add pagination logic
- [x] Calculate stats (MRR, counts)
- [x] Add error handling
- [ ] Test with various filters
- [ ] Document API endpoint

---

#### 1.2.2 ✅ POST /api/admin/subscriptions/assign
**Purpose:** Manually assign a subscription to a business.

**Request Body:**
```typescript
{
  business_id: string
  plan_id: string
  billing_period: 'weekly' | 'monthly'
  start_date?: string // Defaults to now
  trial_days?: number // Override trial period
  skip_trial?: boolean // Skip trial entirely
  reason: string // Required for audit
  notes?: string
}
```

**Response:**
```typescript
{
  subscription: SubscriptionHistory
  message: string
  audit_log_id: string
}
```

**Implementation Steps:**
1. Verify admin privileges
2. Validate business exists and doesn't have active subscription
3. Validate plan exists
4. Create subscription_history record
5. Update business.current_subscription_id
6. Log admin action
7. Send notification email to customer

**Tasks:**
- [x] Create API route
- [x] Add validation logic
- [x] Implement subscription creation
- [x] Add audit logging
- [ ] Send email notification
- [ ] Handle errors (duplicate subscription, etc.)
- [ ] Test happy path
- [ ] Test error cases
- [ ] Document API

---

#### 1.2.3 ✅ PUT /api/admin/subscriptions/[id]
**Purpose:** Update subscription details (extend trial, change billing period, etc.)

**Request Body:**
```typescript
{
  action: 'extend_trial' | 'change_billing_period' | 'adjust_dates' | 'reactivate'

  // For extend_trial
  new_trial_end?: string

  // For change_billing_period
  new_billing_period?: 'weekly' | 'monthly'

  // For adjust_dates
  new_period_start?: string
  new_period_end?: string

  reason: string // Required
  notes?: string
}
```

**Tasks:**
- [x] Create API route
- [ ] Implement extend trial logic
- [ ] Implement change billing period
- [ ] Implement date adjustments
- [ ] Implement reactivation
- [ ] Add audit logging for each action
- [ ] Test each action type
- [ ] Document API

---

#### 1.2.4 ✅ POST /api/admin/subscriptions/[id]/cancel
**Purpose:** Cancel a subscription (immediately or at period end).

**Request Body:**
```typescript
{
  cancel_immediately: boolean
  reason: string
  refund_amount?: number // If immediate cancellation with refund
  notes?: string
}
```

**Tasks:**
- [x] Create API route
- [ ] Implement immediate cancellation
- [ ] Implement period-end cancellation
- [ ] Handle Stripe cancellation if connected
- [x] Add audit logging
- [ ] Send cancellation email
- [ ] Test both cancellation types
- [ ] Document API

---

#### 1.2.5 ✅ POST /api/admin/subscriptions/[id]/change-plan
**Purpose:** Upgrade or downgrade a customer's plan.

**Request Body:**
```typescript
{
  new_plan_id: string
  prorate: boolean // If true, calculate prorated refund/charge
  effective_date: 'immediate' | 'next_period'
  reason: string
  notes?: string
}
```

**Tasks:**
- [x] Create API route
- [ ] Implement immediate plan change
- [ ] Implement next-period plan change
- [ ] Calculate proration if needed
- [ ] Update funnel limits
- [x] Add audit logging
- [ ] Send plan change notification
- [ ] Test upgrade and downgrade
- [ ] Document API

---

#### 1.2.6 GET /api/admin/subscriptions/[businessId]/history
**Purpose:** View all subscription changes for a business.

**Response:**
```typescript
{
  history: [
    {
      id: string
      subscription_plan: { name, slug }
      status: string
      billing_period: string
      event_type: string // 'created', 'upgraded', 'downgraded', 'canceled'
      created_at: string
      notes: string
      admin: { email } | null
    }
  ]
  audit_logs: [
    {
      action: string
      old_values: object
      new_values: object
      admin_email: string
      reason: string
      created_at: string
    }
  ]
}
```

**Tasks:**
- [x] Create API route
- [ ] Fetch subscription history
- [ ] Fetch audit logs
- [ ] Combine and sort chronologically
- [ ] Test with business with multiple changes
- [ ] Document API

---

#### 1.2.7 ✅ POST /api/admin/addon-funnels/assign
**Purpose:** Manually add addon funnels to a business.

**Request Body:**
```typescript
{
  business_id: string
  quantity: number
  billing_period: 'weekly' | 'monthly'
  price_override?: number // Override default addon price
  start_date?: string
  reason: string
  notes?: string
}
```

**Tasks:**
- [x] Create API route
- [ ] Validate business has active subscription
- [ ] Create addon_funnel record
- [ ] Apply price override if provided
- [x] Add audit logging
- [ ] Send notification
- [ ] Test with various scenarios
- [ ] Document API

---

#### 1.2.8 ✅ DELETE /api/admin/addon-funnels/[id]
**Purpose:** Remove addon funnels (immediately or at period end).

**Request Body:**
```typescript
{
  cancel_immediately: boolean
  reason: string
  notes?: string
}
```

**Tasks:**
- [x] Create API route
- [ ] Implement immediate removal
- [ ] Implement period-end removal
- [ ] Verify funnel count won't cause issues
- [x] Add audit logging
- [ ] Send notification
- [ ] Test both removal types
- [ ] Document API

---

### 1.3 Admin Subscription UI

#### 1.3.1 ✅ Create Subscriptions List Page
**File:** `app/admin/subscriptions/page.tsx`

**Features:**
- Table with columns:
  - Business Name & Email (with avatar)
  - Current Plan (badge with color)
  - Status (badge: active=green, trialing=purple, canceled=red)
  - Funnels Used (X/Y with progress bar)
  - Billing Period (Weekly/Monthly)
  - Next Billing Date (with days countdown)
  - Stripe Status (synced icon)
  - Actions (dropdown menu)

- Filters:
  - Status tabs (All, Active, Trialing, Canceled)
  - Plan dropdown
  - Billing period dropdown
  - Search box (business name/email)

- Bulk Actions:
  - Export to CSV
  - Send notification email

- Stats Cards (top):
  - Total Active Subscriptions
  - Monthly Recurring Revenue (MRR)
  - Trial Conversions (this month)
  - Churn Rate

- Action Menu per row:
  - View Details
  - Change Plan
  - Add Addon Funnels
  - Extend Trial
  - Cancel Subscription
  - View History

**Tasks:**
- [ ] Create page file with layout
- [ ] Build stats cards component
- [ ] Build filter bar component
- [ ] Build subscriptions table component
- [ ] Add pagination controls
- [ ] Implement search functionality
- [ ] Add loading states
- [ ] Add empty states
- [ ] Test with 100+ subscriptions
- [ ] Mobile responsive design
- [ ] Add keyboard shortcuts
- [ ] Document component usage

---

#### 1.3.2 ✅ Create Assign Subscription Dialog
**Component:** `components/admin/AssignSubscriptionDialog.tsx`

**Features:**
- Business selector (search/autocomplete)
- Plan selector (cards with plan details)
- Billing period toggle (Weekly/Monthly)
- Trial options:
  - Use default trial (14 days)
  - Custom trial period (input days)
  - Skip trial
- Start date picker (default: today)
- Reason input (required)
- Notes textarea (optional)
- Preview section showing:
  - First billing date
  - First charge amount
  - Trial end date (if applicable)

**Validation:**
- Business must not have active subscription
- Plan must be active
- Custom trial days must be 0-90
- Reason must be at least 10 characters

**Tasks:**
- [ ] Create dialog component
- [ ] Build business search/select
- [ ] Build plan selector cards
- [ ] Add billing period toggle
- [ ] Add trial configuration
- [ ] Add date picker
- [ ] Build preview section
- [ ] Add form validation
- [ ] Implement submit logic
- [ ] Add success/error handling
- [ ] Add loading state
- [ ] Test all scenarios
- [ ] Document component

---

#### 1.3.3 ✅ Create Change Plan Dialog
**Component:** `components/admin/ChangePlanDialog.tsx`

**Features:**
- Current plan display (highlighted)
- New plan selector (exclude current plan)
- Billing period (maintain or change)
- Effective date:
  - Immediate (prorated)
  - Next billing cycle
- Proration calculation display
- Reason input (required)
- Notes textarea

**Tasks:**
- [ ] Create dialog component
- [ ] Show current plan details
- [ ] Build plan selector
- [ ] Add effective date options
- [ ] Calculate and display proration
- [ ] Add form validation
- [ ] Implement submit logic
- [ ] Add success/error handling
- [ ] Test upgrade scenarios
- [ ] Test downgrade scenarios
- [ ] Document component

---

#### 1.3.4 ✅ Create Extend Trial Dialog
**Component:** `components/admin/ExtendTrialDialog.tsx`

**Features:**
- Current trial end date display
- New trial end date picker
- Days extended calculation
- Reason selector (dropdown with common reasons):
  - Customer requested extension
  - Technical issues
  - Sales negotiation
  - Other (custom reason)
- Notes textarea

**Tasks:**
- [ ] Create dialog component
- [ ] Display current trial info
- [ ] Add date picker with validation
- [ ] Calculate days extended
- [ ] Add reason dropdown
- [ ] Add custom reason input
- [ ] Implement submit logic
- [ ] Add success/error handling
- [ ] Test various date ranges
- [ ] Document component

---

#### 1.3.5 ✅ Create Cancel Subscription Dialog
**Component:** `components/admin/CancelSubscriptionDialog.tsx`

**Features:**
- Cancellation timing:
  - Cancel immediately
  - Cancel at period end (recommended)
- Warning message about impact:
  - Funnel access will be removed
  - Data will be retained
- Reason dropdown:
  - Customer request
  - Payment failure
  - Abuse/Violation
  - Business closed
  - Other
- Refund section (if immediate):
  - Prorated refund calculation
  - Refund amount input (editable)
- Notes textarea
- Confirmation checkbox

**Tasks:**
- [ ] Create dialog component
- [ ] Add timing options
- [ ] Build warning messages
- [ ] Add reason dropdown
- [ ] Calculate refund amount
- [ ] Add refund input
- [ ] Add confirmation checkbox
- [ ] Implement submit logic
- [ ] Add success/error handling
- [ ] Test both cancellation types
- [ ] Document component

---

#### 1.3.6 ✅ Create Add Addon Funnels Dialog
**Component:** `components/admin/AddAddonFunnelsDialog.tsx`

**Features:**
- Quantity selector (1-100)
- Billing period (match subscription or override)
- Price per funnel:
  - Default from plan
  - Custom override (with reason)
- Start date (default: today)
- Total cost calculation
- Reason input
- Notes textarea

**Tasks:**
- [ ] Create dialog component
- [ ] Add quantity selector
- [ ] Add billing period toggle
- [ ] Show default price
- [ ] Add price override option
- [ ] Calculate total cost
- [ ] Add form validation
- [ ] Implement submit logic
- [ ] Add success/error handling
- [ ] Test with various quantities
- [ ] Document component

---

#### 1.3.7 ✅ Create Subscription History Panel
**Component:** `components/admin/SubscriptionHistoryPanel.tsx`

**Features:**
- Timeline view of all subscription events
- Each event shows:
  - Date & time
  - Event type (icon + label)
  - Plan change details (if applicable)
  - Admin who made change
  - Reason & notes
  - Old vs new values diff
- Expandable entries for detailed info
- Filter by event type
- Export history to PDF

**Tasks:**
- [ ] Create panel component
- [ ] Build timeline UI
- [ ] Create event type icons
- [ ] Build event detail cards
- [ ] Add diff display (old vs new)
- [ ] Add expand/collapse functionality
- [ ] Add event type filter
- [ ] Implement PDF export
- [ ] Test with long history
- [ ] Document component

---

#### 1.3.8 ✅ Create Subscription Detail Drawer
**Component:** `components/admin/SubscriptionDetailDrawer.tsx`

**Features:**
Slide-out drawer with tabs:

**Overview Tab:**
- Business info (name, email, avatar)
- Current plan details
- Status badges
- Billing info (period, next date, amount)
- Funnel usage (with progress bar)
- Addon funnels list
- Quick actions buttons

**History Tab:**
- SubscriptionHistoryPanel component

**Audit Log Tab:**
- All admin actions
- Filterable by admin, action type
- Downloadable CSV

**Invoices Tab (future):**
- Billing history
- Download invoices

**Tasks:**
- [ ] Create drawer component
- [ ] Build tab navigation
- [ ] Build overview tab
- [ ] Integrate history panel
- [ ] Build audit log tab
- [ ] Add quick action buttons
- [ ] Add loading states
- [ ] Test with various data
- [ ] Mobile responsive
- [ ] Document component

---

#### 1.3.9 ✅ Integration: Update Admin Nav
**File:** `components/admin/AdminNav.tsx`

**Tasks:**
- [ ] Add "Subscriptions" nav item
- [ ] Add badge showing count of trials ending soon
- [ ] Add badge showing count of payment issues
- [ ] Update active state logic
- [ ] Test navigation

---

#### 1.3.10 Integration: Enhance Users Page
**File:** `app/admin/users/page.tsx`

**Enhancements:**
- Add subscription columns to users table:
  - Plan name (badge)
  - Funnels (X/Y)
  - Status
- Add quick action: "Manage Subscription"
- Add filter: By subscription plan
- Add filter: By subscription status

**Tasks:**
- [ ] Update users query to include subscription
- [ ] Add subscription columns to table
- [ ] Add quick action button
- [ ] Add plan filter dropdown
- [ ] Add status filter dropdown
- [ ] Update UserDetailsDialog to show subscription tab
- [ ] Test with various users
- [ ] Document changes

---

### 1.4 Admin Subscription Components Library

#### 1.4.1 Reusable Components

**SubscriptionStatusBadge.tsx**
- Props: status, size
- Colors: active=green, trialing=purple, canceled=red, past_due=orange

**PlanBadge.tsx**
- Props: plan, size
- Shows plan name with color coding

**FunnelUsageBar.tsx**
- Props: current, limit, showNumbers
- Progress bar with color: green (<80%), orange (80-99%), red (100%)

**BillingPeriodToggle.tsx**
- Props: value, onChange
- Toggle between Weekly/Monthly

**BusinessAutocomplete.tsx**
- Props: onSelect, exclude (for filtering)
- Search businesses with debounce
- Shows avatar, name, email

**Tasks:**
- [ ] Create SubscriptionStatusBadge
- [ ] Create PlanBadge
- [ ] Create FunnelUsageBar
- [ ] Create BillingPeriodToggle
- [ ] Create BusinessAutocomplete
- [ ] Add Storybook stories for each
- [ ] Document component APIs

---

### 1.5 Testing & Validation

**Tasks:**
- [ ] Unit tests for all API endpoints
- [ ] Integration tests for subscription flows
- [ ] E2E tests for admin workflows:
  - [ ] Assign subscription
  - [ ] Change plan (upgrade)
  - [ ] Change plan (downgrade)
  - [ ] Extend trial
  - [ ] Cancel subscription (immediate)
  - [ ] Cancel subscription (period end)
  - [ ] Add addon funnels
  - [ ] Remove addon funnels
- [ ] Test with large datasets (1000+ subscriptions)
- [ ] Test edge cases:
  - [ ] Assign to business with existing subscription
  - [ ] Cancel already canceled subscription
  - [ ] Extend trial past next billing
  - [ ] Change plan during trial
- [ ] Performance testing for list page
- [ ] Security testing for admin-only access
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

---

### 1.6 Documentation

**Tasks:**
- [ ] Document all API endpoints (request/response)
- [ ] Create admin user guide for subscription management
- [ ] Document common workflows
- [ ] Create troubleshooting guide
- [ ] Add inline help text to UI
- [ ] Create video walkthrough

---

## Phase 2: Admin Product Management

**Goal:** Enable admins to create, edit, delete, and manage product inventory.

### 2.1 Database Migrations

#### 2.1.1 Create Product Audit Log Table

```sql
CREATE TABLE product_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  product_id UUID REFERENCES sellable_products(id),
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'inventory_adjusted', 'price_changed'

  old_values JSONB,
  new_values JSONB,

  admin_id UUID REFERENCES businesses(id),
  admin_email TEXT,
  reason TEXT,
  notes TEXT
);

CREATE INDEX idx_product_audit_log_product_id ON product_audit_log(product_id);
CREATE INDEX idx_product_audit_log_created_at ON product_audit_log(created_at DESC);
```

**Tasks:**
- [ ] Create migration
- [ ] Apply via Supabase MCP
- [ ] Verify indexes

---

#### 2.1.2 Create Inventory Adjustment Log Table

```sql
CREATE TABLE inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  product_id UUID REFERENCES sellable_products(id),
  adjustment_type TEXT NOT NULL, -- 'manual_add', 'manual_remove', 'batch_received', 'order_fulfilled', 'damaged', 'lost', 'found'
  quantity_change INTEGER NOT NULL, -- Positive or negative
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,

  -- Reference to source (if applicable)
  batch_id UUID REFERENCES qr_code_batches(id), -- If batch_received
  order_id UUID REFERENCES purchase_orders(id), -- If order_fulfilled

  admin_id UUID REFERENCES businesses(id),
  admin_email TEXT,
  reason TEXT,
  notes TEXT
);

CREATE INDEX idx_inventory_adjustments_product_id ON inventory_adjustments(product_id);
CREATE INDEX idx_inventory_adjustments_created_at ON inventory_adjustments(created_at DESC);
CREATE INDEX idx_inventory_adjustments_batch_id ON inventory_adjustments(batch_id);
```

**Tasks:**
- [ ] Create migration
- [ ] Apply via Supabase MCP
- [ ] Verify indexes

---

#### 2.1.3 Update log_admin_action Function
Extend to support product actions.

**Tasks:**
- [ ] Update function to handle product entity type
- [ ] Add inventory adjustment logging
- [ ] Test with sample data

---

### 2.2 Admin Product APIs

#### 2.2.1 POST /api/admin/products
**Purpose:** Create a new sellable product.

**Request Body:**
```typescript
{
  name: string
  slug: string // Auto-generated from name if not provided
  description: string
  product_type: 'qr_sticker' | 'subscription' | 'addon_funnel'

  pricing_tiers: Array<{
    min_quantity: number
    max_quantity: number | null
    unit_price: number
  }>

  available_sizes: string[]
  size_pricing: Record<string, number> // Size multipliers

  is_active: boolean
  featured: boolean
  display_order: number

  tracks_inventory: boolean
  current_stock: number
  low_stock_threshold: number

  min_purchase_quantity: number
  max_purchase_quantity: number | null

  thumbnail_url?: string
  images?: string[]

  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]

  reason: string // Why creating this product
  notes?: string
}
```

**Tasks:**
- [x] Create API route
- [ ] Validate all fields
- [ ] Auto-generate slug from name if not provided
- [ ] Ensure slug is unique
- [ ] Create product record
- [ ] Log admin action
- [ ] Return created product
- [ ] Handle errors
- [ ] Test validation
- [ ] Document API

---

#### 2.2.2 PUT /api/admin/products/[id]
**Purpose:** Update product details.

**Request Body:** Same as POST, all fields optional except reason.

**Special Handling:**
- If pricing changed, create audit log with old vs new
- If inventory changed, log as inventory adjustment

**Tasks:**
- [x] Create API route
- [ ] Validate fields
- [ ] Detect what changed
- [ ] Update product record
- [ ] Log pricing changes separately
- [ ] Log inventory changes as adjustments
- [ ] Log general admin action
- [ ] Return updated product
- [ ] Test various update scenarios
- [ ] Document API

---

#### 2.2.3 DELETE /api/admin/products/[id]
**Purpose:** Soft delete (archive) a product.

**Request Body:**
```typescript
{
  reason: string
  notes?: string
}
```

**Validation:**
- Cannot delete if inventory > 0 (must adjust to 0 first)
- Cannot delete if active orders exist

**Tasks:**
- [x] Create API route
- [ ] Validate can delete
- [ ] Set deleted_at timestamp
- [ ] Set is_active = false
- [ ] Log admin action
- [ ] Return success message
- [ ] Test validation
- [ ] Document API

---

#### 2.2.4 POST /api/admin/products/[id]/adjust-inventory
**Purpose:** Manually adjust product stock.

**Request Body:**
```typescript
{
  adjustment_type: 'add' | 'remove' | 'set'
  quantity: number // Amount to add/remove, or new total if 'set'
  reason: 'received' | 'damaged' | 'lost' | 'found' | 'correction' | 'other'
  notes?: string
}
```

**Logic:**
- If adjustment_type = 'add': current_stock += quantity
- If adjustment_type = 'remove': current_stock -= quantity (validate >= 0)
- If adjustment_type = 'set': current_stock = quantity

**Tasks:**
- [x] Create API route
- [ ] Validate adjustment type
- [ ] Validate quantity
- [ ] Calculate new stock level
- [ ] Update product.current_stock
- [ ] Create inventory_adjustments record
- [ ] Log admin action
- [ ] Return new stock level
- [ ] Test all adjustment types
- [ ] Document API

---

#### 2.2.5 GET /api/admin/products/[id]/inventory-history
**Purpose:** View all inventory adjustments for a product.

**Response:**
```typescript
{
  product: {
    id: string
    name: string
    current_stock: number
  }
  adjustments: Array<{
    id: string
    created_at: string
    adjustment_type: string
    quantity_change: number
    quantity_before: number
    quantity_after: number
    admin_email: string
    reason: string
    notes: string
    batch?: { batch_number, name }
    order?: { order_number }
  }>
  stats: {
    total_received: number
    total_removed: number
    total_sold: number
  }
}
```

**Tasks:**
- [x] Create API route
- [ ] Fetch product details
- [ ] Fetch all adjustments
- [ ] Join batch/order info
- [x] Calculate stats
- [ ] Sort by date descending
- [ ] Return formatted data
- [ ] Test with product with history
- [ ] Document API

---

#### 2.2.6 POST /api/admin/products/[id]/upload-image
**Purpose:** Upload product thumbnail or gallery images.

**Implementation:**
- Use Supabase Storage
- Bucket: `product-images`
- Folder structure: `product-images/{product_id}/{filename}`
- Allowed formats: JPEG, PNG, WebP
- Max size: 5MB
- Auto-resize to multiple sizes (thumbnail, medium, large)

**Request:** multipart/form-data with image file

**Response:**
```typescript
{
  url: string // Public URL
  sizes: {
    thumbnail: string // 200x200
    medium: string // 600x600
    large: string // 1200x1200
  }
}
```

**Tasks:**
- [x] Create API route
- [ ] Set up Supabase Storage bucket
- [ ] Implement file upload
- [ ] Validate file type and size
- [ ] Resize to multiple sizes (use sharp)
- [ ] Upload to Supabase Storage
- [ ] Update product.thumbnail_url or images array
- [ ] Return URLs
- [ ] Test image upload
- [ ] Document API

---

#### 2.2.7 GET /api/admin/products/[id]/pricing-history
**Purpose:** View pricing changes over time.

**Response:**
```typescript
{
  product: {
    id: string
    name: string
  }
  changes: Array<{
    created_at: string
    admin_email: string
    reason: string
    old_pricing_tiers: object
    new_pricing_tiers: object
    old_size_pricing: object
    new_size_pricing: object
  }>
}
```

**Tasks:**
- [x] Create API route
- [ ] Fetch product_audit_log filtered by price_changed
- [ ] Parse old/new values
- [ ] Format for display
- [ ] Test with product with price changes
- [ ] Document API

---

#### 2.2.8 GET /api/admin/products
**Purpose:** List all products with admin filters (including deleted).

**Query Params:**
- `include_deleted` - Show archived products
- `status` - active, inactive, all
- `search` - Product name
- `sort` - name, created_at, stock, price
- `order` - asc, desc

**Response:**
```typescript
{
  products: Array<{
    id: string
    name: string
    slug: string
    product_type: string
    is_active: boolean
    featured: boolean
    current_stock: number
    low_stock_threshold: number
    lowest_price: number
    created_at: string
    deleted_at: string | null
  }>
}
```

**Tasks:**
- [x] Create API route
- [x] Build query with filters
- [ ] Calculate lowest_price
- [ ] Sort results
- [ ] Return products
- [ ] Test filters
- [ ] Document API

---

### 2.3 Admin Product UI

#### 2.3.1 Enhance Products List Page
**File:** `app/admin/products/page.tsx`

**Current State:** Basic grid view exists

**Enhancements:**
- Switch between Grid and Table view
- Table columns:
  - Thumbnail
  - Product Name
  - Type
  - Stock (with low stock warning)
  - Lowest Price
  - Status (Active/Inactive)
  - Featured (star icon)
  - Actions
- Filters:
  - Status (Active/Inactive/All)
  - Type (QR Sticker/Subscription/Addon)
  - Stock level (All/In Stock/Low Stock/Out of Stock)
  - Search
- Bulk actions:
  - Enable/Disable
  - Mark as Featured
  - Export to CSV
- Stats cards:
  - Total Products
  - Out of Stock Products
  - Low Stock Products
  - Total Inventory Value

**Tasks:**
- [ ] Add view toggle (Grid/Table)
- [ ] Build table view component
- [ ] Add all filter options
- [ ] Add bulk action checkboxes
- [ ] Implement bulk actions
- [ ] Build stats cards
- [ ] Add "Create Product" button
- [ ] Update grid view to match new design
- [ ] Add loading states
- [ ] Add empty states
- [ ] Test with 100+ products
- [ ] Mobile responsive
- [ ] Document component

---

#### 2.3.2 Create Product Detail Page
**File:** `app/admin/products/[slug]/page.tsx`

**Layout:**
- Header with product name, status badge, and actions
- Left sidebar: Product image gallery
- Main content area with tabs:
  - **Details Tab**
  - **Pricing Tab**
  - **Inventory Tab**
  - **Analytics Tab** (future)

**Details Tab:**
- ProductEditor component (already exists)
- Add image upload section
- Add SEO fields

**Pricing Tab:**
- PricingTiersEditor (already exists)
- Size pricing editor
- Pricing history timeline
- "Schedule Price Change" button (future)

**Inventory Tab:**
- Current stock (large display)
- Low stock threshold
- Stock status indicator
- "Adjust Inventory" button
- Inventory adjustments history table
- "Link Batch" button
- Linked batches list

**Tasks:**
- [ ] Create product detail page
- [ ] Build page header
- [ ] Add tab navigation
- [ ] Integrate ProductEditor in details tab
- [ ] Add image upload UI
- [ ] Build pricing tab
- [ ] Add pricing history display
- [ ] Build inventory tab
- [ ] Add adjust inventory button
- [ ] Add inventory history table
- [ ] Add linked batches section
- [ ] Add loading states
- [ ] Test with various products
- [ ] Mobile responsive
- [ ] Document page

---

#### 2.3.3 Create New Product Page
**File:** `app/admin/products/new/page.tsx`

**Features:**
- Multi-step form wizard:
  1. Basic Info (name, description, type)
  2. Pricing (tiers, sizes, multipliers)
  3. Inventory (tracking, initial stock, threshold)
  4. Images & SEO
  5. Review & Create

- Save as draft functionality
- Validation at each step
- Progress indicator
- "Save & Add Another" option

**Tasks:**
- [ ] Create new product page
- [ ] Build multi-step wizard component
- [ ] Build step 1: Basic info form
- [ ] Build step 2: Pricing form
- [ ] Build step 3: Inventory form
- [ ] Build step 4: Images & SEO form
- [ ] Build step 5: Review summary
- [ ] Add step validation
- [ ] Add progress indicator
- [ ] Implement save as draft
- [ ] Implement create product
- [ ] Add success redirect
- [ ] Test complete flow
- [ ] Document page

---

#### 2.3.4 Create Adjust Inventory Dialog
**Component:** `components/admin/AdjustInventoryDialog.tsx`

**Features:**
- Current stock display (large number)
- Adjustment type selector:
  - Add Stock (green)
  - Remove Stock (red)
  - Set Stock (blue)
- Quantity input
- New stock calculation preview
- Reason dropdown:
  - Received from supplier
  - Damaged goods
  - Lost in warehouse
  - Found in warehouse
  - Inventory correction
  - Other
- Notes textarea
- Warning if setting to 0 or very low

**Tasks:**
- [ ] Create dialog component
- [ ] Display current stock
- [ ] Build adjustment type selector
- [ ] Add quantity input
- [ ] Calculate new stock preview
- [ ] Add reason dropdown
- [ ] Add notes textarea
- [ ] Add validation
- [ ] Add warnings for low stock
- [ ] Implement submit
- [ ] Test all adjustment types
- [ ] Document component

---

#### 2.3.5 Create Product Image Upload Component
**Component:** `components/admin/ProductImageUpload.tsx`

**Features:**
- Drag & drop area
- Click to browse
- Multiple file selection
- Image preview before upload
- Crop/resize tool
- Set as thumbnail option
- Delete image
- Reorder gallery images (drag to reorder)
- Progress indicators during upload

**Tasks:**
- [ ] Create upload component
- [ ] Implement drag & drop
- [ ] Add file browser
- [ ] Add image preview
- [ ] Integrate image cropper (use react-image-crop)
- [ ] Add set thumbnail option
- [ ] Implement upload to API
- [ ] Add progress indicators
- [ ] Add delete functionality
- [ ] Add reorder functionality (use dnd-kit)
- [ ] Add validation (file type, size)
- [ ] Test with multiple images
- [ ] Document component

---

#### 2.3.6 Create Inventory History Table
**Component:** `components/admin/InventoryHistoryTable.tsx`

**Features:**
- Table columns:
  - Date & Time
  - Type (with icon)
  - Quantity Change (+/- with color)
  - Before → After
  - Admin
  - Reason
  - Notes (expandable)
  - Related (link to batch/order if applicable)
- Filter by adjustment type
- Export to CSV
- Pagination

**Tasks:**
- [ ] Create table component
- [ ] Add all columns
- [ ] Add type icons
- [ ] Color code quantity changes
- [ ] Add expandable notes
- [ ] Add links to related entities
- [ ] Add filter dropdown
- [ ] Implement CSV export
- [ ] Add pagination
- [ ] Test with long history
- [ ] Document component

---

#### 2.3.7 Create Pricing History Timeline
**Component:** `components/admin/PricingHistoryTimeline.tsx`

**Features:**
- Timeline view of price changes
- Each entry shows:
  - Date
  - Admin who made change
  - Reason
  - Before/After comparison table
  - Percent change calculation
- Visual diff highlighting
- Expandable details

**Tasks:**
- [ ] Create timeline component
- [ ] Build timeline UI
- [ ] Create before/after comparison table
- [ ] Calculate percent changes
- [ ] Add visual diff highlighting
- [ ] Add expand/collapse
- [ ] Test with multiple price changes
- [ ] Document component

---

### 2.4 Testing & Validation

**Tasks:**
- [ ] Unit tests for all product APIs
- [ ] E2E tests for product workflows:
  - [ ] Create new product
  - [ ] Edit product details
  - [ ] Update pricing
  - [ ] Adjust inventory (all types)
  - [ ] Upload images
  - [ ] Delete product
- [ ] Test image upload with various formats
- [ ] Test inventory adjustment edge cases
- [ ] Performance test with large product catalog
- [ ] Security test for admin-only access
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

---

### 2.5 Documentation

**Tasks:**
- [ ] Document all product APIs
- [ ] Create admin guide for product management
- [ ] Document inventory management workflows
- [ ] Create troubleshooting guide
- [ ] Add inline help text
- [ ] Create video walkthrough

---

## Phase 3: Product-Batch Inventory System

**Goal:** Link QR code batches to sellable products for automatic inventory management.

### 3.1 Database Migrations

#### 3.1.1 Create Product-Batch Junction Table

```sql
CREATE TABLE product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  product_id UUID NOT NULL REFERENCES sellable_products(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES qr_code_batches(id) ON DELETE CASCADE,

  -- How many codes from this batch contribute to this product
  allocated_codes INTEGER NOT NULL DEFAULT 0,

  -- Track status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'received', 'active', 'depleted'

  -- Admin who linked
  linked_by UUID REFERENCES businesses(id),
  linked_at TIMESTAMPTZ DEFAULT NOW(),

  -- Notes
  notes TEXT,

  UNIQUE(product_id, batch_id)
);

CREATE INDEX idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX idx_product_batches_batch_id ON product_batches(batch_id);
CREATE INDEX idx_product_batches_status ON product_batches(status);
```

**Tasks:**
- [ ] Create migration
- [ ] Apply via Supabase MCP
- [ ] Verify indexes
- [ ] Verify unique constraint

---

#### 3.1.2 Create Function: Auto-Update Product Inventory on Batch Receipt

```sql
CREATE OR REPLACE FUNCTION auto_update_product_inventory_on_batch()
RETURNS TRIGGER AS $$
DECLARE
  v_product_batch RECORD;
  v_codes_count INTEGER;
BEGIN
  -- Only trigger when batch status changes to 'received'
  IF NEW.status = 'received' AND OLD.status != 'received' THEN

    -- For each product linked to this batch
    FOR v_product_batch IN
      SELECT pb.*, sp.current_stock, sp.tracks_inventory
      FROM product_batches pb
      JOIN sellable_products sp ON sp.id = pb.product_id
      WHERE pb.batch_id = NEW.id
      AND pb.status = 'active'
    LOOP
      -- Count available codes in batch
      SELECT COUNT(*) INTO v_codes_count
      FROM qr_codes
      WHERE batch_id = NEW.id
      AND status = 'available';

      -- Update product_batches allocated count
      UPDATE product_batches
      SET allocated_codes = v_codes_count
      WHERE id = v_product_batch.id;

      -- Update product stock if tracking inventory
      IF v_product_batch.tracks_inventory THEN
        UPDATE sellable_products
        SET current_stock = current_stock + v_codes_count
        WHERE id = v_product_batch.product_id;

        -- Log inventory adjustment
        INSERT INTO inventory_adjustments (
          product_id,
          adjustment_type,
          quantity_change,
          quantity_before,
          quantity_after,
          batch_id,
          reason,
          notes
        ) VALUES (
          v_product_batch.product_id,
          'batch_received',
          v_codes_count,
          v_product_batch.current_stock,
          v_product_batch.current_stock + v_codes_count,
          NEW.id,
          'Batch received from printer',
          'Auto-updated from batch: ' || NEW.batch_number
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batch_received_update_inventory
AFTER UPDATE ON qr_code_batches
FOR EACH ROW
EXECUTE FUNCTION auto_update_product_inventory_on_batch();
```

**Tasks:**
- [ ] Create function migration
- [ ] Apply via Supabase MCP
- [ ] Test with sample batch status update
- [ ] Verify inventory updates correctly
- [ ] Verify adjustment log created

---

### 3.2 Admin Product-Batch APIs

#### 3.2.1 POST /api/admin/products/[productId]/link-batch
**Purpose:** Link a QR batch to a product.

**Request Body:**
```typescript
{
  batch_id: string
  notes?: string
}
```

**Validation:**
- Batch must exist
- Batch cannot already be linked to this product
- Product must track inventory

**Logic:**
- Create product_batches record with status='pending'
- If batch status is already 'received', trigger inventory update

**Tasks:**
- [x] Create API route
- [ ] Validate batch exists
- [ ] Check for duplicate link
- [ ] Create product_batches record
- [ ] Check if batch received, update inventory
- [ ] Log admin action
- [ ] Return success
- [ ] Test linking
- [ ] Document API

---

#### 3.2.2 DELETE /api/admin/products/[productId]/unlink-batch/[batchId]
**Purpose:** Unlink a batch from a product.

**Request Body:**
```typescript
{
  adjust_inventory: boolean // If true, reduce product stock by allocated_codes
  reason: string
  notes?: string
}
```

**Tasks:**
- [x] Create API route
- [ ] Fetch product_batch record
- [ ] If adjust_inventory, reduce stock
- [ ] Delete product_batch record
- [ ] Log adjustment if inventory changed
- [ ] Log admin action
- [ ] Return success
- [ ] Test unlinking
- [ ] Document API

---

#### 3.2.3 GET /api/admin/products/[productId]/batches
**Purpose:** List all batches linked to a product.

**Response:**
```typescript
{
  product: {
    id: string
    name: string
    current_stock: number
  }
  batches: Array<{
    id: string
    batch_id: string
    batch_number: string
    batch_name: string
    allocated_codes: number
    status: string
    linked_at: string
    linked_by_email: string
    notes: string
  }>
  total_allocated: number
}
```

**Tasks:**
- [x] Create API route
- [ ] Fetch product details
- [ ] Fetch linked batches
- [ ] Join batch details
- [ ] Calculate total allocated
- [ ] Return formatted data
- [ ] Test with product with multiple batches
- [ ] Document API

---

#### 3.2.4 GET /api/admin/batches/[batchId]/products
**Purpose:** List all products this batch is linked to (reverse lookup).

**Response:**
```typescript
{
  batch: {
    id: string
    batch_number: string
    name: string
    total_codes: number
  }
  products: Array<{
    product_id: string
    product_name: string
    allocated_codes: number
    status: string
  }>
  unallocated_codes: number
}
```

**Tasks:**
- [x] Create API route
- [ ] Fetch batch details
- [ ] Fetch linked products
- [ ] Calculate unallocated codes
- [ ] Return formatted data
- [ ] Test with batch linked to multiple products
- [ ] Document API

---

### 3.3 Admin Product-Batch UI

#### 3.3.1 Enhance Batch Detail Page
**File:** `app/admin/qr-batches/[id]/page.tsx`

**Add Section: "Product Assignments"**
- Table of products this batch is linked to
- Columns:
  - Product Name
  - Allocated Codes
  - Status
  - Actions (Unlink)
- "Link to Product" button
- Show unallocated codes count

**Tasks:**
- [ ] Add product assignments section
- [ ] Fetch linked products
- [ ] Build table component
- [ ] Add "Link to Product" button
- [ ] Show unallocated count
- [ ] Add unlink functionality
- [ ] Test with batch linked to products
- [ ] Document changes

---

#### 3.3.2 Create Link Batch to Product Dialog
**Component:** `components/admin/LinkBatchDialog.tsx`

**Features:**
- Product selector (dropdown with search)
- Show product current stock
- Show batch available codes count
- Preview: "Adding X codes will increase stock to Y"
- Notes textarea
- Confirmation button

**Tasks:**
- [ ] Create dialog component
- [ ] Build product selector
- [ ] Fetch batch codes count
- [ ] Calculate stock preview
- [ ] Add notes input
- [ ] Implement submit
- [ ] Add success/error handling
- [ ] Test linking
- [ ] Document component

---

#### 3.3.3 Create Unlink Batch Dialog
**Component:** `components/admin/UnlinkBatchDialog.tsx`

**Features:**
- Show batch and product info
- Checkbox: "Adjust inventory (reduce stock by X)"
- Warning if unchecked: "Stock will not be adjusted"
- Reason input
- Notes textarea
- Confirmation

**Tasks:**
- [ ] Create dialog component
- [ ] Display batch/product info
- [ ] Add adjust inventory checkbox
- [ ] Add warning message
- [ ] Add reason input
- [ ] Implement submit
- [ ] Test both scenarios (adjust/no adjust)
- [ ] Document component

---

#### 3.3.4 Enhance Product Inventory Tab
**In:** `app/admin/products/[slug]/page.tsx`

**Add Section: "Linked Batches"**
- Table of batches contributing to this product's inventory
- Columns:
  - Batch Number
  - Batch Name
  - Allocated Codes
  - Status
  - Linked Date
  - Actions (Unlink)
- "Link Batch" button
- Show total codes from all batches

**Tasks:**
- [ ] Add linked batches section to inventory tab
- [ ] Fetch linked batches
- [ ] Build batches table
- [ ] Add "Link Batch" button
- [ ] Calculate total from batches
- [ ] Add unlink functionality
- [ ] Test with product with multiple batches
- [ ] Document changes

---

### 3.4 Testing & Validation

**Tasks:**
- [ ] Unit tests for product-batch APIs
- [ ] Test auto-inventory update trigger
- [ ] E2E tests for batch linking workflows:
  - [ ] Link batch to product
  - [ ] Batch received triggers inventory update
  - [ ] Unlink batch with inventory adjustment
  - [ ] Unlink batch without adjustment
  - [ ] Link batch to multiple products
- [ ] Test edge cases:
  - [ ] Link batch with no codes
  - [ ] Link already linked batch
  - [ ] Unlink when product has orders
- [ ] Performance test with many batches
- [ ] Document test cases

---

### 3.5 Documentation

**Tasks:**
- [ ] Document product-batch linking system
- [ ] Create admin guide for inventory workflows
- [ ] Document auto-inventory update behavior
- [ ] Create troubleshooting guide
- [ ] Add inline help text

---

## Phase 4: Subscription Plan Management

**Goal:** Enable admins to create, edit, and manage subscription plans.

### 4.1 Database Migrations

#### 4.1.1 Create Plan Audit Log Table

```sql
CREATE TABLE plan_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  plan_id UUID REFERENCES subscription_plans(id),
  action TEXT NOT NULL,

  old_values JSONB,
  new_values JSONB,

  admin_id UUID REFERENCES businesses(id),
  admin_email TEXT,
  reason TEXT,
  notes TEXT
);

CREATE INDEX idx_plan_audit_log_plan_id ON plan_audit_log(plan_id);
CREATE INDEX idx_plan_audit_log_created_at ON plan_audit_log(created_at DESC);
```

**Tasks:**
- [ ] Create migration
- [ ] Apply via Supabase MCP
- [ ] Verify indexes

---

### 4.2 Admin Plan APIs

#### 4.2.1 GET /api/admin/subscription-plans
**Purpose:** List all plans (including inactive).

**Query Params:**
- `include_inactive` - Show inactive plans

**Response:**
```typescript
{
  plans: Array<{
    id: string
    name: string
    slug: string
    price_monthly: number
    price_weekly: number
    funnel_limit: number
    is_active: boolean
    is_default: boolean
    featured: boolean
    created_at: string

    // Stats
    customer_count: number
    mrr_contribution: number
  }>
  stats: {
    total_plans: number
    active_plans: number
  }
}
```

**Tasks:**
- [x] Create API route
- [ ] Fetch all plans
- [ ] Count customers per plan
- [ ] Calculate MRR contribution
- [ ] Return formatted data
- [ ] Test with various plans
- [ ] Document API

---

#### 4.2.2 POST /api/admin/subscription-plans
**Purpose:** Create a new subscription plan.

**Request Body:**
```typescript
{
  name: string
  slug: string
  description: string
  price_monthly: number
  price_weekly: number
  billing_period: 'monthly' | 'weekly'
  trial_period_days: number
  funnel_limit: number
  features: string[]
  addon_funnel_price_monthly: number
  addon_funnel_price_weekly: number
  is_active: boolean
  is_default: boolean
  featured: boolean
  display_order: number
  tagline?: string
  cta_text?: string
  reason: string
  notes?: string
}
```

**Tasks:**
- [x] Create API route
- [ ] Validate all fields
- [ ] Ensure slug is unique
- [ ] If is_default=true, unset other defaults
- [ ] Create plan record
- [ ] Log admin action
- [ ] Return created plan
- [ ] Test plan creation
- [ ] Document API

---

#### 4.2.3 PUT /api/admin/subscription-plans/[id]
**Purpose:** Update plan details.

**Important:** Changing price affects only NEW subscriptions. Existing subscriptions keep their locked-in price from plan_snapshot.

**Request Body:** Same as POST, all optional except reason.

**Tasks:**
- [x] Create API route
- [ ] Validate fields
- [ ] Update plan record
- [ ] If is_default changed, update other plans
- [ ] Log admin action
- [ ] Return updated plan
- [ ] Test updates
- [ ] Document API

---

#### 4.2.4 DELETE /api/admin/subscription-plans/[id]
**Purpose:** Archive a plan (soft delete).

**Validation:**
- Cannot delete if customers are currently on this plan
- Must migrate customers first

**Request Body:**
```typescript
{
  reason: string
  notes?: string
}
```

**Tasks:**
- [x] Create API route
- [ ] Check if customers exist
- [ ] Set deleted_at
- [ ] Set is_active = false
- [ ] Log admin action
- [ ] Return success
- [ ] Test deletion
- [ ] Document API

---

#### 4.2.5 GET /api/admin/subscription-plans/[id]/customers
**Purpose:** List all customers on a specific plan.

**Response:**
```typescript
{
  plan: {
    id: string
    name: string
  }
  customers: Array<{
    business_id: string
    business_name: string
    email: string
    subscription_status: string
    started_at: string
    billing_period: string
  }>
  total: number
  mrr: number
}
```

**Tasks:**
- [x] Create API route
- [ ] Fetch plan details
- [ ] Fetch customers on plan
- [ ] Calculate MRR
- [ ] Return formatted data
- [ ] Test with plan with customers
- [ ] Document API

---

### 4.3 Admin Plan UI

#### 4.3.1 Create Subscription Plans Page
**File:** `app/admin/subscription-plans/page.tsx`

**Features:**
- Table view of all plans
- Columns:
  - Plan Name (with badge)
  - Pricing (Monthly / Weekly)
  - Funnel Limit
  - Customers (count)
  - MRR Contribution
  - Status (Active/Inactive)
  - Featured (star)
  - Default (checkmark)
  - Actions
- Stats cards:
  - Total Plans
  - Total Active Subscriptions
  - Total MRR
  - Average Revenue Per User (ARPU)
- "Create Plan" button
- Action menu per row:
  - Edit
  - View Customers
  - Duplicate
  - Archive

**Tasks:**
- [ ] Create page file
- [ ] Build stats cards
- [ ] Build plans table
- [ ] Add action menu
- [ ] Add "Create Plan" button
- [ ] Add loading states
- [ ] Add empty states
- [ ] Test with multiple plans
- [ ] Mobile responsive
- [ ] Document page

---

#### 4.3.2 Create Plan Detail Page
**File:** `app/admin/subscription-plans/[slug]/page.tsx`

**Layout:**
- Header with plan name and status
- Tabs:
  - **Details Tab** - Plan editor form
  - **Customers Tab** - List of customers on this plan
  - **History Tab** - Price/feature changes over time

**Details Tab:**
- Editable form with all plan fields
- Save button

**Customers Tab:**
- Table of customers
- Columns: Business, Email, Status, Billing Period, Started Date
- Quick action: Change Plan

**History Tab:**
- Timeline of plan changes
- Show what changed, who changed it, when, why

**Tasks:**
- [ ] Create page file
- [ ] Build header
- [ ] Add tab navigation
- [ ] Build details tab form
- [ ] Build customers tab table
- [ ] Build history tab timeline
- [ ] Add save functionality
- [ ] Test with plan with data
- [ ] Mobile responsive
- [ ] Document page

---

#### 4.3.3 Create New Plan Page
**File:** `app/admin/subscription-plans/new/page.tsx`

**Features:**
- Form with all plan fields
- Real-time preview card (shows how it looks to customers)
- Validation
- "Save & Create Another" option

**Tasks:**
- [ ] Create page file
- [ ] Build form with all fields
- [ ] Add features array editor (add/remove)
- [ ] Build preview card
- [ ] Add validation
- [ ] Implement create
- [ ] Add "Save & Create Another"
- [ ] Test plan creation
- [ ] Document page

---

#### 4.3.4 Create Plan Editor Form
**Component:** `components/admin/PlanEditorForm.tsx`

**Sections:**
1. Basic Info
   - Name, Slug, Description
   - Tagline, CTA Text

2. Pricing
   - Monthly Price
   - Weekly Price
   - Trial Period (days)

3. Features & Limits
   - Funnel Limit
   - Features list (dynamic array)

4. Addon Pricing
   - Monthly price per addon funnel
   - Weekly price per addon funnel

5. Display Settings
   - Display Order
   - Is Active toggle
   - Is Default toggle (with warning)
   - Featured toggle

**Tasks:**
- [ ] Create form component
- [ ] Build basic info section
- [ ] Build pricing section
- [ ] Build features list editor (dynamic)
- [ ] Build addon pricing section
- [ ] Build display settings
- [ ] Add validation
- [ ] Add save handler
- [ ] Test all fields
- [ ] Document component

---

#### 4.3.5 Create Plan Customers Table
**Component:** `components/admin/PlanCustomersTable.tsx`

**Features:**
- Same as subscription list but filtered to plan
- Quick actions:
  - Change to different plan
  - View subscription details

**Tasks:**
- [ ] Create table component
- [ ] Fetch customers for plan
- [ ] Build table with columns
- [ ] Add quick actions
- [ ] Add pagination
- [ ] Test with plan with many customers
- [ ] Document component

---

### 4.4 Testing & Validation

**Tasks:**
- [ ] Unit tests for all plan APIs
- [ ] E2E tests for plan workflows:
  - [ ] Create plan
  - [ ] Edit plan
  - [ ] Archive plan
  - [ ] Duplicate plan
- [ ] Test default plan logic
- [ ] Test featured plan display
- [ ] Test validation
- [ ] Security test for admin access
- [ ] Document test cases

---

### 4.5 Documentation

**Tasks:**
- [ ] Document all plan APIs
- [ ] Create admin guide for plan management
- [ ] Document pricing strategy best practices
- [ ] Add inline help text
- [ ] Create video walkthrough

---

## Phase 5: Admin Dashboard & Analytics

**Goal:** Provide admins with key metrics and insights.

### 5.1 Database Views & Functions

#### 5.1.1 Create Analytics Views

```sql
-- Subscription metrics
CREATE OR REPLACE VIEW subscription_metrics AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  subscription_plan_id,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'trialing') as trial_count,
  COUNT(*) FILTER (WHERE status = 'canceled') as canceled_count,
  SUM(
    CASE
      WHEN billing_period = 'monthly' THEN (plan_snapshot->>'price_monthly')::numeric
      WHEN billing_period = 'weekly' THEN (plan_snapshot->>'price_weekly')::numeric * 4.33
      ELSE 0
    END
  ) FILTER (WHERE status = 'active') as mrr
FROM subscription_history
GROUP BY month, subscription_plan_id;

-- Product sales metrics
CREATE OR REPLACE VIEW product_sales_metrics AS
SELECT
  p.id as product_id,
  p.name as product_name,
  COUNT(DISTINCT po.id) as order_count,
  SUM((item->>'quantity')::integer) as units_sold,
  SUM((item->>'total_price')::numeric) as revenue
FROM sellable_products p
JOIN purchase_orders po ON true
CROSS JOIN LATERAL jsonb_array_elements(po.items) as item
WHERE item->>'product_id' = p.id::text
AND po.payment_status = 'paid'
GROUP BY p.id, p.name;

-- Inventory alerts
CREATE OR REPLACE VIEW inventory_alerts AS
SELECT
  id,
  name,
  current_stock,
  low_stock_threshold,
  CASE
    WHEN current_stock = 0 THEN 'out_of_stock'
    WHEN current_stock <= low_stock_threshold THEN 'low_stock'
    ELSE 'ok'
  END as alert_level
FROM sellable_products
WHERE tracks_inventory = true
AND (current_stock = 0 OR current_stock <= low_stock_threshold)
AND is_active = true
AND deleted_at IS NULL;
```

**Tasks:**
- [ ] Create views migration
- [ ] Apply via Supabase MCP
- [ ] Test views return correct data
- [ ] Optimize view performance

---

#### 5.1.2 Create Dashboard Metrics Function

```sql
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'subscriptions', (
      SELECT jsonb_build_object(
        'total_active', COUNT(*) FILTER (WHERE status = 'active'),
        'total_trialing', COUNT(*) FILTER (WHERE status = 'trialing'),
        'total_canceled', COUNT(*) FILTER (WHERE status = 'canceled'),
        'mrr', SUM(
          CASE
            WHEN billing_period = 'monthly' AND status = 'active'
            THEN (plan_snapshot->>'price_monthly')::numeric
            WHEN billing_period = 'weekly' AND status = 'active'
            THEN (plan_snapshot->>'price_weekly')::numeric * 4.33
            ELSE 0
          END
        )
      )
      FROM subscription_history
      WHERE created_at = (
        SELECT MAX(created_at)
        FROM subscription_history sh2
        WHERE sh2.business_id = subscription_history.business_id
      )
    ),
    'products', (
      SELECT jsonb_build_object(
        'total_products', COUNT(*),
        'out_of_stock', COUNT(*) FILTER (WHERE current_stock = 0),
        'low_stock', COUNT(*) FILTER (WHERE current_stock > 0 AND current_stock <= low_stock_threshold),
        'total_inventory_value', SUM(current_stock * (
          SELECT MIN((tier->>'unit_price')::numeric)
          FROM jsonb_array_elements(pricing_tiers) as tier
        ))
      )
      FROM sellable_products
      WHERE is_active = true AND deleted_at IS NULL
    ),
    'orders', (
      SELECT jsonb_build_object(
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'paid', COUNT(*) FILTER (WHERE payment_status = 'paid'),
        'shipped', COUNT(*) FILTER (WHERE status = 'shipped'),
        'total_revenue_30d', SUM(total) FILTER (WHERE payment_status = 'paid' AND created_at > NOW() - INTERVAL '30 days')
      )
      FROM purchase_orders
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Tasks:**
- [ ] Create function migration
- [ ] Apply via Supabase MCP
- [ ] Test function returns correct metrics
- [ ] Optimize performance

---

### 5.2 Admin Dashboard APIs

#### 5.2.1 GET /api/admin/dashboard/metrics
**Purpose:** Get all dashboard metrics in one call.

**Response:**
```typescript
{
  subscriptions: {
    total_active: number
    total_trialing: number
    total_canceled: number
    mrr: number
    arpu: number
    churn_rate_30d: number
  }
  products: {
    total_products: number
    out_of_stock: number
    low_stock: number
    total_inventory_value: number
  }
  orders: {
    pending: number
    paid: number
    shipped: number
    total_revenue_30d: number
  }
  funnels: {
    total_active: number
    total_created_30d: number
  }
}
```

**Tasks:**
- [x] Create API route
- [ ] Call get_admin_dashboard_metrics()
- [ ] Calculate additional metrics (ARPU, churn)
- [ ] Return formatted data
- [ ] Cache results (5 minutes)
- [ ] Test with real data
- [ ] Document API

---

#### 5.2.2 GET /api/admin/dashboard/revenue-chart
**Purpose:** Get revenue data for charts.

**Query Params:**
- `period` - 7d, 30d, 90d, 1y, all
- `group_by` - day, week, month

**Response:**
```typescript
{
  data: Array<{
    date: string
    revenue: number
    orders: number
    mrr: number
  }>
  summary: {
    total_revenue: number
    avg_order_value: number
    growth_rate: number // Compared to previous period
  }
}
```

**Tasks:**
- [x] Create API route
- [ ] Aggregate revenue data
- [ ] Group by period
- [ ] Calculate growth rate
- [ ] Return formatted data
- [ ] Test with various periods
- [ ] Document API

---

#### 5.2.3 GET /api/admin/dashboard/subscription-chart
**Purpose:** Get subscription growth data.

**Query Params:**
- `period` - 30d, 90d, 1y, all

**Response:**
```typescript
{
  data: Array<{
    date: string
    active: number
    trialing: number
    canceled: number
    new: number
    churned: number
  }>
  summary: {
    net_growth: number
    churn_rate: number
    trial_conversion_rate: number
  }
}
```

**Tasks:**
- [x] Create API route
- [ ] Aggregate subscription data
- [ ] Calculate new/churned per period
- [ ] Calculate summary stats
- [ ] Return formatted data
- [ ] Test with real data
- [ ] Document API

---

### 5.3 Admin Dashboard UI

#### 5.3.1 Enhance Admin Dashboard Page
**File:** `app/admin/page.tsx`

**Current State:** Basic overview exists

**Complete Redesign with Sections:**

**1. Key Metrics Cards (Top Row)**
- Monthly Recurring Revenue (MRR)
  - Current MRR
  - Growth % vs last month
  - Sparkline chart
- Active Subscriptions
  - Count
  - New this month
  - Churn this month
- Total Revenue (30d)
  - Amount
  - Growth % vs previous 30d
- Active Funnels
  - Count
  - Created this month

**2. Revenue Chart**
- Line chart showing revenue over time
- Toggles: 7d, 30d, 90d, 1y
- Shows: Total revenue, MRR, Orders

**3. Subscription Growth Chart**
- Area chart showing subscription counts
- Stacked: Active, Trialing
- Shows new/churned

**4. Alerts & Tasks (Right Sidebar)**
- Inventory Alerts
  - Out of stock products (red)
  - Low stock products (orange)
  - Link to product page
- Trials Ending Soon
  - List of trials ending in next 7 days
  - Quick action: Extend trial
- Payment Issues
  - Failed payments
  - Quick action: Contact customer

**5. Quick Actions (Bottom)**
- Create Product
- Assign Subscription
- Create QR Batch
- View All Orders

**6. Recent Activity Feed**
- Last 20 admin actions
- Filterable by action type
- Shows: Admin, Action, Timestamp

**Tasks:**
- [ ] Redesign dashboard layout
- [ ] Build metric cards component
- [ ] Integrate revenue chart (use recharts)
- [ ] Integrate subscription chart
- [ ] Build alerts sidebar
- [ ] Build quick actions section
- [ ] Build activity feed
- [ ] Add real-time updates (polling every 60s)
- [ ] Add loading states
- [ ] Test with real data
- [ ] Mobile responsive
- [ ] Document page

---

#### 5.3.2 Create Revenue Chart Component
**Component:** `components/admin/dashboard/RevenueChart.tsx`

**Features:**
- Line chart with multiple series
- Period selector (7d, 30d, 90d, 1y)
- Legend
- Tooltips
- Responsive
- Export to image

**Tasks:**
- [ ] Create chart component
- [ ] Integrate recharts library
- [ ] Add period selector
- [ ] Fetch data from API
- [ ] Configure chart options
- [ ] Add export functionality
- [ ] Test with various periods
- [ ] Document component

---

#### 5.3.3 Create Subscription Growth Chart Component
**Component:** `components/admin/dashboard/SubscriptionChart.tsx`

**Features:**
- Area chart (stacked)
- Show active, trialing, churned
- Tooltips
- Responsive

**Tasks:**
- [ ] Create chart component
- [ ] Integrate recharts
- [ ] Fetch data from API
- [ ] Configure stacked area
- [ ] Add tooltips
- [ ] Test with real data
- [ ] Document component

---

#### 5.3.4 Create Inventory Alerts Panel
**Component:** `components/admin/dashboard/InventoryAlertsPanel.tsx`

**Features:**
- List of products needing attention
- Color-coded by severity
- Quick link to product page
- "Adjust Inventory" quick action

**Tasks:**
- [ ] Create panel component
- [ ] Fetch inventory alerts
- [ ] Build alert list
- [ ] Add color coding
- [ ] Add quick links
- [ ] Add quick adjust action
- [ ] Test with various alerts
- [ ] Document component

---

#### 5.3.5 Create Trials Ending Panel
**Component:** `components/admin/dashboard/TrialsEndingPanel.tsx`

**Features:**
- List of trials ending in next 7 days
- Show business name, plan, days left
- Quick action: Extend trial
- Quick action: Contact customer

**Tasks:**
- [ ] Create panel component
- [ ] Fetch trials ending soon
- [ ] Build list
- [ ] Add countdown display
- [ ] Add quick actions
- [ ] Test with upcoming trials
- [ ] Document component

---

#### 5.3.6 Create Activity Feed Component
**Component:** `components/admin/dashboard/ActivityFeed.tsx`

**Features:**
- List of recent admin actions
- Icons for action types
- Show admin, action, timestamp
- Expandable for details
- Filter by action type
- Real-time updates (via polling)

**Tasks:**
- [ ] Create feed component
- [ ] Fetch recent actions
- [ ] Build action items
- [ ] Add action type icons
- [ ] Add expand/collapse
- [ ] Add filter dropdown
- [ ] Implement polling
- [ ] Test with real actions
- [ ] Document component

---

### 5.4 Testing & Validation

**Tasks:**
- [ ] Unit tests for dashboard APIs
- [ ] Test metric calculations accuracy
- [ ] Test chart data formatting
- [ ] Test with various date ranges
- [ ] Performance test with large datasets
- [ ] Test real-time updates
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

---

### 5.5 Documentation

**Tasks:**
- [ ] Document dashboard metrics
- [ ] Create admin guide for interpreting metrics
- [ ] Document how metrics are calculated
- [ ] Add inline help tooltips
- [ ] Create video walkthrough

---

## Phase 6: Stripe Integration

**Goal:** Connect subscriptions and products to Stripe for automated billing.

### 6.1 Stripe Setup

**Tasks:**
- [ ] Set up Stripe account (or use existing)
- [ ] Get Stripe API keys (test & live)
- [ ] Add keys to environment variables
- [ ] Install Stripe SDK (already done)
- [ ] Configure webhook endpoint URL
- [ ] Set up webhook signing secret

---

### 6.2 Database Migrations

#### 6.2.1 Add Stripe IDs to Existing Tables

```sql
-- Already have stripe_product_id and stripe_price_id on subscription_plans
-- Add customer portal URL
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS stripe_customer_portal_url TEXT;

-- Add payment method tracking
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  business_id UUID NOT NULL REFERENCES businesses(id),
  stripe_payment_method_id TEXT NOT NULL,

  type TEXT NOT NULL, -- 'card', 'bank_account'
  brand TEXT, -- 'visa', 'mastercard', etc.
  last4 TEXT,
  exp_month INTEGER,
  exp_year INTEGER,

  is_default BOOLEAN NOT NULL DEFAULT false,

  UNIQUE(business_id, stripe_payment_method_id)
);

CREATE INDEX idx_payment_methods_business_id ON payment_methods(business_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(is_default);
```

**Tasks:**
- [ ] Create migration
- [ ] Apply via Supabase MCP
- [ ] Verify indexes

---

### 6.3 Stripe Sync APIs

#### 6.3.1 POST /api/admin/stripe/sync-subscription-plans
**Purpose:** Create Stripe products/prices for all subscription plans.

**Logic:**
For each plan:
1. Create Stripe Product
2. Create Stripe Price (monthly)
3. Create Stripe Price (weekly)
4. Create Stripe Price for addon funnels (monthly)
5. Create Stripe Price for addon funnels (weekly)
6. Update plan with stripe_product_id and price IDs

**Tasks:**
- [x] Create API route
- [ ] Loop through all active plans
- [ ] Create Stripe products
- [ ] Create Stripe prices
- [ ] Update database with IDs
- [ ] Log admin action
- [ ] Handle errors gracefully
- [ ] Test sync
- [ ] Document API

---

#### 6.3.2 POST /api/admin/stripe/sync-products
**Purpose:** Create Stripe products for sellable products.

**Logic:**
For each sellable product:
1. Create Stripe Product
2. Create Stripe Prices for each pricing tier
3. Update product with stripe_product_id

**Tasks:**
- [x] Create API route
- [ ] Loop through all active products
- [ ] Create Stripe products
- [ ] Create Stripe prices (multiple per product)
- [ ] Update database with IDs
- [ ] Log admin action
- [ ] Test sync
- [ ] Document API

---

#### 6.3.3 Enhance Existing Webhook Handler
**File:** `app/api/stripe/webhook/route.ts`

**Add New Event Handlers:**

**subscription.created**
- Create subscription_history record
- Update business.current_subscription_id

**subscription.updated**
- Update subscription_history status
- Handle plan changes

**subscription.deleted**
- Mark subscription as canceled
- Set cancel_at_period_end

**invoice.payment_succeeded**
- Update subscription period dates
- Create payment record

**invoice.payment_failed**
- Update subscription status to past_due
- Send notification email

**customer.subscription.trial_will_end**
- Send trial ending notification

**Tasks:**
- [ ] Read existing webhook handler
- [ ] Add subscription.created handler
- [ ] Add subscription.updated handler
- [ ] Add subscription.deleted handler
- [ ] Add invoice.payment_succeeded handler
- [ ] Add invoice.payment_failed handler
- [ ] Add trial_will_end handler
- [ ] Test each webhook event
- [ ] Document webhook handlers

---

### 6.4 Customer Stripe Integration

#### 6.4.1 Update Subscription Upgrade Flow
**File:** `app/api/subscriptions/upgrade/route.ts`

**Current:** Creates subscription_history directly

**New Flow:**
1. Create or get Stripe customer
2. Create Stripe subscription
3. Create subscription_history with stripe_subscription_id
4. Return Stripe checkout URL or confirm success

**Tasks:**
- [ ] Update upgrade API
- [ ] Create Stripe customer if needed
- [ ] Create Stripe subscription
- [ ] Link to subscription_history
- [ ] Test upgrade flow
- [ ] Document changes

---

#### 6.4.2 Update Addon Funnel Purchase Flow
**File:** `app/api/subscriptions/addon-funnels/route.ts`

**New Flow:**
1. Get customer's Stripe subscription
2. Add subscription item for addon funnels
3. Create addon_funnel record with stripe_subscription_item_id

**Tasks:**
- [ ] Update addon API
- [ ] Get Stripe subscription
- [ ] Add subscription item
- [ ] Link to addon_funnel record
- [ ] Test addon purchase
- [ ] Document changes

---

#### 6.4.3 Create Payment Method Management
**New API:** `POST /api/subscriptions/payment-methods`

**Purpose:** Add/update payment method.

**Logic:**
1. Create Stripe Setup Intent
2. Return client secret
3. Frontend uses Stripe Elements to collect payment method
4. Webhook confirms payment method attached

**Tasks:**
- [x] Create API route
- [ ] Create Stripe Setup Intent
- [ ] Return client secret
- [ ] Handle webhook confirmation
- [ ] Save payment method to database
- [ ] Test flow
- [ ] Document API

---

#### 6.4.4 Create Customer Billing Portal Link
**New API:** `GET /api/subscriptions/billing-portal`

**Purpose:** Generate Stripe Customer Portal session URL.

**Response:**
```typescript
{
  url: string // Redirect URL to Stripe portal
}
```

**Tasks:**
- [x] Create API route
- [ ] Get customer's stripe_customer_id
- [ ] Create portal session
- [ ] Return URL
- [ ] Test portal access
- [ ] Document API

---

### 6.5 Admin Stripe UI

#### 6.5.1 Add Stripe Sync Section to Subscription Plans
**In:** `app/admin/subscription-plans/page.tsx`

**Add:**
- "Sync All Plans to Stripe" button
- Sync status indicator per plan (synced/not synced)
- Individual sync button per plan

**Tasks:**
- [ ] Add sync all button
- [ ] Show sync status
- [ ] Add individual sync buttons
- [ ] Implement sync actions
- [ ] Add loading states
- [ ] Test sync
- [ ] Document UI

---

#### 6.5.2 Add Stripe Sync Section to Products
**In:** `app/admin/products/page.tsx`

**Add:**
- "Sync All Products to Stripe" button
- Sync status per product

**Tasks:**
- [ ] Add sync all button
- [ ] Show sync status
- [ ] Add individual sync
- [ ] Test sync
- [ ] Document UI

---

#### 6.5.3 Add Stripe Info to Subscription Detail
**In:** `components/admin/SubscriptionDetailDrawer.tsx`

**Add to Overview Tab:**
- Stripe Subscription ID (copyable)
- Stripe Customer ID (copyable)
- Payment Method (brand, last4)
- Link to Stripe Dashboard

**Tasks:**
- [ ] Add Stripe IDs
- [ ] Add payment method display
- [ ] Add Stripe dashboard link
- [ ] Make IDs copyable
- [ ] Test display
- [ ] Document changes

---

### 6.6 Testing & Validation

**Tasks:**
- [ ] Test subscription creation via Stripe
- [ ] Test subscription updates
- [ ] Test subscription cancellation
- [ ] Test addon funnel purchase
- [ ] Test payment method management
- [ ] Test webhook event processing
- [ ] Test trial conversions
- [ ] Test failed payments
- [ ] Test with Stripe test cards
- [ ] Test customer portal
- [ ] Document test scenarios

---

### 6.7 Documentation

**Tasks:**
- [ ] Document Stripe integration architecture
- [ ] Create webhook setup guide
- [ ] Document payment flows
- [ ] Create troubleshooting guide
- [ ] Add inline help for Stripe features

---

## Phase 7: Testing & Documentation

**Goal:** Comprehensive testing and documentation for the entire admin system.

### 7.1 End-to-End Testing

**Tasks:**
- [ ] E2E test: Complete admin subscription workflow
  - [ ] Assign subscription to customer
  - [ ] Customer uses subscription
  - [ ] Admin changes plan
  - [ ] Admin adds addon funnels
  - [ ] Admin cancels subscription

- [ ] E2E test: Complete admin product workflow
  - [ ] Create new product
  - [ ] Set pricing
  - [ ] Link batches
  - [ ] Receive batch (inventory updates)
  - [ ] Customer purchases product
  - [ ] Inventory decreases
  - [ ] Manual inventory adjustment

- [ ] E2E test: Complete revenue cycle
  - [ ] Customer signs up (trial)
  - [ ] Trial converts to paid
  - [ ] Customer purchases products
  - [ ] Admin views revenue in dashboard
  - [ ] Customer cancels subscription

---

### 7.2 Performance Testing

**Tasks:**
- [ ] Load test: Admin subscriptions list (10,000 subscriptions)
- [ ] Load test: Admin products list (1,000 products)
- [ ] Load test: Dashboard metrics (complex queries)
- [ ] Optimize slow queries
- [ ] Add database indexes where needed
- [ ] Implement caching for dashboard
- [ ] Test Stripe webhook processing under load

---

### 7.3 Security Testing

**Tasks:**
- [ ] Verify all admin APIs require admin role
- [ ] Test RLS policies for each table
- [ ] Test audit logging for all admin actions
- [ ] Test for SQL injection vulnerabilities
- [ ] Test for XSS vulnerabilities
- [ ] Test CSRF protection
- [ ] Test Stripe webhook signature validation
- [ ] Penetration testing (if budget allows)

---

### 7.4 Admin User Guide

**Create:** `docs/admin-user-guide.md`

**Sections:**
1. Getting Started
   - Admin access
   - Dashboard overview

2. Managing Subscriptions
   - Assigning subscriptions
   - Changing plans
   - Managing trials
   - Handling cancellations
   - Addon funnels

3. Managing Products
   - Creating products
   - Setting pricing
   - Managing inventory
   - Linking batches
   - Inventory adjustments

4. Managing Plans
   - Creating plans
   - Editing plans
   - Archiving plans

5. Dashboard & Reports
   - Understanding metrics
   - Revenue reports
   - Subscription analytics

6. Stripe Integration
   - Syncing plans/products
   - Handling payment issues
   - Customer portal

7. Troubleshooting
   - Common issues
   - Error messages
   - Support contacts

**Tasks:**
- [ ] Write admin user guide
- [ ] Add screenshots
- [ ] Create video walkthroughs
- [ ] Add to documentation site

---

### 7.5 Developer Documentation

**Create:** `docs/admin-api-reference.md`

**Content:**
- All admin API endpoints
- Request/response examples
- Authentication requirements
- Rate limits
- Error codes
- Webhook events

**Tasks:**
- [ ] Document all APIs
- [ ] Add code examples
- [ ] Create Postman collection
- [ ] Add to documentation site

---

### 7.6 Deployment Checklist

**Tasks:**
- [ ] All migrations applied to production
- [ ] Environment variables set
- [ ] Stripe webhook URL configured
- [ ] Admin users created
- [ ] Test on staging environment
- [ ] Performance monitoring setup
- [ ] Error tracking setup (Sentry)
- [ ] Backup strategy verified
- [ ] Rollback plan documented
- [ ] Deploy to production
- [ ] Smoke test all admin features
- [ ] Monitor logs for errors

---

## Completion Checklist

### Phase 1: Admin Subscription Management
- [ ] Database migrations complete
- [ ] All APIs implemented
- [x] All UI components built
- [ ] Testing complete
- [ ] Documentation complete

### Phase 2: Admin Product Management
- [ ] Database migrations complete
- [ ] All APIs implemented
- [x] All UI components built
- [ ] Testing complete
- [ ] Documentation complete

### Phase 3: Product-Batch Inventory
- [ ] Database migrations complete
- [ ] All APIs implemented
- [x] All UI components built
- [ ] Testing complete
- [ ] Documentation complete

### Phase 4: Subscription Plan Management
- [ ] Database migrations complete
- [ ] All APIs implemented
- [x] All UI components built
- [ ] Testing complete
- [ ] Documentation complete

### Phase 5: Admin Dashboard & Analytics
- [ ] Database functions complete
- [ ] All APIs implemented
- [ ] Dashboard UI complete
- [ ] Charts implemented
- [ ] Testing complete
- [ ] Documentation complete

### Phase 6: Stripe Integration
- [ ] Stripe account configured
- [ ] Database migrations complete
- [ ] Sync APIs implemented
- [ ] Webhook handlers updated
- [ ] Customer flows updated
- [ ] Admin UI updated
- [ ] Testing complete
- [ ] Documentation complete

### Phase 7: Testing & Documentation
- [ ] E2E testing complete
- [ ] Performance testing complete
- [ ] Security testing complete
- [ ] Admin user guide complete
- [ ] Developer documentation complete
- [ ] Deployed to production

---

## Notes

- Each phase can be developed independently but should be tested together
- Prioritize Phases 1-3 as they are critical for admin operations
- Phase 6 (Stripe) can be done in parallel with other phases
- Phase 5 (Dashboard) can be done last as it depends on other phases
- Use feature flags to deploy incrementally without affecting users
- All admin actions must be logged for audit trail
- Security is paramount - all admin endpoints must be protected
- Performance matters - use database indexes and caching
- UX matters - even for admin users, make it pleasant and efficient

---

**End of Development Plan**
