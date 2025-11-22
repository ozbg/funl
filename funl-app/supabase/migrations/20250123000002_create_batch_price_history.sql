-- Migration: Create batch price history table
-- Tracks all pricing changes for audit trail and historical reporting

CREATE TABLE IF NOT EXISTS batch_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES qr_code_batches(id) ON DELETE CASCADE,
  pricing_tiers JSONB NOT NULL,
  size_pricing JSONB,
  base_price NUMERIC(10,2),
  changed_by UUID REFERENCES admins(id),
  changed_reason TEXT,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_price_history_batch ON batch_price_history(batch_id, effective_from DESC);
CREATE INDEX idx_price_history_effective ON batch_price_history(effective_from, effective_to);
CREATE INDEX idx_price_history_changed_by ON batch_price_history(changed_by);

-- Comments
COMMENT ON TABLE batch_price_history IS 'Audit log for all pricing changes to QR code batches';
COMMENT ON COLUMN batch_price_history.batch_id IS 'Reference to the batch that was changed';
COMMENT ON COLUMN batch_price_history.pricing_tiers IS 'Snapshot of pricing tiers at time of change';
COMMENT ON COLUMN batch_price_history.size_pricing IS 'Snapshot of size pricing multipliers at time of change';
COMMENT ON COLUMN batch_price_history.changed_by IS 'Admin who made the change';
COMMENT ON COLUMN batch_price_history.changed_reason IS 'Reason for the price change';
COMMENT ON COLUMN batch_price_history.effective_from IS 'When this pricing became effective';
COMMENT ON COLUMN batch_price_history.effective_to IS 'When this pricing stopped being effective (null = current)';

-- Enable RLS
ALTER TABLE batch_price_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all price history
CREATE POLICY "Admins can view price history"
ON batch_price_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
);

-- Policy: Only admins can insert price history
CREATE POLICY "Admins can insert price history"
ON batch_price_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
);
