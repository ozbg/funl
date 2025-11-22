-- Migration: Create code allocation function for paid orders
-- Allocates QR codes after successful payment (called from webhook)

CREATE OR REPLACE FUNCTION allocate_codes_for_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item JSONB;
  v_codes_allocated INTEGER := 0;
  v_code_ids UUID[];
  v_batch_id UUID;
  v_quantity INTEGER;
  v_unit_price NUMERIC;
  v_size TEXT;
  v_style JSONB;
BEGIN
  -- Get order
  SELECT * INTO v_order FROM purchase_orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Check if already allocated
  IF EXISTS (SELECT 1 FROM reserved_codes WHERE purchase_order_id = p_order_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Codes already allocated for this order');
  END IF;

  -- Check payment status
  IF v_order.payment_status != 'paid' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not paid');
  END IF;

  -- Allocate codes for each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
  LOOP
    v_batch_id := (v_item->>'batch_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_unit_price := (v_item->>'unit_price')::NUMERIC;
    v_size := v_item->>'size';
    v_style := v_item->'style';

    -- Select and update codes atomically
    WITH selected_codes AS (
      SELECT id
      FROM reserved_codes
      WHERE batch_id = v_batch_id
        AND status = 'available'
      LIMIT v_quantity
      FOR UPDATE SKIP LOCKED
    ),
    updated_codes AS (
      UPDATE reserved_codes
      SET
        status = 'reserved',
        business_id = v_order.business_id,
        purchase_order_id = p_order_id,
        purchase_price = v_unit_price,
        purchased_at = NOW(),
        updated_at = NOW()
      WHERE id IN (SELECT id FROM selected_codes)
      RETURNING id
    )
    SELECT array_agg(id) INTO v_code_ids FROM updated_codes;

    -- Check if we got enough codes
    IF array_length(v_code_ids, 1) IS NULL OR array_length(v_code_ids, 1) < v_quantity THEN
      RAISE EXCEPTION 'Insufficient codes available for batch %: requested %, got %',
        v_batch_id, v_quantity, COALESCE(array_length(v_code_ids, 1), 0);
    END IF;

    v_codes_allocated := v_codes_allocated + array_length(v_code_ids, 1);

    -- Insert into user inventory
    INSERT INTO user_sticker_inventory (business_id, reserved_code_id, acquired_via, purchase_order_id)
    SELECT v_order.business_id, unnest(v_code_ids), 'purchase', p_order_id;

    -- Log allocations
    INSERT INTO code_allocations (reserved_code_id, action, previous_status, new_status, business_id, purchase_order_id)
    SELECT unnest(v_code_ids), 'reserve', 'available', 'reserved', v_order.business_id, p_order_id;
  END LOOP;

  -- Update batch inventory counts
  UPDATE qr_code_batches b
  SET
    quantity_available = quantity_available - COALESCE(
      (SELECT SUM((item->>'quantity')::INTEGER)
       FROM jsonb_array_elements(v_order.items) AS item
       WHERE (item->>'batch_id')::UUID = b.id), 0
    ),
    quantity_reserved = quantity_reserved + COALESCE(
      (SELECT SUM((item->>'quantity')::INTEGER)
       FROM jsonb_array_elements(v_order.items) AS item
       WHERE (item->>'batch_id')::UUID = b.id), 0
    ),
    updated_at = NOW()
  WHERE id IN (
    SELECT DISTINCT (item->>'batch_id')::UUID
    FROM jsonb_array_elements(v_order.items) AS item
  );

  RETURN jsonb_build_object(
    'success', true,
    'codes_allocated', v_codes_allocated,
    'order_id', p_order_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION allocate_codes_for_order IS 'Allocates QR codes to an order after successful payment. Called from Stripe webhook.';

-- Grant execute to service role only (webhooks)
REVOKE EXECUTE ON FUNCTION allocate_codes_for_order FROM PUBLIC;
GRANT EXECUTE ON FUNCTION allocate_codes_for_order TO service_role;
