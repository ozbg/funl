-- Create analytics views for admin dashboard

-- Subscription metrics view
CREATE OR REPLACE VIEW subscription_metrics AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  subscription_plan_id,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'trialing') as trial_count,
  COUNT(*) FILTER (WHERE status = 'canceled') as canceled_count,
  SUM(
    CASE
      WHEN billing_period = 'monthly' THEN (plan_snapshot->>'price_monthly')::numeric
      WHEN billing_period = 'weekly' THEN (plan_snapshot->>'price_weekly')::numeric * 4.33
      ELSE 0
    END
  ) FILTER (WHERE status = 'active') as mrr
FROM subscription_history
GROUP BY month, subscription_plan_id;

COMMENT ON VIEW subscription_metrics IS 'Monthly aggregated subscription metrics including active count, trial count, and MRR by plan';

-- Product sales metrics view
CREATE OR REPLACE VIEW product_sales_metrics AS
SELECT
  p.id as product_id,
  p.name as product_name,
  COUNT(DISTINCT po.id) as order_count,
  COALESCE(SUM((item->>'quantity')::integer), 0) as units_sold,
  COALESCE(SUM((item->>'total_price')::numeric), 0) as revenue
FROM sellable_products p
LEFT JOIN purchase_orders po ON po.payment_status = 'paid'
LEFT JOIN LATERAL jsonb_array_elements(po.items) as item ON item->>'product_id' = p.id::text
GROUP BY p.id, p.name;

COMMENT ON VIEW product_sales_metrics IS 'Aggregated sales metrics per product including order count, units sold, and total revenue';

-- Inventory alerts view
CREATE OR REPLACE VIEW inventory_alerts AS
SELECT
  id,
  name,
  current_stock,
  low_stock_threshold,
  CASE
    WHEN current_stock = 0 THEN 'out_of_stock'
    WHEN current_stock <= low_stock_threshold THEN 'low_stock'
    ELSE 'ok'
  END as alert_level,
  CASE
    WHEN current_stock = 0 THEN 'critical'
    WHEN current_stock <= low_stock_threshold THEN 'warning'
    ELSE 'info'
  END as severity
FROM sellable_products
WHERE tracks_inventory = true
  AND (current_stock = 0 OR current_stock <= low_stock_threshold)
  AND is_active = true
  AND deleted_at IS NULL
ORDER BY
  CASE
    WHEN current_stock = 0 THEN 1
    WHEN current_stock <= low_stock_threshold THEN 2
    ELSE 3
  END,
  current_stock ASC;

COMMENT ON VIEW inventory_alerts IS 'Products with low or out of stock inventory that need admin attention';

-- Grant access to authenticated users (admins will check via RLS)
GRANT SELECT ON subscription_metrics TO authenticated;
GRANT SELECT ON product_sales_metrics TO authenticated;
GRANT SELECT ON inventory_alerts TO authenticated;
