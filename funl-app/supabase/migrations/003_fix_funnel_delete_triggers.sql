-- Fix batch inventory update trigger to handle DELETE operations properly
-- Applied: 2025-01-22 via MCP
-- Issue: Old funnel deletion failed with constraint violations

-- Fix the batch inventory update trigger to handle NULL batch_id gracefully
-- This can happen during DELETE operations or with old data

CREATE OR REPLACE FUNCTION public.update_batch_inventory_counts()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_batch_id uuid;
BEGIN
  -- Determine which batch to update
  IF TG_OP = 'DELETE' THEN
    v_batch_id := OLD.batch_id;
  ELSE
    v_batch_id := NEW.batch_id;
  END IF;

  -- Only update if we have a valid batch_id
  IF v_batch_id IS NOT NULL THEN
    -- Update batch counts based on current status
    UPDATE qr_code_batches
    SET
      quantity_available = (SELECT COUNT(*) FROM reserved_codes WHERE batch_id = v_batch_id AND status = 'available'),
      quantity_reserved = (SELECT COUNT(*) FROM reserved_codes WHERE batch_id = v_batch_id AND status = 'reserved'),
      quantity_assigned = (SELECT COUNT(*) FROM reserved_codes WHERE batch_id = v_batch_id AND status = 'assigned'),
      quantity_damaged = (SELECT COUNT(*) FROM reserved_codes WHERE batch_id = v_batch_id AND status IN ('damaged', 'lost')),
      updated_at = NOW()
    WHERE id = v_batch_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Improve the funnel delete trigger to handle edge cases and old data
-- This ensures codes are properly released even with legacy funnels

CREATE OR REPLACE FUNCTION public.release_codes_on_funnel_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_code RECORD;
  v_codes_released INTEGER := 0;
BEGIN
  -- For each code assigned to this funnel
  FOR v_code IN
    SELECT rc.id, rc.code, rc.business_id, rc.batch_id
    FROM reserved_codes rc
    WHERE rc.funnel_id = OLD.id
      AND rc.status = 'assigned'
  LOOP
    BEGIN
      -- Verify we have a valid business_id (should always be true for assigned codes)
      IF v_code.business_id IS NOT NULL THEN
        -- Update reserved_codes: return to owned_unassigned (customer keeps ownership)
        UPDATE reserved_codes
        SET
          status = 'owned_unassigned',
          funnel_id = NULL,
          assigned_at = NULL,
          updated_at = NOW()
        WHERE id = v_code.id;

        -- Update user inventory if it exists (may not exist for old funnels)
        UPDATE user_sticker_inventory
        SET
          is_used = FALSE,
          used_for_funnel_id = NULL,
          used_at = NULL,
          updated_at = NOW()
        WHERE reserved_code_id = v_code.id
          AND business_id = v_code.business_id;

        -- Log the release in audit trail (handle errors gracefully)
        BEGIN
          INSERT INTO code_allocations (
            reserved_code_id,
            action,
            previous_status,
            new_status,
            business_id,
            funnel_id,
            reason,
            is_successful,
            created_at
          ) VALUES (
            v_code.id,
            'release',
            'assigned',
            'owned_unassigned',
            v_code.business_id,
            NULL,
            'Automatic release due to funnel deletion',
            TRUE,
            NOW()
          );
        EXCEPTION
          WHEN OTHERS THEN
            -- Log but don't fail if audit insert fails
            RAISE WARNING 'Failed to log code allocation for code %: %', v_code.code, SQLERRM;
        END;

        v_codes_released := v_codes_released + 1;
      ELSE
        -- Edge case: orphaned code with no business (shouldn't happen, but handle it)
        RAISE WARNING 'Found assigned code % with NULL business_id during funnel % deletion', v_code.code, OLD.id;

        -- Return to available pool
        UPDATE reserved_codes
        SET
          status = 'available',
          funnel_id = NULL,
          business_id = NULL,
          assigned_at = NULL,
          updated_at = NOW()
        WHERE id = v_code.id;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but continue processing other codes
        RAISE WARNING 'Error releasing code %: %', v_code.code, SQLERRM;
    END;
  END LOOP;

  -- Log the number of codes released
  IF v_codes_released > 0 THEN
    RAISE NOTICE 'Released % QR code(s) from funnel % back to business inventory', v_codes_released, OLD.id;
  END IF;

  RETURN OLD;
END;
$function$;
