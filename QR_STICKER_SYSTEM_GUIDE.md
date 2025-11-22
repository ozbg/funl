# QR Sticker System - Complete Guide

## Table of Contents
1. [Admin: Inventory Management](#admin-inventory-management)
2. [Admin: Batch Management](#admin-batch-management)
3. [How the Purchase Flow Works](#purchase-flow)
4. [Reprint System](#reprint-system)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)

---

## Admin: Inventory Management

### Overview
As an admin, you manage QR code inventory through **batches**. Each batch contains multiple pre-printed QR codes that users can purchase.

### Creating a New Batch

**Location:** `/admin/qr-batches` → "Create Batch" button

**Required Information:**
1. **Batch Name** - e.g., "Summer 2025 Batch"
2. **Batch Number** - e.g., "BATCH-001"
3. **Quantity** - How many codes to generate (e.g., 1000)
4. **Size** - Physical sticker size (small/medium/large)
5. **QR Preset** - Style/design template
6. **Status** - Controls availability:
   - `draft` - Not visible to users
   - `active` - **Available for purchase**
   - `archived` - No longer available

**Pricing (configured in batch):**
- `size_small_price` - Price for small stickers
- `size_medium_price` - Price for medium stickers
- `size_large_price` - Price for large stickers
- `pricing_tiers` (JSONB) - Volume discounts (optional)

### Making Inventory Available for Sale

**Step 1: Create the Batch**
```
1. Go to /admin/qr-batches
2. Click "Create Batch"
3. Fill in details
4. Set status to "active" ✅
5. Save
```

**Step 2: Codes Are Auto-Generated**
- When batch is created, codes are automatically generated
- Each code gets status = 'available'
- Codes are ready for purchase immediately

**Step 3: Users Can Now Purchase**
- Active batches appear on `/dashboard/stickers/buy`
- Users see available quantities
- Users can add to cart and purchase

### Taking Inventory Out of Stock

**Option 1: Change Batch Status**
```
1. Go to /admin/qr-batches/[batch-id]
2. Change status from "active" to "archived"
3. Save
```
Result: Batch disappears from purchase page

**Option 2: Mark Individual Codes**
```
1. Go to /admin/qr-batches/[batch-id]
2. Find codes in the table
3. Update status to 'damaged' or 'lost'
```
Result: Those specific codes won't be allocated

### Checking Inventory Levels

**View Overall Stats:**
- Go to `/admin/qr-batches`
- See total codes, available, assigned for each batch

**View Detailed Code List:**
```
1. Go to /admin/qr-batches/[batch-id]
2. See table with all codes
3. Filter by status:
   - available = ready for sale
   - reserved = in someone's cart (temp)
   - assigned = sold and connected to funnel
   - owned_unassigned = sold but not connected yet
```

**SQL Query to Check Stock:**
```sql
SELECT
  batch_id,
  qr_code_batches.name,
  COUNT(*) FILTER (WHERE status = 'available') as available,
  COUNT(*) FILTER (WHERE status = 'assigned') as sold,
  COUNT(*) as total
FROM reserved_codes
JOIN qr_code_batches ON reserved_codes.batch_id = qr_code_batches.id
GROUP BY batch_id, qr_code_batches.name;
```

### Pricing Configuration

**Default Volume Pricing** (in code):
```typescript
const defaultPricingTiers = [
  { min_quantity: 1, max_quantity: 9, unit_price: 5.00 },
  { min_quantity: 10, max_quantity: 49, unit_price: 4.50 },
  { min_quantity: 50, max_quantity: 99, unit_price: 4.00 },
  { min_quantity: 100, max_quantity: null, unit_price: 3.50 }
]
```

**Custom Pricing (per batch):**
Store custom tiers in `qr_code_batches.pricing_tiers` as JSONB:
```json
[
  {"min_quantity": 1, "max_quantity": 9, "unit_price": 6.00},
  {"min_quantity": 10, "max_quantity": null, "unit_price": 5.00}
]
```

**To Update Pricing:**
```sql
UPDATE qr_code_batches
SET pricing_tiers = '[
  {"min_quantity": 1, "max_quantity": 9, "unit_price": 6.00},
  {"min_quantity": 10, "max_quantity": null, "unit_price": 5.00}
]'::jsonb
WHERE id = 'batch-uuid-here';
```

---

## Admin: Batch Management

### Batch Lifecycle

```
1. DRAFT → Admin creates batch
2. ACTIVE → Available for purchase
3. ARCHIVED → No longer available
```

### Admin Operations

**Assign Codes to Business (Free Allocation)**
```
1. Go to /admin/qr-batches/[batch-id]
2. Find code with status 'available'
3. Click "Assign" button
4. Select business
5. Select funnel (optional)
6. Confirm
```
Result: Code status changes to 'assigned', business owns it

**Bulk Release Codes** (API)
```bash
POST /api/admin/codes/bulk-release
{
  "code_ids": ["uuid1", "uuid2", "uuid3"]
}
```
Result: Codes change from 'assigned' → 'owned_unassigned'

**Bulk Assign Codes** (API)
```bash
POST /api/admin/codes/bulk-assign
{
  "code_ids": ["uuid1", "uuid2"],
  "business_id": "business-uuid",
  "funnel_id": "funnel-uuid" // optional
}
```
Result: Multiple codes assigned to one business

### Batch Detail Page

**URL:** `/admin/qr-batches/[batch-id]`

**Features:**
- View all codes in batch
- Filter by status
- Search by code or business name
- Assign individual codes
- View code allocation history
- Pagination (50 codes per page)

---

## Purchase Flow

### How Users Buy Stickers

**Step 1: Browse Inventory**
- URL: `/dashboard/stickers/buy`
- Shows active batches only
- Displays available quantities
- Shows pricing tiers
- Organized by batch and size

**Step 2: Add to Cart**
- Select size (small/medium/large)
- Select style (modern/classic/minimal)
- Choose quantity
- Click "Add to Cart"
- Cart persists in localStorage

**Step 3: Checkout**
- URL: `/dashboard/stickers/checkout`
- Enter shipping address
- Review order summary:
  - Subtotal (quantity × unit price)
  - Tax (10% GST)
  - Shipping ($5 base + $0.50 per item)
  - Total
- Click "Pay" (currently placeholder)

**Step 4: Order Processing**
- Atomic database transaction:
  1. Create `purchase_order` record
  2. Allocate codes from batch
  3. Update code status: `available` → `reserved`
  4. Create `user_sticker_inventory` records
  5. Log in `code_allocations` table
- If any step fails, entire transaction rolls back

**Step 5: Order Confirmation**
- Redirect to `/dashboard/stickers/orders/[order-id]?confirmed=true`
- Shows success banner
- Lists allocated QR codes
- Provides "Connect" links to assign to funnels

### Database Flow During Purchase

```sql
-- 1. Create order
INSERT INTO purchase_orders (
  business_id,
  order_number,
  order_type, -- 'purchase'
  items,
  subtotal,
  tax,
  shipping,
  total,
  status,
  payment_status,
  shipping_address
) VALUES (...);

-- 2. Allocate codes (atomic function)
CALL process_qr_purchase(
  p_business_id,
  p_items,
  p_subtotal,
  p_tax,
  p_shipping,
  p_total,
  p_shipping_address,
  'purchase'
);

-- Inside function:
-- 2a. Pick available codes
SELECT id FROM reserved_codes
WHERE batch_id = 'batch-id'
  AND status = 'available'
  AND business_id IS NULL
LIMIT quantity
FOR UPDATE NOWAIT;

-- 2b. Update codes
UPDATE reserved_codes
SET
  status = 'reserved',
  business_id = user_id,
  purchase_order_id = order_id,
  purchased_at = NOW()
WHERE id = ANY(selected_codes);

-- 2c. Create inventory
INSERT INTO user_sticker_inventory (
  business_id,
  reserved_code_id,
  acquired_via,
  purchase_order_id,
  is_used
) VALUES (user_id, code_id, 'purchase', order_id, FALSE);

-- 2d. Log allocation
INSERT INTO code_allocations (
  reserved_code_id,
  action,
  previous_status,
  new_status,
  business_id,
  purchase_order_id,
  reason
) VALUES (...);
```

### What Happens After Purchase

**User's Perspective:**
1. Order appears in `/dashboard/stickers/orders`
2. Codes visible in order detail page
3. Can click "Connect" to assign code to funnel
4. Or visit `/dashboard/stickers/connect` to assign later

**Code Status Journey:**
```
available → reserved (purchased) → assigned (connected to funnel)
```

**Admin's Perspective:**
1. Batch available quantity decreases
2. Codes show `business_id` in admin view
3. Audit trail in `code_allocations` table
4. Order visible in purchase_orders table

---

## Reprint System

### How Reprints Work

**Concept:** User already owns a code (it's assigned to a funnel). They want duplicate physical stickers with the same QR code but possibly different size/style.

### User Reprint Flow

**Step 1: Select Code to Reprint**
- URL: `/dashboard/stickers/reprint`
- Shows all codes with status = 'assigned'
- Displays which funnel each code is connected to
- Click "Configure Reprint" on desired code

**Step 2: Configure Reprint**
- URL: `/dashboard/stickers/reprint/configure?code_id=xxx`
- Choose new size (can differ from original)
- Choose new style (can differ from original)
- Select quantity (how many duplicates)
- See pricing (same volume pricing as purchases)

**Step 3: Place Reprint Order**
- Review summary
- Click "Order Reprint"
- Creates order with `order_type = 'reprint'`
- Original code remains assigned to funnel

**Step 4: Reprint Order Created**
- Order appears in `/dashboard/stickers/orders`
- Shows as "Reprint Order" type
- Items field contains `reprint_code_ids` array
- Original code status unchanged

### Reprint vs Purchase

| Aspect | Purchase | Reprint |
|--------|----------|---------|
| Order Type | `'purchase'` | `'reprint'` |
| Code Allocation | New codes allocated | Existing code referenced |
| Code Status Change | `available` → `reserved` | No change (stays `assigned`) |
| User Owns Code | After purchase | Already owns |
| Items Structure | `{batch_id, quantity, size, style}` | `{reprint_code_ids: [...], size, style, quantity}` |

### Database Structure for Reprints

**purchase_orders table:**
```sql
{
  "order_type": "reprint",
  "items": [{
    "reprint_code_ids": ["code-uuid-1"],
    "code": "ABC12345",
    "size": "large",
    "style": {"id": "...", "name": "Modern"},
    "quantity": 10,
    "unit_price": 4.50
  }]
}
```

**code_allocations log:**
```sql
INSERT INTO code_allocations (
  reserved_code_id,
  action,
  previous_status,
  new_status,  -- same as previous
  business_id,
  purchase_order_id,
  reason
) VALUES (
  code_id,
  'reprint',
  'assigned',
  'assigned',
  user_id,
  reprint_order_id,
  'Reprint order ORD-20251122-ABC123'
);
```

---

## Database Schema

### Core Tables

**qr_code_batches**
```sql
CREATE TABLE qr_code_batches (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  batch_number TEXT UNIQUE NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'archived')),
  size TEXT,
  style_preset_id UUID REFERENCES qr_presets(id),
  pricing_tiers JSONB, -- optional custom pricing
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**reserved_codes**
```sql
CREATE TABLE reserved_codes (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  batch_id UUID REFERENCES qr_code_batches(id),
  status TEXT CHECK (status IN (
    'available',
    'reserved',
    'assigned',
    'owned_unassigned',
    'damaged',
    'lost'
  )),
  business_id UUID REFERENCES businesses(id),
  funnel_id UUID REFERENCES funnels(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  assigned_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ,
  purchase_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**purchase_orders**
```sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  order_number TEXT UNIQUE NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'purchase'
    CHECK (order_type IN ('purchase', 'reprint')),
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  shipping_address JSONB NOT NULL,
  tracking_number TEXT,
  carrier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);
```

**user_sticker_inventory**
```sql
CREATE TABLE user_sticker_inventory (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  reserved_code_id UUID NOT NULL REFERENCES reserved_codes(id),
  acquired_via TEXT CHECK (acquired_via IN ('purchase', 'admin_assignment')),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  is_used BOOLEAN DEFAULT FALSE,
  used_for_funnel_id UUID REFERENCES funnels(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**code_allocations** (audit trail)
```sql
CREATE TABLE code_allocations (
  id UUID PRIMARY KEY,
  reserved_code_id UUID NOT NULL REFERENCES reserved_codes(id),
  action TEXT NOT NULL, -- 'reserve', 'assign', 'release', 'reprint'
  previous_status TEXT,
  new_status TEXT,
  business_id UUID REFERENCES businesses(id),
  funnel_id UUID REFERENCES funnels(id),
  admin_id UUID REFERENCES admins(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  reason TEXT,
  metadata JSONB,
  is_successful BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Code Status Flow

```
┌─────────────┐
│  available  │ ← Initial state (batch created)
└──────┬──────┘
       │ User purchases
       ↓
┌─────────────┐
│  reserved   │ ← Purchased, in user's inventory
└──────┬──────┘
       │ User connects to funnel
       ↓
┌─────────────┐
│  assigned   │ ← Connected to funnel, QR code active
└──────┬──────┘
       │ User deletes funnel
       ↓
┌──────────────────┐
│ owned_unassigned │ ← Code released, can reassign
└──────────────────┘

Alternative flows:
available → damaged (admin marks)
available → lost (admin marks)
available → assigned (admin direct assignment, skips reserve)
```

---

## API Reference

### Purchase API

**POST /api/stickers/purchase**
```typescript
Body: {
  items: [{
    batch_id: string
    quantity: number
    unit_price: number
    style: {
      id: string
      name: string
      template: string
    }
    size: 'small' | 'medium' | 'large'
  }]
  shipping_address: {
    full_name: string
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code: string
    country: string
    phone?: string
  }
  subtotal: number
  tax: number
  shipping: number
  total: number
}

Response: {
  success: true
  order_id: string
  order_number: string
  codes_allocated: number
}
```

### Reprint API

**POST /api/stickers/reprint**
```typescript
Body: {
  code_id: string  // Existing code to reprint
  size: 'small' | 'medium' | 'large'
  style: {
    id: string
    name: string
    template: string
  }
  quantity: number
  unit_price: number
  subtotal: number
  tax: number
  shipping: number
  total: number
}

Response: {
  success: true
  order_id: string
  order_number: string
}
```

### Bulk Admin APIs

**POST /api/admin/codes/bulk-release**
```typescript
Body: {
  code_ids: string[]  // Array of code IDs
}

Response: {
  success: true
  released_count: number
}
```

**POST /api/admin/codes/bulk-assign**
```typescript
Body: {
  code_ids: string[]
  business_id: string
  funnel_id?: string  // Optional
}

Response: {
  success: true
  assigned_count: number
  business: string
}
```

### Helper APIs

**GET /api/stickers/code/[id]**
```typescript
Response: {
  id: string
  code: string
  status: string
  business_id: string
  assigned_at: string
  funnels: {
    id: string
    name: string
    funnel_type: string
  }
}
```

**GET /api/stickers/styles**
```typescript
Response: {
  styles: [{
    id: string
    name: string
    template: string
    preview_url?: string
  }]
}
```

---

## Common Admin Tasks

### Task 1: Create New Inventory for Sale

```
1. Login as admin
2. Navigate to /admin/qr-batches
3. Click "Create Batch"
4. Enter:
   - Name: "Holiday 2025 Batch"
   - Batch Number: "BATCH-HOLIDAY-2025"
   - Quantity: 500
   - Status: "active" ✅
   - Size: "medium"
   - Select QR Preset
5. Click Save
6. Codes are generated automatically
7. Users can now see and purchase on /dashboard/stickers/buy
```

### Task 2: Check What's In Stock

```sql
-- Via SQL
SELECT
  b.name,
  b.status as batch_status,
  COUNT(*) FILTER (WHERE r.status = 'available') as in_stock,
  COUNT(*) FILTER (WHERE r.status = 'reserved') as sold,
  COUNT(*) as total
FROM qr_code_batches b
LEFT JOIN reserved_codes r ON b.id = r.batch_id
WHERE b.status = 'active'
GROUP BY b.id, b.name, b.status;
```

Or visit: `/admin/qr-batches` and view counts

### Task 3: Remove Batch from Sale

```
1. Go to /admin/qr-batches
2. Click on batch name
3. Change status to "archived"
4. Save
5. Batch disappears from user purchase page
```

### Task 4: Give Free Codes to a Customer

```
1. Go to /admin/qr-batches/[batch-id]
2. Find available code
3. Click "Assign"
4. Search for business
5. Select business
6. Optionally select funnel
7. Confirm
8. Code is now owned by business (no charge)
```

### Task 5: View All Orders

```sql
SELECT
  order_number,
  order_type,
  b.name as business_name,
  total,
  status,
  created_at
FROM purchase_orders p
JOIN businesses b ON p.business_id = b.id
ORDER BY created_at DESC;
```

---

## Troubleshooting

### "No stickers available"

**Cause:** No active batches with available codes

**Solution:**
1. Check batch status (must be 'active')
2. Check code status in batch (should have 'available' codes)
3. Create new batch if needed

### "Insufficient codes available"

**Cause:** User tries to buy more than available in batch

**Solution:**
- Check batch inventory
- Either reduce purchase quantity or add more codes to batch

### Code stuck in 'reserved' status

**Cause:** Purchase started but didn't complete

**Solution:**
```sql
-- Check age of reserved code
SELECT id, code, business_id, updated_at
FROM reserved_codes
WHERE status = 'reserved'
  AND updated_at < NOW() - INTERVAL '1 hour';

-- Release if abandoned
UPDATE reserved_codes
SET status = 'available', business_id = NULL
WHERE id = 'stuck-code-id';
```

### User can't see their purchased codes

**Check:**
1. Order status in `purchase_orders` (should be 'paid' or 'pending')
2. Code business_id matches user's business_id
3. Check `user_sticker_inventory` for records

---

## Future Enhancements

### Stripe Payment Integration

**Currently:** Payment is placeholder (orders marked as 'pending')

**To Implement:**
1. Install Stripe SDK
2. Create payment intent in checkout
3. Update order on payment success
4. Add webhook handler for payment events

### Email Notifications

**Trigger Events:**
- Order confirmation
- Order shipped (with tracking)
- Order delivered
- Low inventory alerts (admin)

### Automated Inventory Alerts

```sql
-- Create alert function
CREATE OR REPLACE FUNCTION check_low_inventory()
RETURNS TABLE(batch_id UUID, batch_name TEXT, available INT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    COUNT(*)::INT
  FROM qr_code_batches b
  JOIN reserved_codes r ON b.id = r.batch_id
  WHERE b.status = 'active'
    AND r.status = 'available'
  GROUP BY b.id, b.name
  HAVING COUNT(*) < 50;  -- Alert when < 50 codes
END;
$$ LANGUAGE plpgsql;
```

---

**Last Updated:** November 22, 2025
**System Version:** Stage 3 & 4 Complete
