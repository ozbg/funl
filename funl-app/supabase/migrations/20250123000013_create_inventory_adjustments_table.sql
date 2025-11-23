-- Create inventory_adjustments table for tracking all stock changes
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  product_id UUID NOT NULL REFERENCES sellable_products(id) ON DELETE CASCADE,

  adjustment_type TEXT NOT NULL, -- 'manual_add', 'manual_remove', 'manual_set', 'batch_linked', 'batch_unlinked', 'order_fulfilled', 'transfer_in', 'transfer_out'

  quantity_change INTEGER NOT NULL, -- Positive for increases, negative for decreases
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,

  -- Admin who made the adjustment (for manual adjustments)
  admin_id UUID REFERENCES businesses(id),
  admin_email TEXT,

  -- Reason and notes (required for manual adjustments)
  reason TEXT,
  notes TEXT,

  -- Related entities (if applicable)
  batch_id UUID REFERENCES qr_code_batches(id),
  order_id UUID REFERENCES purchase_orders(id),
  transfer_from_product_id UUID REFERENCES sellable_products(id),
  transfer_to_product_id UUID REFERENCES sellable_products(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_id ON inventory_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created_at ON inventory_adjustments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_admin_id ON inventory_adjustments(admin_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_batch_id ON inventory_adjustments(batch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_order_id ON inventory_adjustments(order_id);

-- Enable RLS
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view inventory adjustments"
  ON inventory_adjustments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Service role can insert inventory adjustments"
  ON inventory_adjustments
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE inventory_adjustments IS 'Complete audit trail of all inventory changes for products';
COMMENT ON COLUMN inventory_adjustments.adjustment_type IS 'Type of adjustment: manual_add, manual_remove, manual_set, batch_linked, batch_unlinked, order_fulfilled, transfer_in, transfer_out';
COMMENT ON COLUMN inventory_adjustments.quantity_change IS 'Positive for stock increases, negative for decreases';
