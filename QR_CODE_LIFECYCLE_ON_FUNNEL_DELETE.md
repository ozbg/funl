# QR Code Lifecycle Management on Funnel Deletion

## Implementation Status: ✅ CORE FUNCTIONALITY COMPLETE

**Date Completed:** October 17, 2025
**Migrations Applied:** 5
**Status:** Production Ready - Core lifecycle management implemented and tested

### Quick Summary
When users delete funnels with assigned QR codes, the codes are now automatically:
- Released back to customer inventory with status `owned_unassigned`
- Preserved with ownership intact (`business_id` maintained)
- Available for reassignment to other funnels
- Fully logged in audit trail

### What's Working
- ✅ Automatic code release on funnel deletion
- ✅ Customer ownership preservation
- ✅ Inventory tracking (`user_sticker_inventory`)
- ✅ Complete audit trail
- ✅ API returns release information

### What's Next
- UI for viewing customer inventory (`/dashboard/my-qr-codes`)
- Code reassignment interface
- Reprint ordering system

---

## Problem Statement
When a user deletes a funnel that has QR codes assigned to it, those codes represent a purchased asset. We need to ensure:
1. The customer doesn't lose their purchased QR codes
2. Codes can be reassigned to new funnels
3. Physical stickers can be reprinted if needed
4. Audit trail is preserved

## Current Database State

### Tables Involved
1. **`reserved_codes`** - Individual QR codes with status tracking
   - `status`: 'available', 'reserved', 'assigned', 'damaged', 'expired', 'lost'
   - `funnel_id`: References the assigned funnel (nullable, ON DELETE SET NULL ✅)
   - `business_id`: References the owning business (nullable, ON DELETE SET NULL ✅)
   - `purchase_order_id`: Link to purchase transaction

2. **`user_sticker_inventory`** - Customer's purchased QR code inventory
   - `business_id`: Owner of the sticker
   - `reserved_code_id`: Link to the actual code
   - `is_used`: Boolean tracking if assigned to a funnel
   - `used_for_funnel_id`: Which funnel it's assigned to (ON DELETE NO ACTION ⚠️)
   - `acquired_via`: How they got it ('purchase', 'allocation', etc.)

3. **`code_allocations`** - Audit log of all code operations
   - `funnel_id`: Which funnel (now ON DELETE SET NULL ✅)
   - `action`: 'assign', 'release', 'status_change'
   - Preserves complete history

4. **`code_print_runs`** - Physical print jobs
   - `funnel_id`: Which funnel it was printed for (ON DELETE NO ACTION ⚠️)
   - Contains the actual SVG and print specifications

## The Funnel Deletion Problem

### Current Behavior (BROKEN)
When a funnel is deleted:
- ✅ `reserved_codes.funnel_id` → NULL (allows deletion)
- ✅ `code_allocations.funnel_id` → NULL (preserves audit trail)
- ❌ `user_sticker_inventory.used_for_funnel_id` → BLOCKS deletion (NO ACTION constraint)
- ❌ `code_print_runs.funnel_id` → BLOCKS deletion (NO ACTION constraint)

### What Should Happen
When a user deletes a funnel with assigned QR codes:

1. **Release the codes back to inventory**
   - Change `reserved_codes.status` from 'assigned' → 'available'
   - Clear `reserved_codes.funnel_id` → NULL
   - BUT keep `reserved_codes.business_id` (they still own it!)

2. **Update customer inventory**
   - Set `user_sticker_inventory.is_used` → FALSE
   - Clear `user_sticker_inventory.used_for_funnel_id` → NULL
   - This makes the code available for reassignment

3. **Preserve print history**
   - Keep `code_print_runs` records intact for reprint capability
   - Set `code_print_runs.funnel_id` → NULL
   - Customer can reorder exact same print

4. **Log the release**
   - Create audit entry in `code_allocations`:
     - `action`: 'release'
     - `reason`: 'Funnel deleted by user'
     - `funnel_id`: NULL (after deletion)

## Proposed Solution

### Phase 1: Fix Database Constraints (Immediate)

```sql
-- Fix user_sticker_inventory constraint
ALTER TABLE user_sticker_inventory
  DROP CONSTRAINT IF EXISTS user_sticker_inventory_used_for_funnel_id_fkey;

ALTER TABLE user_sticker_inventory
  ADD CONSTRAINT user_sticker_inventory_used_for_funnel_id_fkey
  FOREIGN KEY (used_for_funnel_id)
  REFERENCES funnels(id)
  ON DELETE SET NULL;

-- Fix code_print_runs constraint
ALTER TABLE code_print_runs
  DROP CONSTRAINT IF EXISTS code_print_runs_funnel_id_fkey;

ALTER TABLE code_print_runs
  ADD CONSTRAINT code_print_runs_funnel_id_fkey
  FOREIGN KEY (funnel_id)
  REFERENCES funnels(id)
  ON DELETE SET NULL;
```

### Phase 2: Automated Code Release (Database Trigger)

Create a trigger that runs BEFORE funnel deletion to properly release codes:

```sql
CREATE OR REPLACE FUNCTION release_codes_on_funnel_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_code RECORD;
BEGIN
  -- For each code assigned to this funnel
  FOR v_code IN
    SELECT rc.id, rc.code, rc.business_id
    FROM reserved_codes rc
    WHERE rc.funnel_id = OLD.id
      AND rc.status = 'assigned'
  LOOP
    -- Update reserved_codes: return to available, keep ownership
    UPDATE reserved_codes
    SET
      status = 'available',
      funnel_id = NULL,
      assigned_at = NULL
    WHERE id = v_code.id;

    -- Update user inventory: mark as unused but still owned
    UPDATE user_sticker_inventory
    SET
      is_used = FALSE,
      used_for_funnel_id = NULL,
      used_at = NULL,
      updated_at = NOW()
    WHERE reserved_code_id = v_code.id
      AND business_id = v_code.business_id;

    -- Log the release in audit trail
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
      'available',
      v_code.business_id,
      NULL, -- Funnel will be deleted
      'Automatic release due to funnel deletion',
      TRUE,
      NOW()
    );
  END LOOP;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_release_codes_before_funnel_delete
  BEFORE DELETE ON funnels
  FOR EACH ROW
  EXECUTE FUNCTION release_codes_on_funnel_delete();
```

### Phase 3: UI/UX Implementation

#### A. Pre-Delete Warning Dialog
When user clicks delete funnel, show:

```
⚠️ Delete Funnel: "3 - Testimonial"?

This funnel has 2 QR codes assigned:
• Code: XXXX-XXXX (purchased 22 Sep 2025)
• Code: YYYY-YYYY (purchased 22 Sep 2025)

What happens next:
✅ These codes will be returned to your inventory
✅ You can reassign them to other funnels
✅ You can reprint them with the same or different designs
✅ Your purchase history is preserved

[Cancel] [Delete Funnel & Release Codes]
```

#### B. "My QR Codes" Inventory Page
Create a new dashboard section: `/dashboard/my-qr-codes`

```
My QR Codes Inventory
━━━━━━━━━━━━━━━━━━━━━

Available for Assignment (2)
┌─────────────────────────────────────────┐
│ Code: ABCD-EFGH                         │
│ Purchased: 22 Sep 2025                  │
│ Last used for: "3 - Testimonial" (deleted) │
│                                         │
│ [Assign to Funnel ▾] [Reprint Options] │
└─────────────────────────────────────────┘

Currently Assigned (3)
┌─────────────────────────────────────────┐
│ Code: IJKL-MNOP                         │
│ Assigned to: "Open House - 123 Main St" │
│ Assigned: 15 Oct 2025                   │
│                                         │
│ [View Funnel] [Unassign] [Reprint]     │
└─────────────────────────────────────────┘
```

#### C. Reprint Functionality
Users can reprint codes from their inventory:

```
Reprint QR Code: ABCD-EFGH
━━━━━━━━━━━━━━━━━━━━━━━━

Previous Prints:
• 22 Sep 2025 - Square sticker, Modern Blue style
• 15 Oct 2025 - Circle sticker, Classic Black style

New Print Order:
[Select Size ▾] [Select Style ▾] [Quantity: 10]
[Preview] [Add to Cart]
```

### Phase 4: Business Logic in API

Update `/api/funnels/[id]/route.ts` DELETE handler:

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if funnel has assigned codes
    const { data: assignedCodes, error: codesError } = await supabase
      .from('reserved_codes')
      .select('code, purchased_at')
      .eq('funnel_id', id)
      .eq('business_id', user.id)
      .eq('status', 'assigned')

    if (codesError) {
      console.error('Error checking codes:', codesError)
    }

    // Delete funnel (trigger will handle code release automatically)
    const { error } = await supabase
      .from('funnels')
      .delete()
      .eq('id', id)
      .eq('business_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        error: 'Failed to delete funnel',
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      codes_released: assignedCodes?.length || 0,
      message: assignedCodes?.length > 0
        ? `Funnel deleted. ${assignedCodes.length} QR code(s) returned to your inventory.`
        : 'Funnel deleted.'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## User Workflows

### Scenario 1: Delete funnel, reassign codes
1. User deletes "Open House A" funnel
2. System releases 5 codes back to inventory
3. User creates new "Open House B" funnel
4. User goes to "My QR Codes" → sees 5 available codes
5. User assigns existing codes to new funnel
6. **No new purchase needed!**

### Scenario 2: Delete funnel, reprint with new design
1. User deletes old testimonial funnel
2. Codes return to inventory
3. User orders reprint with updated branding
4. Same code, new physical sticker
5. Assigns reprinted codes to new funnel

### Scenario 3: Batch reassignment
1. User has 50 codes across 10 deleted funnels
2. All codes sitting in inventory
3. User creates new campaign
4. Bulk assigns all 50 codes at once
5. Efficient reuse of purchased assets

## Security Considerations

1. **Ownership Preservation**
   - `business_id` NEVER cleared on funnel delete
   - Only the owning business can see/reassign their codes
   - RLS policies prevent cross-business access

2. **Audit Trail**
   - Complete history in `code_allocations`
   - Can track: who assigned, when, to which funnel, why released
   - Even if funnel deleted, audit shows original assignment

3. **Prevent Loss**
   - Codes can only be in one of: available, assigned, damaged, lost
   - 'assigned' status requires `funnel_id` AND `business_id`
   - 'available' status requires `business_id` (owned but unassigned)
   - Status transitions logged atomically

## Implementation Checklist

- [x] **Phase 1: Fix foreign key constraints** ✅ COMPLETED
  - [x] `code_allocations.funnel_id` → SET NULL (Migration: `fix_code_allocations_funnel_cascade`)
  - [x] `user_sticker_inventory.used_for_funnel_id` → SET NULL (Migration: `fix_user_sticker_inventory_funnel_cascade`)
  - [x] `code_print_runs.funnel_id` → SET NULL (Migration: `fix_code_print_runs_funnel_cascade`)

- [x] **Phase 2: Database trigger for automatic code release** ✅ COMPLETED
  - [x] Add `owned_unassigned` status to support customer inventory (Migration: `add_owned_unassigned_status_for_inventory`)
  - [x] Update `check_business_assignment` constraint to allow owned-but-unassigned codes
  - [x] Create `release_codes_on_funnel_delete()` trigger function (Migration: `create_automatic_code_release_on_funnel_delete`)
  - [x] Update `validate_code_status_transition()` to allow `assigned` → `owned_unassigned` (Migration: `update_status_transition_validator_for_inventory`)
  - [x] Test with deletion - Successfully tested with test funnel

- [ ] **Phase 3: UI Components** (Future work)
  - [ ] Enhanced delete confirmation dialog showing QR codes to be released
  - [ ] "My QR Codes" inventory page at `/dashboard/my-qr-codes`
  - [ ] Code reassignment interface
  - [ ] Reprint order flow

- [x] **Phase 4: API Updates** ✅ PARTIALLY COMPLETED
  - [x] Update DELETE handler to return release info ([route.ts:117-172](funl-app/app/api/funnels/[id]/route.ts#L117-L172))
  - [ ] Create endpoint for viewing inventory
  - [ ] Create endpoint for code reassignment
  - [ ] Create endpoint for reprint orders

- [x] **Phase 5: Testing** ✅ CORE FUNCTIONALITY TESTED
  - [x] Test funnel deletion with assigned codes - ✅ Successful
  - [x] Verify code status changes to `owned_unassigned` - ✅ Verified
  - [x] Verify `business_id` preserved - ✅ Confirmed
  - [x] Verify inventory updated (`is_used` = false) - ✅ Confirmed
  - [x] Test audit trail integrity - ✅ Complete history logged
  - [ ] Test code reassignment flow (requires UI)
  - [ ] Test reprint functionality (requires UI)
  - [ ] Test RLS policies (requires UI)

## Benefits

1. **Customer Value Protection** - Never lose purchased QR codes
2. **Flexibility** - Reassign, reprint, reuse as needed
3. **Cost Savings** - No repurchase needed for campaign changes
4. **Audit Compliance** - Complete lifecycle tracking
5. **Business Insights** - See code utilization across campaigns
