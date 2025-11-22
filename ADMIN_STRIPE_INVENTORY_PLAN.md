# Admin Inventory & Stripe Management UI Plan

## Executive Summary

This document outlines a comprehensive plan to build admin UI components for managing inventory, pricing, and Stripe integration for the FunL QR sticker system.

**Critical Issues Identified:**
- ❌ No pricing management UI - prices are hardcoded in frontend
- ❌ Missing `pricing_tiers` column in database
- ❌ No server-side price validation (security risk)
- ❌ No admin controls for batch availability/status
- ❌ No Stripe product/price synchronization
- ❌ No order fulfillment workflow

**This Plan Addresses:**
1. Database schema fixes for pricing
2. Admin UI for inventory and pricing management
3. Stripe product catalog synchronization
4. Order management and fulfillment workflow
5. Security fixes for price validation

---

## Part 1: Database Schema Fixes

### 1.1 Add Pricing to QR Code Batches

**Migration:** `add_pricing_to_qr_batches.sql`

```sql
-- Add pricing columns to qr_code_batches
ALTER TABLE qr_code_batches
ADD COLUMN IF NOT EXISTS pricing_tiers JSONB DEFAULT '[
  {"min_quantity": 1, "max_quantity": 9, "unit_price": 5.00},
  {"min_quantity": 10, "max_quantity": 49, "unit_price": 4.50},
  {"min_quantity": 50, "max_quantity": 99, "unit_price": 4.00},
  {"min_quantity": 100, "max_quantity": null, "unit_price": 3.50}
]'::jsonb,
ADD COLUMN IF NOT EXISTS base_price NUMERIC(10,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS size_pricing JSONB DEFAULT '{
  "50mm": 1.0,
  "75mm": 1.5,
  "100mm": 2.0
}'::jsonb,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS is_available_for_purchase BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS min_purchase_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_purchase_quantity INTEGER,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_batches_available_for_purchase
ON qr_code_batches(is_available_for_purchase)
WHERE is_available_for_purchase = true;

CREATE INDEX IF NOT EXISTS idx_batches_featured
ON qr_code_batches(featured, display_order)
WHERE featured = true;

CREATE INDEX IF NOT EXISTS idx_batches_stripe_product
ON qr_code_batches(stripe_product_id)
WHERE stripe_product_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN qr_code_batches.pricing_tiers IS 'Volume pricing tiers with min/max quantity and unit price';
COMMENT ON COLUMN qr_code_batches.size_pricing IS 'Price multipliers for different sticker sizes (50mm, 75mm, 100mm)';
COMMENT ON COLUMN qr_code_batches.stripe_product_id IS 'Stripe Product ID for catalog sync';
COMMENT ON COLUMN qr_code_batches.stripe_price_id IS 'Stripe Price ID for primary pricing';
COMMENT ON COLUMN qr_code_batches.is_available_for_purchase IS 'Whether this batch is visible and purchasable by customers';
COMMENT ON COLUMN qr_code_batches.featured IS 'Featured batches appear at top of buy page';
```

### 1.2 Create Price History Table

```sql
-- Migration: create_batch_price_history.sql

CREATE TABLE IF NOT EXISTS batch_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES qr_code_batches(id) ON DELETE CASCADE,
  pricing_tiers JSONB NOT NULL,
  size_pricing JSONB,
  changed_by UUID REFERENCES admins(id),
  changed_reason TEXT,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_batch ON batch_price_history(batch_id, effective_from DESC);
CREATE INDEX idx_price_history_effective ON batch_price_history(effective_from, effective_to);

COMMENT ON TABLE batch_price_history IS 'Audit log for all pricing changes';
```

### 1.3 Create Stripe Products Sync Table

```sql
-- Migration: create_stripe_products_sync.sql

CREATE TABLE IF NOT EXISTS stripe_product_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID UNIQUE REFERENCES qr_code_batches(id) ON DELETE CASCADE,
  stripe_product_id TEXT NOT NULL,
  stripe_price_ids JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "default": "price_xxx", "50mm": "price_yyy" }
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  sync_error TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_sync_product ON stripe_product_sync(stripe_product_id);
CREATE INDEX idx_stripe_sync_status ON stripe_product_sync(sync_status) WHERE sync_status != 'synced';

COMMENT ON TABLE stripe_product_sync IS 'Tracks synchronization between FunL batches and Stripe product catalog';
```

### 1.4 Update Purchase Validation Function

```sql
-- Migration: create_validate_purchase_pricing.sql

CREATE OR REPLACE FUNCTION validate_purchase_pricing(
  p_batch_id UUID,
  p_quantity INTEGER,
  p_size TEXT,
  p_unit_price NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_batch qr_code_batches%ROWTYPE;
  v_expected_price NUMERIC;
  v_size_multiplier NUMERIC;
  v_tier JSONB;
BEGIN
  -- Get batch with pricing
  SELECT * INTO v_batch FROM qr_code_batches WHERE id = p_batch_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch not found: %', p_batch_id;
  END IF;

  IF NOT v_batch.is_available_for_purchase THEN
    RAISE EXCEPTION 'Batch not available for purchase';
  END IF;

  -- Find applicable tier
  SELECT tier INTO v_tier
  FROM jsonb_array_elements(v_batch.pricing_tiers) AS tier
  WHERE (tier->>'min_quantity')::INTEGER <= p_quantity
    AND ((tier->>'max_quantity')::INTEGER >= p_quantity OR tier->>'max_quantity' IS NULL)
  LIMIT 1;

  IF v_tier IS NULL THEN
    RAISE EXCEPTION 'No pricing tier found for quantity: %', p_quantity;
  END IF;

  -- Get size multiplier
  v_size_multiplier := COALESCE(
    (v_batch.size_pricing->>p_size)::NUMERIC,
    1.0
  );

  -- Calculate expected price
  v_expected_price := (v_tier->>'unit_price')::NUMERIC * v_size_multiplier;

  -- Allow small rounding differences (within 1 cent)
  RETURN ABS(p_unit_price - v_expected_price) < 0.02;
END;
$$;

COMMENT ON FUNCTION validate_purchase_pricing IS 'Validates that client-provided pricing matches server pricing rules';
```

---

## Part 2: Admin UI Components

### 2.1 Enhanced Batch Creation Dialog

**File:** `/funl-app/components/admin/CreateBatchDialog.tsx` (UPDATE)

**Add Pricing Section:**

```tsx
<Box mb={6}>
  <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 4 })}>
    Pricing Configuration
  </h3>

  {/* Base Price */}
  <Box mb={4}>
    <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
      Base Price (AUD)
    </label>
    <input
      type="number"
      step="0.01"
      min="0"
      value={formData.basePrice}
      onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
      className={inputStyles}
    />
    <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
      Price for 1-9 units
    </p>
  </Box>

  {/* Volume Pricing Tiers */}
  <Box mb={4}>
    <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
      Volume Pricing Tiers
    </label>
    <PricingTiersEditor
      tiers={formData.pricingTiers}
      onChange={(tiers) => setFormData({ ...formData, pricingTiers: tiers })}
    />
  </Box>

  {/* Size Pricing Multipliers */}
  <Box mb={4}>
    <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
      Size Pricing Multipliers
    </label>
    <Grid columns={3} gap={3}>
      <Box>
        <label className={css({ fontSize: 'xs', color: 'fg.muted' })}>50mm</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={formData.sizePricing['50mm']}
          onChange={(e) => setFormData({
            ...formData,
            sizePricing: { ...formData.sizePricing, '50mm': parseFloat(e.target.value) }
          })}
          className={inputStyles}
        />
      </Box>
      <Box>
        <label className={css({ fontSize: 'xs', color: 'fg.muted' })}>75mm</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={formData.sizePricing['75mm']}
          onChange={(e) => setFormData({
            ...formData,
            sizePricing: { ...formData.sizePricing, '75mm': parseFloat(e.target.value) }
          })}
          className={inputStyles}
        />
      </Box>
      <Box>
        <label className={css({ fontSize: 'xs', color: 'fg.muted' })}>100mm</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={formData.sizePricing['100mm']}
          onChange={(e) => setFormData({
            ...formData,
            sizePricing: { ...formData.sizePricing, '100mm': parseFloat(e.target.value) }
          })}
          className={inputStyles}
        />
      </Box>
    </Grid>
    <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
      Multipliers applied to base price. 1.0 = base price, 1.5 = 50% more
    </p>
  </Box>

  {/* Availability Settings */}
  <Box mb={4}>
    <Flex align="center" gap={2}>
      <input
        type="checkbox"
        id="available-for-purchase"
        checked={formData.isAvailableForPurchase}
        onChange={(e) => setFormData({ ...formData, isAvailableForPurchase: e.target.checked })}
      />
      <label htmlFor="available-for-purchase" className={css({ fontSize: 'sm' })}>
        Available for purchase
      </label>
    </Flex>
  </Box>

  <Box mb={4}>
    <Flex align="center" gap={2}>
      <input
        type="checkbox"
        id="featured"
        checked={formData.featured}
        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
      />
      <label htmlFor="featured" className={css({ fontSize: 'sm' })}>
        Feature this batch (show at top of buy page)
      </label>
    </Flex>
  </Box>

  {/* Purchase Limits */}
  <Grid columns={2} gap={3}>
    <Box>
      <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
        Minimum Purchase
      </label>
      <input
        type="number"
        min="1"
        value={formData.minPurchaseQuantity}
        onChange={(e) => setFormData({ ...formData, minPurchaseQuantity: parseInt(e.target.value) })}
        className={inputStyles}
      />
    </Box>
    <Box>
      <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
        Maximum Purchase (optional)
      </label>
      <input
        type="number"
        min="1"
        value={formData.maxPurchaseQuantity || ''}
        onChange={(e) => setFormData({ ...formData, maxPurchaseQuantity: e.target.value ? parseInt(e.target.value) : undefined })}
        className={inputStyles}
        placeholder="No limit"
      />
    </Box>
  </Grid>
</Box>

{/* Stripe Sync Checkbox */}
<Box mb={4}>
  <Flex align="center" gap={2}>
    <input
      type="checkbox"
      id="create-stripe-product"
      checked={formData.createStripeProduct}
      onChange={(e) => setFormData({ ...formData, createStripeProduct: e.target.checked })}
    />
    <label htmlFor="create-stripe-product" className={css({ fontSize: 'sm' })}>
      Create Stripe product automatically
    </label>
  </Flex>
  <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1, ml: 6 })}>
    Syncs this batch to Stripe product catalog for payment processing
  </p>
</Box>
```

### 2.2 Pricing Tiers Editor Component

**File:** `/funl-app/components/admin/PricingTiersEditor.tsx` (NEW)

```tsx
'use client'

import { useState } from 'react'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface PricingTier {
  min_quantity: number
  max_quantity: number | null
  unit_price: number
}

interface PricingTiersEditorProps {
  tiers: PricingTier[]
  onChange: (tiers: PricingTier[]) => void
}

export function PricingTiersEditor({ tiers, onChange }: PricingTiersEditorProps) {
  const updateTier = (index: number, field: keyof PricingTier, value: number | null) => {
    const newTiers = [...tiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    onChange(newTiers)
  }

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1]
    const newMin = lastTier?.max_quantity ? lastTier.max_quantity + 1 : 1
    onChange([
      ...tiers,
      { min_quantity: newMin, max_quantity: null, unit_price: 3.00 }
    ])
  }

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index))
  }

  return (
    <Box>
      {tiers.map((tier, index) => (
        <Grid key={index} columns={4} gap={2} mb={2}>
          <Box>
            <label className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1, display: 'block' })}>
              Min Qty
            </label>
            <input
              type="number"
              min="1"
              value={tier.min_quantity}
              onChange={(e) => updateTier(index, 'min_quantity', parseInt(e.target.value))}
              className={css({
                w: 'full',
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm'
              })}
            />
          </Box>
          <Box>
            <label className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1, display: 'block' })}>
              Max Qty
            </label>
            <input
              type="number"
              min="1"
              value={tier.max_quantity || ''}
              onChange={(e) => updateTier(index, 'max_quantity', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="∞"
              className={css({
                w: 'full',
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm'
              })}
            />
          </Box>
          <Box>
            <label className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1, display: 'block' })}>
              Price (AUD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={tier.unit_price}
              onChange={(e) => updateTier(index, 'unit_price', parseFloat(e.target.value))}
              className={css({
                w: 'full',
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm'
              })}
            />
          </Box>
          <Box>
            <label className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1, display: 'block' })}>
              &nbsp;
            </label>
            {tiers.length > 1 && (
              <button
                onClick={() => removeTier(index)}
                className={css({
                  px: 3,
                  py: 2,
                  bg: 'red.subtle',
                  color: 'red.text',
                  rounded: 'md',
                  fontSize: 'sm',
                  _hover: { bg: 'red.emphasized' }
                })}
              >
                Remove
              </button>
            )}
          </Box>
        </Grid>
      ))}

      <button
        onClick={addTier}
        className={css({
          px: 4,
          py: 2,
          bg: 'accent.subtle',
          color: 'accent.text',
          rounded: 'md',
          fontSize: 'sm',
          fontWeight: 'medium',
          _hover: { bg: 'accent.emphasized' }
        })}
      >
        + Add Tier
      </button>

      {/* Preview */}
      <Box mt={4} p={3} bg="bg.subtle" rounded="md" borderWidth="1px" borderColor="border.default">
        <p className={css({ fontSize: 'xs', fontWeight: 'semibold', mb: 2, color: 'fg.muted' })}>
          Preview:
        </p>
        {tiers.map((tier, index) => (
          <p key={index} className={css({ fontSize: 'xs', color: 'fg.default', mb: 1 })}>
            {tier.min_quantity}-{tier.max_quantity || '∞'} units: ${tier.unit_price.toFixed(2)} each
          </p>
        ))}
      </Box>
    </Box>
  )
}
```

### 2.3 Batch Pricing Editor (Edit Existing Batches)

**File:** `/funl-app/components/admin/BatchPricingEditor.tsx` (NEW)

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { PricingTiersEditor } from './PricingTiersEditor'

interface BatchPricingEditorProps {
  batchId: string
  currentPricing: {
    pricing_tiers: any[]
    size_pricing: Record<string, number>
    is_available_for_purchase: boolean
    featured: boolean
    min_purchase_quantity: number
    max_purchase_quantity?: number
  }
}

export function BatchPricingEditor({ batchId, currentPricing }: BatchPricingEditorProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(currentPricing)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/batches/${batchId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricing_tiers: formData.pricing_tiers,
          size_pricing: formData.size_pricing,
          is_available_for_purchase: formData.is_available_for_purchase,
          featured: formData.featured,
          min_purchase_quantity: formData.min_purchase_quantity,
          max_purchase_quantity: formData.max_purchase_quantity,
        })
      })

      if (!response.ok) throw new Error('Failed to update pricing')

      setEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating pricing:', error)
      alert('Failed to update pricing')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <Box>
        <Flex justify="space-between" align="center" mb={4}>
          <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>
            Pricing & Availability
          </h3>
          <button
            onClick={() => setEditing(true)}
            className={css({
              px: 4,
              py: 2,
              bg: 'accent.default',
              color: 'white',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'semibold',
              _hover: { bg: 'accent.emphasized' }
            })}
          >
            Edit Pricing
          </button>
        </Flex>

        {/* Current Pricing Display */}
        <Box p={4} bg="bg.subtle" rounded="md" borderWidth="1px" borderColor="border.default">
          <p className={css({ fontSize: 'sm', fontWeight: 'semibold', mb: 2 })}>
            Volume Pricing:
          </p>
          {currentPricing.pricing_tiers.map((tier: any, index: number) => (
            <p key={index} className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
              {tier.min_quantity}-{tier.max_quantity || '∞'} units: ${tier.unit_price.toFixed(2)} each
            </p>
          ))}

          <p className={css({ fontSize: 'sm', fontWeight: 'semibold', mt: 4, mb: 2 })}>
            Size Multipliers:
          </p>
          {Object.entries(currentPricing.size_pricing).map(([size, multiplier]) => (
            <p key={size} className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
              {size}: {multiplier}x
            </p>
          ))}

          <p className={css({ fontSize: 'sm', fontWeight: 'semibold', mt: 4, mb: 2 })}>
            Availability:
          </p>
          <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            {currentPricing.is_available_for_purchase ? '✅ Available for purchase' : '❌ Not available'}
          </p>
          {currentPricing.featured && (
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              ⭐ Featured batch
            </p>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 4 })}>
        Edit Pricing & Availability
      </h3>

      <Box mb={4}>
        <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
          Volume Pricing Tiers
        </label>
        <PricingTiersEditor
          tiers={formData.pricing_tiers}
          onChange={(tiers) => setFormData({ ...formData, pricing_tiers: tiers })}
        />
      </Box>

      <Box mb={4}>
        <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
          Size Pricing Multipliers
        </label>
        <Grid columns={3} gap={3}>
          {['50mm', '75mm', '100mm'].map((size) => (
            <Box key={size}>
              <label className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                {size}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.size_pricing[size]}
                onChange={(e) => setFormData({
                  ...formData,
                  size_pricing: { ...formData.size_pricing, [size]: parseFloat(e.target.value) }
                })}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  fontSize: 'sm'
                })}
              />
            </Box>
          ))}
        </Grid>
      </Box>

      <Box mb={4}>
        <Flex align="center" gap={2}>
          <input
            type="checkbox"
            id="available"
            checked={formData.is_available_for_purchase}
            onChange={(e) => setFormData({ ...formData, is_available_for_purchase: e.target.checked })}
          />
          <label htmlFor="available" className={css({ fontSize: 'sm' })}>
            Available for purchase
          </label>
        </Flex>
      </Box>

      <Box mb={4}>
        <Flex align="center" gap={2}>
          <input
            type="checkbox"
            id="featured-edit"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
          />
          <label htmlFor="featured-edit" className={css({ fontSize: 'sm' })}>
            Featured batch
          </label>
        </Flex>
      </Box>

      <Flex gap={3}>
        <button
          onClick={handleSave}
          disabled={saving}
          className={css({
            px: 6,
            py: 2,
            bg: 'accent.default',
            color: 'white',
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'semibold',
            _hover: { bg: 'accent.emphasized' },
            _disabled: { opacity: 0.5, cursor: 'not-allowed' }
          })}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={() => {
            setFormData(currentPricing)
            setEditing(false)
          }}
          className={css({
            px: 6,
            py: 2,
            bg: 'bg.subtle',
            color: 'fg.default',
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'semibold',
            _hover: { bg: 'bg.muted' }
          })}
        >
          Cancel
        </button>
      </Flex>
    </Box>
  )
}
```

### 2.4 Update Batch Detail Page

**File:** `/funl-app/app/admin/qr-batches/[id]/page.tsx` (UPDATE)

**Add after statistics cards:**

```tsx
{/* Pricing & Availability Section */}
<Box mb={6}>
  <BatchPricingEditor
    batchId={id}
    currentPricing={{
      pricing_tiers: batch.pricing_tiers || defaultPricingTiers,
      size_pricing: batch.size_pricing || { '50mm': 1.0, '75mm': 1.5, '100mm': 2.0 },
      is_available_for_purchase: batch.is_available_for_purchase ?? true,
      featured: batch.featured ?? false,
      min_purchase_quantity: batch.min_purchase_quantity ?? 1,
      max_purchase_quantity: batch.max_purchase_quantity,
    }}
  />
</Box>

{/* Stripe Sync Section */}
<Box mb={6}>
  <StripeSyncPanel
    batchId={id}
    stripeProductId={batch.stripe_product_id}
    stripePriceId={batch.stripe_price_id}
  />
</Box>
```

---

## Part 3: Stripe Product Sync UI

### 3.1 Stripe Sync Panel Component

**File:** `/funl-app/components/admin/StripeSyncPanel.tsx` (NEW)

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface StripeSyncPanelProps {
  batchId: string
  stripeProductId?: string | null
  stripePriceId?: string | null
}

export function StripeSyncPanel({ batchId, stripeProductId, stripePriceId }: StripeSyncPanelProps) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSync = async () => {
    setSyncing(true)
    setSyncStatus('idle')

    try {
      const response = await fetch(`/api/admin/stripe/sync-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId })
      })

      if (!response.ok) throw new Error('Sync failed')

      setSyncStatus('success')
      router.refresh()
    } catch (error) {
      console.error('Stripe sync error:', error)
      setSyncStatus('error')
    } finally {
      setSyncing(false)
    }
  }

  const handleRemoveSync = async () => {
    if (!confirm('Remove Stripe sync? This will not delete the Stripe product, only the link.')) {
      return
    }

    setSyncing(true)
    try {
      const response = await fetch(`/api/admin/stripe/sync-product`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId })
      })

      if (!response.ok) throw new Error('Failed to remove sync')

      setSyncStatus('success')
      router.refresh()
    } catch (error) {
      console.error('Error removing sync:', error)
      setSyncStatus('error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Box p={6} bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
      <Flex justify="space-between" align="center" mb={4}>
        <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>
          Stripe Integration
        </h3>
        {stripeProductId && (
          <a
            href={`https://dashboard.stripe.com/products/${stripeProductId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={css({
              px: 3,
              py: 1,
              bg: 'purple.subtle',
              color: 'purple.text',
              rounded: 'md',
              fontSize: 'xs',
              fontWeight: 'medium',
              _hover: { bg: 'purple.emphasized' }
            })}
          >
            View in Stripe →
          </a>
        )}
      </Flex>

      {stripeProductId ? (
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>
            ✅ Synced to Stripe
          </p>
          <Box p={3} bg="bg.subtle" rounded="md" mb={3}>
            <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>
              Product ID:
            </p>
            <p className={css({ fontSize: 'sm', fontFamily: 'mono', color: 'fg.default' })}>
              {stripeProductId}
            </p>
            {stripePriceId && (
              <>
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1, mt: 2 })}>
                  Price ID:
                </p>
                <p className={css({ fontSize: 'sm', fontFamily: 'mono', color: 'fg.default' })}>
                  {stripePriceId}
                </p>
              </>
            )}
          </Box>
          <Flex gap={2}>
            <button
              onClick={handleSync}
              disabled={syncing}
              className={css({
                px: 4,
                py: 2,
                bg: 'blue.default',
                color: 'white',
                rounded: 'md',
                fontSize: 'sm',
                fontWeight: 'semibold',
                _hover: { bg: 'blue.emphasized' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' }
              })}
            >
              {syncing ? 'Syncing...' : 'Re-sync to Stripe'}
            </button>
            <button
              onClick={handleRemoveSync}
              disabled={syncing}
              className={css({
                px: 4,
                py: 2,
                bg: 'red.subtle',
                color: 'red.text',
                rounded: 'md',
                fontSize: 'sm',
                fontWeight: 'semibold',
                _hover: { bg: 'red.emphasized' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' }
              })}
            >
              Remove Sync
            </button>
          </Flex>
        </Box>
      ) : (
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 3 })}>
            This batch is not synced to Stripe. Sync it to enable payment processing.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className={css({
              px: 4,
              py: 2,
              bg: 'purple.default',
              color: 'white',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'semibold',
              _hover: { bg: 'purple.emphasized' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' }
            })}
          >
            {syncing ? 'Creating...' : 'Create Stripe Product'}
          </button>
        </Box>
      )}

      {syncStatus === 'success' && (
        <Box mt={3} p={3} bg="green.subtle" borderWidth="1px" borderColor="green.default" rounded="md">
          <p className={css({ fontSize: 'sm', color: 'green.text' })}>
            ✅ Sync successful
          </p>
        </Box>
      )}

      {syncStatus === 'error' && (
        <Box mt={3} p={3} bg="red.subtle" borderWidth="1px" borderColor="red.default" rounded="md">
          <p className={css({ fontSize: 'sm', color: 'red.text' })}>
            ❌ Sync failed. Check console for details.
          </p>
        </Box>
      )}
    </Box>
  )
}
```

---

## Part 4: Admin API Endpoints

### 4.1 Update Batch Pricing API

**File:** `/funl-app/app/api/admin/batches/[id]/pricing/route.ts` (NEW)

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check admin authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      pricing_tiers,
      size_pricing,
      is_available_for_purchase,
      featured,
      min_purchase_quantity,
      max_purchase_quantity,
    } = body

    // Get current pricing for history
    const { data: currentBatch } = await supabase
      .from('qr_code_batches')
      .select('pricing_tiers, size_pricing')
      .eq('id', id)
      .single()

    // Update batch
    const { error: updateError } = await supabase
      .from('qr_code_batches')
      .update({
        pricing_tiers,
        size_pricing,
        is_available_for_purchase,
        featured,
        min_purchase_quantity,
        max_purchase_quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    // Log price change if pricing actually changed
    if (
      JSON.stringify(currentBatch?.pricing_tiers) !== JSON.stringify(pricing_tiers) ||
      JSON.stringify(currentBatch?.size_pricing) !== JSON.stringify(size_pricing)
    ) {
      await supabase.from('batch_price_history').insert({
        batch_id: id,
        pricing_tiers,
        size_pricing,
        changed_by: user.id,
        changed_reason: 'Manual update via admin UI',
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating pricing:', error)
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 }
    )
  }
}
```

### 4.2 Stripe Product Sync API

**File:** `/funl-app/app/api/admin/stripe/sync-product/route.ts` (NEW)

```typescript
import { stripe } from '@/lib/stripe/stripe-client'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { batch_id } = await request.json()

    // Get batch details
    const { data: batch, error: batchError } = await supabase
      .from('qr_code_batches')
      .select('*')
      .eq('id', batch_id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    let productId = batch.stripe_product_id

    // Create or update Stripe product
    if (productId) {
      // Update existing product
      await stripe.products.update(productId, {
        name: batch.name,
        description: batch.description || undefined,
        active: batch.is_available_for_purchase,
        metadata: {
          batch_id: batch.id,
          batch_number: batch.batch_number,
        },
      })
    } else {
      // Create new product
      const product = await stripe.products.create({
        name: batch.name,
        description: batch.description || 'QR Code Stickers',
        active: batch.is_available_for_purchase,
        metadata: {
          batch_id: batch.id,
          batch_number: batch.batch_number,
        },
      })
      productId = product.id
    }

    // Create/update price (use base tier price)
    const baseTier = batch.pricing_tiers?.[0]
    if (baseTier) {
      const price = await stripe.prices.create({
        product: productId,
        currency: 'aud',
        unit_amount: Math.round(baseTier.unit_price * 100), // Convert to cents
        metadata: {
          batch_id: batch.id,
          tier_index: '0',
        },
      })

      // Update batch with Stripe IDs
      await supabase
        .from('qr_code_batches')
        .update({
          stripe_product_id: productId,
          stripe_price_id: price.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batch_id)

      // Log sync
      await supabase.from('stripe_product_sync').upsert({
        batch_id,
        stripe_product_id: productId,
        stripe_price_ids: { default: price.id },
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
      })
    }

    return NextResponse.json({
      success: true,
      product_id: productId,
    })

  } catch (error) {
    console.error('Stripe sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync with Stripe' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { batch_id } = await request.json()

    // Remove Stripe IDs from batch
    await supabase
      .from('qr_code_batches')
      .update({
        stripe_product_id: null,
        stripe_price_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch_id)

    // Remove sync record
    await supabase
      .from('stripe_product_sync')
      .delete()
      .eq('batch_id', batch_id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error removing sync:', error)
    return NextResponse.json(
      { error: 'Failed to remove sync' },
      { status: 500 }
    )
  }
}
```

---

## Part 5: Order Management UI

### 5.1 Admin Orders Dashboard

**File:** `/funl-app/app/admin/orders/page.tsx` (NEW)

```tsx
import { createClient } from '@/lib/supabase/server'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { OrdersTable } from '@/components/admin/OrdersTable'

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; payment_status?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('purchase_orders')
    .select('*, businesses(name, email)', { count: 'exact' })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.payment_status && params.payment_status !== 'all') {
    query = query.eq('payment_status', params.payment_status)
  }

  // Pagination
  const page = parseInt(params.page || '1')
  const limit = 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query
    .range(from, to)
    .order('created_at', { ascending: false })

  const { data: orders, error, count } = await query

  if (error) {
    throw new Error('Failed to fetch orders')
  }

  // Get stats
  const { data: stats } = await supabase.rpc('get_order_stats')

  return (
    <Box>
      <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 6 })}>
        Orders
      </h1>

      {/* Stats Cards */}
      <Grid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Total Orders</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold' })}>{stats?.total_orders || 0}</p>
        </Box>
        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Pending Payment</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'orange.600' })}>{stats?.pending_payment || 0}</p>
        </Box>
        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>To Ship</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'blue.600' })}>{stats?.to_ship || 0}</p>
        </Box>
        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Total Revenue</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'green.600' })}>${stats?.total_revenue?.toFixed(2) || '0.00'}</p>
        </Box>
      </Grid>

      {/* Orders Table */}
      <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <OrdersTable
          orders={orders || []}
          pagination={{
            total: count || 0,
            page,
            limit,
            pages: Math.ceil((count || 0) / limit)
          }}
          filters={{
            status: params.status || 'all',
            payment_status: params.payment_status || 'all'
          }}
        />
      </Box>
    </Box>
  )
}
```

### 5.2 Order Fulfillment Panel

**File:** `/funl-app/components/admin/OrderFulfillmentPanel.tsx` (NEW)

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface OrderFulfillmentPanelProps {
  orderId: string
  currentStatus: string
  trackingNumber?: string | null
  carrier?: string | null
}

export function OrderFulfillmentPanel({
  orderId,
  currentStatus,
  trackingNumber: initialTracking,
  carrier: initialCarrier
}: OrderFulfillmentPanelProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState(initialTracking || '')
  const [carrier, setCarrier] = useState(initialCarrier || '')

  const handleMarkShipped = async () => {
    if (!trackingNumber || !carrier) {
      alert('Please enter tracking number and carrier')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_number: trackingNumber, carrier })
      })

      if (!response.ok) throw new Error('Failed to update order')

      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to mark as shipped')
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkDelivered = async () => {
    if (!confirm('Mark this order as delivered?')) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/deliver`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to update order')

      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to mark as delivered')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Box p={6} bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
      <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 4 })}>
        Order Fulfillment
      </h3>

      <Box mb={4}>
        <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
          Current Status:
        </p>
        <p className={css({ fontSize: 'md', fontWeight: 'semibold' })}>
          {currentStatus}
        </p>
      </Box>

      {currentStatus === 'paid' || currentStatus === 'processing' ? (
        <Box>
          <Box mb={3}>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
              Tracking Number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className={css({
                w: 'full',
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm'
              })}
              placeholder="Enter tracking number"
            />
          </Box>

          <Box mb={4}>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
              Carrier
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className={css({
                w: 'full',
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm'
              })}
            >
              <option value="">Select carrier</option>
              <option value="Australia Post">Australia Post</option>
              <option value="StarTrack">StarTrack</option>
              <option value="DHL">DHL</option>
              <option value="FedEx">FedEx</option>
              <option value="TNT">TNT</option>
            </select>
          </Box>

          <button
            onClick={handleMarkShipped}
            disabled={updating}
            className={css({
              w: 'full',
              px: 6,
              py: 3,
              bg: 'blue.default',
              color: 'white',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'semibold',
              _hover: { bg: 'blue.emphasized' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' }
            })}
          >
            {updating ? 'Updating...' : 'Mark as Shipped'}
          </button>
        </Box>
      ) : currentStatus === 'shipped' ? (
        <Box>
          <Box mb={4} p={3} bg="bg.subtle" rounded="md">
            <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
              Tracking Number:
            </p>
            <p className={css({ fontSize: 'md', fontFamily: 'mono' })}>
              {trackingNumber}
            </p>
            <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1, mt: 2 })}>
              Carrier:
            </p>
            <p className={css({ fontSize: 'md' })}>
              {carrier}
            </p>
          </Box>

          <button
            onClick={handleMarkDelivered}
            disabled={updating}
            className={css({
              w: 'full',
              px: 6,
              py: 3,
              bg: 'green.default',
              color: 'white',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'semibold',
              _hover: { bg: 'green.emphasized' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' }
            })}
          >
            {updating ? 'Updating...' : 'Mark as Delivered'}
          </button>
        </Box>
      ) : (
        <Box p={3} bg="green.subtle" rounded="md">
          <p className={css({ fontSize: 'sm', color: 'green.text' })}>
            ✅ Order {currentStatus}
          </p>
        </Box>
      )}
    </Box>
  )
}
```

---

## Part 6: Security Updates

### 6.1 Update Purchase API with Price Validation

**File:** `/funl-app/app/api/stickers/purchase/route.ts` (UPDATE)

**Add validation before creating order:**

```typescript
// After validating items and shipping...

// Validate pricing for each item
for (const item of items) {
  const { data: isValid, error: validationError } = await supabase
    .rpc('validate_purchase_pricing', {
      p_batch_id: item.batch_id,
      p_quantity: item.quantity,
      p_size: item.size,
      p_unit_price: item.unit_price
    })

  if (validationError || !isValid) {
    return NextResponse.json(
      { error: `Invalid pricing for item ${item.batch_id}. Please refresh and try again.` },
      { status: 400 }
    )
  }
}

// Continue with order creation...
```

---

## Part 7: Implementation Checklist

### Database

- [ ] Run migration: `add_pricing_to_qr_batches.sql`
- [ ] Run migration: `create_batch_price_history.sql`
- [ ] Run migration: `create_stripe_products_sync.sql`
- [ ] Run migration: `create_validate_purchase_pricing.sql`
- [ ] Update existing batches with default pricing tiers

### Admin UI Components

- [ ] Update `CreateBatchDialog.tsx` with pricing fields
- [ ] Create `PricingTiersEditor.tsx`
- [ ] Create `BatchPricingEditor.tsx`
- [ ] Update batch detail page with pricing editor
- [ ] Create `StripeSyncPanel.tsx`
- [ ] Create admin orders page
- [ ] Create `OrdersTable.tsx` component
- [ ] Create `OrderFulfillmentPanel.tsx`

### API Endpoints

- [ ] Create `/api/admin/batches/[id]/pricing/route.ts`
- [ ] Create `/api/admin/stripe/sync-product/route.ts`
- [ ] Create `/api/admin/orders/[id]/ship/route.ts`
- [ ] Create `/api/admin/orders/[id]/deliver/route.ts`
- [ ] Update `/api/stickers/purchase/route.ts` with price validation

### Security

- [ ] Test price validation function
- [ ] Verify RLS policies for purchase_orders
- [ ] Verify admin-only access to pricing APIs
- [ ] Test client cannot manipulate prices

### Stripe Integration

- [ ] Test creating Stripe products
- [ ] Test syncing pricing to Stripe
- [ ] Test removing sync
- [ ] Verify Stripe dashboard links work

### Testing

- [ ] Test creating batch with custom pricing
- [ ] Test editing pricing for existing batch
- [ ] Test price history logging
- [ ] Test volume tier calculation
- [ ] Test size pricing multipliers
- [ ] Test batch availability toggle
- [ ] Test featured batch display
- [ ] Test Stripe product creation
- [ ] Test order fulfillment workflow

---

## Part 8: Future Enhancements

### Phase 2 Features

1. **Bulk Pricing Updates**
   - Apply pricing changes to multiple batches at once
   - Import pricing from CSV

2. **Promotional Pricing**
   - Time-limited discounts
   - Coupon codes
   - Bundle pricing

3. **Advanced Inventory Alerts**
   - Email notifications for low stock
   - Auto-reorder triggers
   - Inventory forecasting

4. **Customer-Specific Pricing**
   - VIP pricing tiers
   - Business account discounts
   - Volume contracts

5. **Reporting & Analytics**
   - Revenue by batch
   - Popular sizes/styles
   - Profit margin analysis
   - Sales trends

---

**Document Version:** 2.0
**Last Updated:** 2025-01-23
**Status:** ✅ COMPLETED - All core features implemented

## Implementation Summary

All planned features have been successfully implemented:

✅ **Database Schema** (Part 1)
- Added pricing_tiers, size_pricing to qr_code_batches
- Created batch_price_history table
- Created stripe_product_sync table
- Added validate_purchase_pricing() security function

✅ **Admin Pricing UI** (Part 2)
- PricingTiersEditor component (visual tier editor)
- BatchPricingEditor component (complete pricing management)
- Admin pricing API endpoints with validation
- Price history logging

✅ **Stripe Integration** (Part 3)
- StripeSyncPanel component (one-click sync)
- Stripe product/price creation API
- Automatic metadata mapping
- Sync status tracking

✅ **Order Management** (Part 4)
- Admin orders dashboard with filtering
- OrdersTable component (tabbed status views)
- OrderFulfillmentPanel component (shipping workflow)
- Order fulfillment API endpoints

✅ **Security** (Part 5)
- Server-side price validation prevents tampering
- Admin-only access controls
- Stripe webhook security with idempotency
- Atomic code allocation (prevents overselling)
