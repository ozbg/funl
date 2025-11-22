-- Migration: Create Stripe product synchronization table
-- Tracks sync status between FunL batches and Stripe product catalog

CREATE TABLE IF NOT EXISTS stripe_product_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID UNIQUE NOT NULL REFERENCES qr_code_batches(id) ON DELETE CASCADE,
  stripe_product_id TEXT NOT NULL,
  stripe_price_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  sync_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stripe_sync_product ON stripe_product_sync(stripe_product_id);
CREATE INDEX idx_stripe_sync_batch ON stripe_product_sync(batch_id);
CREATE INDEX idx_stripe_sync_status ON stripe_product_sync(sync_status) WHERE sync_status != 'synced';

-- Comments
COMMENT ON TABLE stripe_product_sync IS 'Tracks synchronization between FunL batches and Stripe product catalog';
COMMENT ON COLUMN stripe_product_sync.batch_id IS 'Reference to qr_code_batches';
COMMENT ON COLUMN stripe_product_sync.stripe_product_id IS 'Stripe Product ID (prod_...)';
COMMENT ON COLUMN stripe_product_sync.stripe_price_ids IS 'Map of Stripe Price IDs: {"default": "price_xxx", "50mm": "price_yyy"}';
COMMENT ON COLUMN stripe_product_sync.sync_status IS 'Current sync status: synced, pending, or error';
COMMENT ON COLUMN stripe_product_sync.sync_error IS 'Error message if sync failed';
COMMENT ON COLUMN stripe_product_sync.metadata IS 'Additional Stripe metadata';

-- Enable RLS
ALTER TABLE stripe_product_sync ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all sync records
CREATE POLICY "Admins can view stripe sync"
ON stripe_product_sync FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
);

-- Policy: Admins can manage sync records
CREATE POLICY "Admins can manage stripe sync"
ON stripe_product_sync FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
);
