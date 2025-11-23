-- Create plan_audit_log table for tracking subscription plan changes
CREATE TABLE IF NOT EXISTS plan_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'price_changed', 'features_changed'

  old_values JSONB,
  new_values JSONB,

  admin_id UUID REFERENCES businesses(id),
  admin_email TEXT,
  reason TEXT,
  notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_plan_audit_log_plan_id ON plan_audit_log(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_audit_log_created_at ON plan_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_audit_log_admin_id ON plan_audit_log(admin_id);

-- Enable RLS
ALTER TABLE plan_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins can view plan audit logs
CREATE POLICY "Admins can view plan audit logs"
  ON plan_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Only admins can insert plan audit logs (via service role)
CREATE POLICY "Service role can insert plan audit logs"
  ON plan_audit_log
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE plan_audit_log IS 'Audit trail for all subscription plan changes made by admins';
COMMENT ON COLUMN plan_audit_log.action IS 'Type of action: created, updated, deleted, price_changed, features_changed';
COMMENT ON COLUMN plan_audit_log.old_values IS 'JSONB snapshot of values before change';
COMMENT ON COLUMN plan_audit_log.new_values IS 'JSONB snapshot of values after change';
COMMENT ON COLUMN plan_audit_log.reason IS 'Required reason for making the change (minimum 10 characters)';
