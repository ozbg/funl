-- Migration: Add pricing configuration to qr_code_batches
-- This enables admin-managed pricing for QR sticker batches

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
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS is_available_for_purchase BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS min_purchase_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_purchase_quantity INTEGER,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create unique constraint for Stripe product ID
ALTER TABLE qr_code_batches
ADD CONSTRAINT qr_code_batches_stripe_product_id_key
UNIQUE (stripe_product_id);

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
COMMENT ON COLUMN qr_code_batches.base_price IS 'Base price for single unit (used for quick reference)';
COMMENT ON COLUMN qr_code_batches.min_purchase_quantity IS 'Minimum quantity that can be purchased';
COMMENT ON COLUMN qr_code_batches.max_purchase_quantity IS 'Maximum quantity that can be purchased (null = no limit)';
COMMENT ON COLUMN qr_code_batches.display_order IS 'Order in which batches are displayed (lower = higher priority)';
