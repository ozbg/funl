-- Create function to get all admin dashboard metrics in one call
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'subscriptions', (
      SELECT jsonb_build_object(
        'total_active', COUNT(*) FILTER (WHERE status = 'active'),
        'total_trialing', COUNT(*) FILTER (WHERE status = 'trialing'),
        'total_canceled', COUNT(*) FILTER (WHERE status = 'canceled'),
        'mrr', COALESCE(SUM(
          CASE
            WHEN billing_period = 'monthly' AND status = 'active'
            THEN (plan_snapshot->>'price_monthly')::numeric
            WHEN billing_period = 'weekly' AND status = 'active'
            THEN (plan_snapshot->>'price_weekly')::numeric * 4.33
            ELSE 0
          END
        ), 0)
      )
      FROM subscription_history sh1
      WHERE created_at = (
        SELECT MAX(created_at)
        FROM subscription_history sh2
        WHERE sh2.business_id = sh1.business_id
      )
    ),
    'products', (
      SELECT jsonb_build_object(
        'total_products', COUNT(*),
        'out_of_stock', COUNT(*) FILTER (WHERE current_stock = 0 AND tracks_inventory = true),
        'low_stock', COUNT(*) FILTER (WHERE current_stock > 0 AND current_stock <= low_stock_threshold AND tracks_inventory = true),
        'total_inventory_value', COALESCE(SUM(
          current_stock * (
            SELECT MIN((tier->>'unit_price')::numeric)
            FROM jsonb_array_elements(pricing_tiers) as tier
          )
        ), 0)
      )
      FROM sellable_products
      WHERE is_active = true AND deleted_at IS NULL
    ),
    'orders', (
      SELECT jsonb_build_object(
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'paid', COUNT(*) FILTER (WHERE payment_status = 'paid'),
        'shipped', COUNT(*) FILTER (WHERE status = 'shipped'),
        'total_revenue_30d', COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND created_at > NOW() - INTERVAL '30 days'), 0)
      )
      FROM purchase_orders
    ),
    'funnels', (
      SELECT jsonb_build_object(
        'total_active', COUNT(*) FILTER (WHERE status = 'active'),
        'total_created_30d', COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')
      )
      FROM funnels
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_admin_dashboard_metrics IS 'Returns comprehensive dashboard metrics for subscriptions, products, orders, and funnels';

-- Grant execute to authenticated users (admin check will be done in API)
GRANT EXECUTE ON FUNCTION get_admin_dashboard_metrics TO authenticated;
