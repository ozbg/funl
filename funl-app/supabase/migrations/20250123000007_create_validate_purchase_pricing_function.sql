-- Migration: Create price validation function
-- Validates client-provided pricing against server-side pricing rules
-- CRITICAL SECURITY: Prevents price manipulation attacks

CREATE OR REPLACE FUNCTION validate_purchase_pricing(
  p_batch_id UUID,
  p_quantity INTEGER,
  p_size TEXT,
  p_unit_price NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_batch RECORD;
  v_expected_price NUMERIC;
  v_size_multiplier NUMERIC;
  v_tier JSONB;
BEGIN
  -- Get batch with pricing
  SELECT * INTO v_batch
  FROM qr_code_batches
  WHERE id = p_batch_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch not found: %', p_batch_id;
  END IF;

  -- Check if batch is available for purchase
  IF NOT COALESCE(v_batch.is_available_for_purchase, true) THEN
    RAISE EXCEPTION 'Batch not available for purchase';
  END IF;

  -- Check quantity limits
  IF p_quantity < COALESCE(v_batch.min_purchase_quantity, 1) THEN
    RAISE EXCEPTION 'Quantity below minimum: % (minimum: %)', p_quantity, v_batch.min_purchase_quantity;
  END IF;

  IF v_batch.max_purchase_quantity IS NOT NULL AND p_quantity > v_batch.max_purchase_quantity THEN
    RAISE EXCEPTION 'Quantity exceeds maximum: % (maximum: %)', p_quantity, v_batch.max_purchase_quantity;
  END IF;

  -- Find applicable pricing tier
  SELECT tier INTO v_tier
  FROM jsonb_array_elements(COALESCE(v_batch.pricing_tiers, '[
    {"min_quantity": 1, "max_quantity": 9, "unit_price": 5.00},
    {"min_quantity": 10, "max_quantity": 49, "unit_price": 4.50},
    {"min_quantity": 50, "max_quantity": 99, "unit_price": 4.00},
    {"min_quantity": 100, "max_quantity": null, "unit_price": 3.50}
  ]'::jsonb)) AS tier
  WHERE (tier->>'min_quantity')::INTEGER <= p_quantity
    AND (
      (tier->>'max_quantity') IS NULL
      OR (tier->>'max_quantity')::INTEGER >= p_quantity
    )
  ORDER BY (tier->>'min_quantity')::INTEGER DESC
  LIMIT 1;

  IF v_tier IS NULL THEN
    RAISE EXCEPTION 'No pricing tier found for quantity: %', p_quantity;
  END IF;

  -- Get size multiplier
  v_size_multiplier := COALESCE(
    (v_batch.size_pricing->>p_size)::NUMERIC,
    1.0
  );

  -- Calculate expected price
  v_expected_price := (v_tier->>'unit_price')::NUMERIC * v_size_multiplier;

  -- Allow small rounding differences (within 2 cents for floating point tolerance)
  RETURN ABS(p_unit_price - v_expected_price) < 0.02;
END;
$$;

COMMENT ON FUNCTION validate_purchase_pricing IS 'Validates that client-provided pricing matches server pricing rules. SECURITY: Prevents price manipulation.';

-- Grant execute to authenticated users (they need to validate during checkout)
GRANT EXECUTE ON FUNCTION validate_purchase_pricing TO authenticated;
