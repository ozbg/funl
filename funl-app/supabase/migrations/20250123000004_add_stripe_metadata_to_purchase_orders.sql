-- Migration: Add Stripe metadata to purchase_orders
-- Stores Stripe payment information for tracking and reconciliation

ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
ADD COLUMN IF NOT EXISTS payment_error TEXT,
ADD COLUMN IF NOT EXISTS refund_id TEXT,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Add indexes for faster Stripe lookups
CREATE INDEX IF NOT EXISTS idx_purchase_orders_payment_intent_id
ON purchase_orders(payment_intent_id)
WHERE payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_stripe_customer_id
ON purchase_orders(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_stripe_charge_id
ON purchase_orders(stripe_charge_id)
WHERE stripe_charge_id IS NOT NULL;

-- Add index for payment status queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_payment_status
ON purchase_orders(payment_status, created_at DESC);

-- Comments
COMMENT ON COLUMN purchase_orders.payment_intent_id IS 'Stripe Payment Intent ID (pi_...)';
COMMENT ON COLUMN purchase_orders.stripe_customer_id IS 'Stripe Customer ID (cus_...)';
COMMENT ON COLUMN purchase_orders.payment_method_id IS 'Stripe Payment Method ID (pm_...)';
COMMENT ON COLUMN purchase_orders.stripe_charge_id IS 'Stripe Charge ID (ch_...)';
COMMENT ON COLUMN purchase_orders.payment_error IS 'Error message if payment failed';
COMMENT ON COLUMN purchase_orders.refund_id IS 'Stripe Refund ID (re_...)';
COMMENT ON COLUMN purchase_orders.refund_reason IS 'Reason for refund';
COMMENT ON COLUMN purchase_orders.refunded_at IS 'Timestamp when refund was processed';
