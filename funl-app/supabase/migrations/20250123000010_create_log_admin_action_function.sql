-- Create centralized admin action logging function
-- Supports logging actions for subscriptions, products, and plans
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB,
  p_new_values JSONB,
  p_admin_id UUID,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_email TEXT;
  v_business_id UUID;
BEGIN
  -- Get admin email
  SELECT email INTO v_admin_email
  FROM businesses
  WHERE id = p_admin_id;

  -- Log based on entity type
  IF p_entity_type = 'subscription' THEN
    -- Get business_id for subscription
    SELECT business_id INTO v_business_id
    FROM subscription_history
    WHERE id = p_entity_id;

    INSERT INTO subscription_audit_log (
      subscription_history_id,
      business_id,
      action,
      old_values,
      new_values,
      admin_id,
      admin_email,
      reason,
      notes
    ) VALUES (
      p_entity_id,
      v_business_id,
      p_action,
      p_old_values,
      p_new_values,
      p_admin_id,
      v_admin_email,
      p_reason,
      p_notes
    ) RETURNING id INTO v_log_id;

  ELSIF p_entity_type = 'product' THEN
    INSERT INTO product_audit_log (
      product_id,
      action,
      old_values,
      new_values,
      admin_id,
      admin_email,
      reason,
      notes
    ) VALUES (
      p_entity_id,
      p_action,
      p_old_values,
      p_new_values,
      p_admin_id,
      v_admin_email,
      p_reason,
      p_notes
    ) RETURNING id INTO v_log_id;

  ELSIF p_entity_type = 'plan' THEN
    INSERT INTO plan_audit_log (
      plan_id,
      action,
      old_values,
      new_values,
      admin_id,
      admin_email,
      reason,
      notes
    ) VALUES (
      p_entity_id,
      p_action,
      p_old_values,
      p_new_values,
      p_admin_id,
      v_admin_email,
      p_reason,
      p_notes
    ) RETURNING id INTO v_log_id;

  ELSE
    RAISE EXCEPTION 'Invalid entity_type: %', p_entity_type;
  END IF;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_admin_action IS 'Centralized logging function for all admin actions on subscriptions, products, and plans';
