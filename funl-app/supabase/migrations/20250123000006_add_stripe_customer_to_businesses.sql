-- Migration: Add Stripe customer ID to businesses
-- Enables saved payment methods and customer management

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create unique constraint
ALTER TABLE businesses
ADD CONSTRAINT businesses_stripe_customer_id_key
UNIQUE (stripe_customer_id);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer_id
ON businesses(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN businesses.stripe_customer_id IS 'Stripe Customer ID (cus_...) for saved payment methods and customer management';
