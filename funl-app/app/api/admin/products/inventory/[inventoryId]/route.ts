import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/admin/products/inventory/[inventoryId]
 * Unlink a batch from a product (soft delete by setting is_active = false)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ inventoryId: string }> }
) {
  const { inventoryId } = await context.params

  // Verify admin authentication
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminCheck } = await authClient
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse request body for reason
  const body = await request.json()
  const { reason, notes } = body

  if (!reason || reason.length < 10) {
    return NextResponse.json({
      error: 'Reason is required and must be at least 10 characters'
    }, { status: 400 })
  }

  // Get existing inventory link
  const serviceClient = await createServiceClient()
  const { data: oldInventory, error: fetchError } = await serviceClient
    .from('product_batch_inventory')
    .select(`
      *,
      product:sellable_products(id, name),
      batch:qr_code_batches(id, batch_name)
    `)
    .eq('id', inventoryId)
    .single()

  if (fetchError || !oldInventory) {
    return NextResponse.json({ error: 'Inventory link not found' }, { status: 404 })
  }

  if (!oldInventory.is_active) {
    return NextResponse.json({ error: 'Inventory link is already inactive' }, { status: 400 })
  }

  // Check if any items have been sold from this inventory
  const quantityUsed = oldInventory.quantity_allocated - oldInventory.quantity_remaining
  if (quantityUsed > 0) {
    return NextResponse.json({
      error: `Cannot unlink: ${quantityUsed} items from this batch have already been sold`,
      quantity_used: quantityUsed
    }, { status: 400 })
  }

  // Deactivate inventory link
  const { data: inventory, error: updateError } = await serviceClient
    .from('product_batch_inventory')
    .update({
      is_active: false,
      updated_by: user.id
    })
    .eq('id', inventoryId)
    .select(`
      *,
      product:sellable_products(id, name),
      batch:qr_code_batches(id, batch_name)
    `)
    .single()

  if (updateError) {
    console.error('Error unlinking batch:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'batch_unlinked',
      p_entity_type: 'product',
      p_entity_id: oldInventory.product_id,
      p_business_id: null,
      p_old_values: oldInventory,
      p_new_values: inventory,
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null
    })
  } catch (logError) {
    console.error('Failed to log admin action:', logError)
  }

  return NextResponse.json({ success: true, inventory })
}

/**
 * PATCH /api/admin/products/inventory/[inventoryId]
 * Adjust inventory quantity
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ inventoryId: string }> }
) {
  const { inventoryId } = await context.params

  // Verify admin authentication
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminCheck } = await authClient
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse request body
  const body = await request.json()
  const { adjustment_type, quantity, reason, notes } = body

  if (!adjustment_type || !quantity || !reason || reason.length < 10) {
    return NextResponse.json({
      error: 'Missing required fields: adjustment_type, quantity, reason (min 10 chars)'
    }, { status: 400 })
  }

  if (!['add', 'remove', 'set'].includes(adjustment_type)) {
    return NextResponse.json({
      error: 'adjustment_type must be: add, remove, or set'
    }, { status: 400 })
  }

  // Get existing inventory
  const serviceClient = await createServiceClient()
  const { data: oldInventory, error: fetchError } = await serviceClient
    .from('product_batch_inventory')
    .select(`
      *,
      product:sellable_products(id, name),
      batch:qr_code_batches(id, batch_name)
    `)
    .eq('id', inventoryId)
    .eq('is_active', true)
    .single()

  if (fetchError || !oldInventory) {
    return NextResponse.json({ error: 'Inventory link not found' }, { status: 404 })
  }

  // Calculate new quantity
  let newQuantityRemaining = oldInventory.quantity_remaining

  switch (adjustment_type) {
    case 'add':
      newQuantityRemaining += quantity
      break
    case 'remove':
      newQuantityRemaining -= quantity
      if (newQuantityRemaining < 0) {
        return NextResponse.json({
          error: 'Cannot remove more quantity than available'
        }, { status: 400 })
      }
      break
    case 'set':
      newQuantityRemaining = quantity
      if (newQuantityRemaining < 0) {
        return NextResponse.json({
          error: 'Quantity cannot be negative'
        }, { status: 400 })
      }
      break
  }

  // Update inventory
  const { data: inventory, error: updateError } = await serviceClient
    .from('product_batch_inventory')
    .update({
      quantity_remaining: newQuantityRemaining,
      updated_by: user.id
    })
    .eq('id', inventoryId)
    .select(`
      *,
      product:sellable_products(id, name),
      batch:qr_code_batches(id, batch_name)
    `)
    .single()

  if (updateError) {
    console.error('Error adjusting inventory:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'stock_adjusted',
      p_entity_type: 'product',
      p_entity_id: oldInventory.product_id,
      p_business_id: null,
      p_old_values: {
        quantity_remaining: oldInventory.quantity_remaining,
        adjustment_type,
        quantity
      },
      p_new_values: {
        quantity_remaining: newQuantityRemaining
      },
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null
    })
  } catch (logError) {
    console.error('Failed to log admin action:', logError)
  }

  return NextResponse.json({ inventory })
}
