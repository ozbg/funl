# Inventory & Product Management Guide

## Overview
FunL manages physical products (QR code stickers) through an inventory system. This guide walks you through creating products, generating QR code batches, managing inventory, and testing the customer purchase flow.

---

## 1. Understanding the Inventory System

### How It Works
1. **Products** define what customers can buy (QR stickers with different designs)
2. **QR Batches** are bulk-generated sets of unique QR codes
3. **Inventory** tracks available codes per product/batch
4. **Orders** allocate inventory to customers
5. **Fulfillment** marks codes as shipped/delivered

### Key Concepts
- **Product**: Sellable item (e.g., "Classic Square QR Stickers")
- **Batch**: Pre-generated set of QR codes ready to print
- **Stock**: Number of codes available vs. allocated
- **Allocation**: Reserved for an order but not yet shipped
- **Assignment**: Permanently given to a customer

---

## 2. Creating Products

### Navigate to Products
- [ ] Go to `/admin/products`
- [ ] Review existing products
- [ ] Check stats: Total, Active, Inactive, Low Stock

### Create a New Product
- [ ] Click "Create Product"
- [ ] Fill in basic details:
  - Name: "Premium Round QR Stickers"
  - Slug: "premium-round-qr" (auto-generated)
  - Description: Full product description
  - Type: Select "QR Stickers"
- [ ] Set pricing tiers:
  - Quantity 1: $2.00 each
  - Quantity 10: $1.80 each
  - Quantity 50: $1.50 each
  - Quantity 100: $1.20 each
- [ ] Configure inventory:
  - ☑ Tracks Inventory
  - Low Stock Threshold: 50
  - Current Stock: 0 (will add via batches)
- [ ] Upload product image (optional)
- [ ] Mark as "Active"
- [ ] Mark as "Featured" (optional)
- [ ] Click "Create"

### Test Product Configuration
- [ ] Verify product appears in list
- [ ] Check it shows "0 stock" and "0 batches linked"
- [ ] Edit product and change pricing
- [ ] Verify changes saved
- [ ] Deactivate product
- [ ] Verify it doesn't show in customer view
- [ ] Reactivate product

---

## 3. Generating QR Code Batches

### Navigate to QR Batches
- [ ] Go to `/admin/qr-batches`
- [ ] Review inventory overview:
  - Total Codes
  - Available
  - Assigned
  - Reserved

### Create Your First Batch
- [ ] Click "Create Batch"
- [ ] Fill in details:
  - Name: "Batch-1 Classic Square"
  - Description: "Initial batch for launch"
  - Asset Type: "Sticker"
  - Size: "All Sizes" or specific size
  - Quantity: 100 (or desired amount)
- [ ] Click "Generate"
- [ ] Wait for generation to complete (may take a few seconds)
- [ ] Verify batch appears in list with status "generated"

### Export Batch for Printing
- [ ] Find the new batch in the list
- [ ] Click "View Details"
- [ ] Click "Export PDFs"
- [ ] Choose print layout:
  - Label Size: Avery 5160 (or your preference)
  - Codes per page: 30
  - Include cut marks: ☑
- [ ] Click "Generate PDF"
- [ ] Download and verify PDF looks correct
- [ ] Print test page to verify alignment

### Alternative: CSV Export
- [ ] Click "CSV" button on batch
- [ ] Download CSV file
- [ ] Verify it contains:
  - Short code (e.g., PPjCcGbN)
  - Full URL (e.g., https://funl.au/f/PPjCcGbN)
  - Batch number
  - Status

### Mark Batch as Printed
- [ ] In batch list, find your batch
- [ ] Click "Mark as Printing"
- [ ] Status changes to "printing"
- [ ] After printing, click "Mark as Printed"
- [ ] Status changes to "printed"

### Activate Batch for Inventory
- [ ] Click "Mark as Shipped" (if tracking shipping)
- [ ] Click "Mark as Received" (if tracking receiving)
- [ ] Click "Activate Batch"
- [ ] Status changes to "active"
- [ ] Verify inventory overview shows increased "Available" count

---

## 4. Linking Batches to Products

### Link Batch to Product
- [ ] Go to `/admin/products`
- [ ] Find your product
- [ ] Click "Edit"
- [ ] Scroll to "Linked Batches" section
- [ ] Click "Link Batch"
- [ ] Select the batch you created
- [ ] Specify quantity to allocate: 50 (or desired amount)
- [ ] Click "Link"
- [ ] Verify product now shows "50 in stock"
- [ ] Verify batch shows "50 allocated"

### Test Inventory Tracking
- [ ] Check product stock count increased
- [ ] Check "Batches Linked" column shows "1"
- [ ] Go to batch details
- [ ] Verify shows:
  - Quantity: 100
  - Available: 50
  - Allocated: 50

---

## 5. Managing Low Stock Alerts

### Configure Alert Thresholds
- [ ] Go to `/admin/products`
- [ ] Edit a product
- [ ] Set "Low Stock Threshold": 20
- [ ] Save product

### Test Low Stock Alerts
- [ ] Manually reduce stock below threshold OR
- [ ] Create test orders until stock drops
- [ ] Go to `/admin/inventory-alerts`
- [ ] Verify alert appears showing:
  - Product name
  - Current stock
  - Threshold
  - Severity: "critical" if 0, "warning" if low

### Replenish Stock
- [ ] Create new QR batch
- [ ] Activate batch
- [ ] Link to low-stock product
- [ ] Verify alert disappears when stock above threshold

---

## 6. Testing Customer Purchase Flow

### As Customer: Browse Products
- [ ] Open incognito browser
- [ ] Sign in as test customer
- [ ] Go to products/shop page
- [ ] Verify you see active products only
- [ ] Verify featured products highlighted
- [ ] Verify pricing tiers shown correctly

### As Customer: Add to Cart
- [ ] Select a product
- [ ] Choose quantity: 10
- [ ] Click "Add to Cart"
- [ ] Verify cart shows:
  - Product name
  - Quantity
  - Price (with tier discount applied)
  - Total

### As Customer: Checkout
- [ ] Click "Checkout"
- [ ] Verify redirected to Stripe Checkout
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Complete purchase
- [ ] Verify redirected to success page
- [ ] Check email for receipt

### As Customer: View Order
- [ ] Go to "My Orders" or dashboard
- [ ] Verify order appears with status "pending"
- [ ] Verify shows:
  - Order number
  - Date
  - Total
  - Items purchased
  - Status

---

## 7. Processing Orders (Admin)

### View New Orders
- [ ] Go to `/admin/orders`
- [ ] Verify new order appears
- [ ] Check status is "paid"
- [ ] Review order details:
  - Customer email
  - Items ordered
  - Payment status
  - Fulfillment status

### Check Inventory Allocation
- [ ] Go to `/admin/products`
- [ ] Find product from order
- [ ] Verify stock decreased by order quantity
- [ ] Verify "Allocated" count increased
- [ ] Go to linked batch
- [ ] Verify batch shows codes allocated to order

### Fulfill Order (Assign Codes)
- [ ] Go back to order details
- [ ] Click "Assign QR Codes"
- [ ] System automatically:
  - Picks codes from available inventory
  - Marks codes as assigned to customer
  - Updates order status to "fulfilled"
- [ ] Verify codes assigned correctly
- [ ] Verify customer can now see codes

### As Customer: View Assigned Codes
- [ ] Sign in as customer
- [ ] Go to "My Orders"
- [ ] Click on fulfilled order
- [ ] Verify you see:
  - List of QR code URLs
  - Short codes
  - Download option (CSV/PDF)
- [ ] Click download
- [ ] Verify file contains all purchased codes

---

## 8. Inventory Monitoring

### Daily Checks
- [ ] Go to `/admin/inventory-alerts`
- [ ] Review any critical alerts (out of stock)
- [ ] Review warning alerts (low stock)
- [ ] Plan to generate new batches as needed

### Weekly Checks
- [ ] Go to `/admin/products`
- [ ] Review stock levels across all products
- [ ] Check "Low Stock Alerts" metric
- [ ] Generate batches for popular products

### Monitor Batch Usage
- [ ] Go to `/admin/qr-batches`
- [ ] Review "Available" vs "Assigned" for each batch
- [ ] Identify depleting batches
- [ ] Check for batches with status "depleted"
- [ ] Archive old depleted batches

---

## 9. Testing Edge Cases

### Test Out of Stock Purchase
- [ ] Reduce product stock to 0
- [ ] Try to purchase as customer
- [ ] Verify "Out of Stock" message shown
- [ ] Verify cannot add to cart
- [ ] Replenish stock
- [ ] Verify can purchase again

### Test Quantity Limits
- [ ] Set product stock to 5
- [ ] Try to purchase 10 as customer
- [ ] Verify limited to available stock
- [ ] Complete purchase of 5
- [ ] Verify stock now 0

### Test Multiple Products
- [ ] Add multiple different products to cart
- [ ] Complete purchase
- [ ] Verify all products allocated correctly
- [ ] Verify codes from correct batches

### Test Insufficient Inventory
- [ ] Create order that would exceed available codes
- [ ] System should either:
  - Prevent purchase, OR
  - Allow but mark for manual fulfillment
- [ ] Verify admin gets notification

---

## 10. Bulk Operations

### Generate Multiple Batches
- [ ] Create batch #1: 100 codes
- [ ] Create batch #2: 100 codes
- [ ] Create batch #3: 100 codes
- [ ] Activate all batches
- [ ] Verify total inventory increased by 300

### Link Multiple Batches to Product
- [ ] Edit product
- [ ] Link batch #1 (100 codes)
- [ ] Link batch #2 (100 codes)
- [ ] Link batch #3 (100 codes)
- [ ] Verify product shows 300 stock
- [ ] Verify "3 batches linked"

### Export All Batches
- [ ] From `/admin/qr-batches`
- [ ] Select multiple batches
- [ ] Click "Bulk Export CSV"
- [ ] Download combined file
- [ ] Verify contains codes from all batches

---

## 11. Pre-Flight Checklist

Before going live:
- [ ] At least 3 products created and active
- [ ] Each product has 100+ codes in inventory
- [ ] Low stock thresholds configured
- [ ] Inventory alerts working
- [ ] Test purchase completed successfully
- [ ] Order fulfillment tested end-to-end
- [ ] Customer can view assigned codes
- [ ] PDF/CSV exports work correctly
- [ ] Out of stock handling tested
- [ ] Pricing tiers calculating correctly
- [ ] All product images uploaded
- [ ] Product descriptions complete
- [ ] Stripe payment integration working
- [ ] Order confirmation emails sending

---

## 12. Common Issues & Solutions

### Codes Not Allocating to Orders
- [ ] Check batch status is "active"
- [ ] Verify batch is linked to product
- [ ] Check batch has available codes
- [ ] Review allocation logs

### Customer Can't See Codes
- [ ] Verify order status is "fulfilled"
- [ ] Check codes were assigned (not just allocated)
- [ ] Review customer access permissions
- [ ] Check database for code assignments

### Low Stock Alerts Not Showing
- [ ] Verify low stock threshold set
- [ ] Check actual stock vs threshold
- [ ] Review alert generation logic
- [ ] Check admin notifications enabled

### Batch Generation Fails
- [ ] Check system resources (memory/CPU)
- [ ] Review batch size (try smaller)
- [ ] Check database connection
- [ ] Review application logs

---

## Reference: Inventory States

```
Product Stock States:
- In Stock: current_stock > low_threshold
- Low Stock: 0 < current_stock <= low_threshold
- Out of Stock: current_stock = 0

QR Code States:
- Available: In batch, not allocated
- Allocated: Reserved for order, not fulfilled
- Assigned: Given to customer, active
- Reserved: Held for special purpose

Batch States:
- Generated: Created, not ready for use
- Printing: Being printed
- Printed: Print complete, not shipped
- Shipped: On the way
- Received: Arrived, ready to activate
- Active: In use, codes can be allocated
- Depleted: All codes used up
```
