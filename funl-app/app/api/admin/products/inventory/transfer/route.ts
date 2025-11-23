import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/products/inventory/transfer
 * Transfer inventory allocation from one product to another
 */
export async function POST(request: NextRequest) {
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
  const {
    from_product_id,
    to_product_id,
    batch_id,
    quantity,
    reason,
    notes
  } = body

  // Validate required fields
  if (!from_product_id || !to_product_id || !batch_id || !quantity || !reason || reason.length < 10) {
    return NextResponse.json({
      error: 'Missing required fields: from_product_id, to_product_id, batch_id, quantity, reason (min 10 chars)'
    }, { status: 400 })
  }

  if (quantity < 1) {
    return NextResponse.json({
      error: 'Quantity must be at least 1'
    }, { status: 400 })
  }

  if (from_product_id === to_product_id) {
    return NextResponse.json({
      error: 'Cannot transfer to the same product'
    }, { status: 400 })
  }

  const serviceClient = await createServiceClient()

  // Verify both products exist and track inventory
  const { data: products, error: productsError } = await serviceClient
    .from('sellable_products')
    .select('id, name, tracks_inventory')
    .in('id', [from_product_id, to_product_id])
    .is('deleted_at', null)

  if (productsError || !products || products.length !== 2) {
    return NextResponse.json({ error: 'One or both products not found' }, { status: 404 })
  }

  const fromProduct = products.find(p => p.id === from_product_id)
  const toProduct = products.find(p => p.id === to_product_id)

  if (!fromProduct?.tracks_inventory || !toProduct?.tracks_inventory) {
    return NextResponse.json({
      error: 'Both products must track inventory to transfer'
    }, { status: 400 })
  }

  // Get source inventory allocation
  const { data: sourceInventory, error: sourceError } = await serviceClient
    .from('product_batch_inventory')
    .select('*')
    .eq('product_id', from_product_id)
    .eq('batch_id', batch_id)
    .eq('is_active', true)
    .single()

  if (sourceError || !sourceInventory) {
    return NextResponse.json({
      error: 'Source inventory allocation not found'
    }, { status: 404 })
  }

  if (sourceInventory.quantity_remaining < quantity) {
    return NextResponse.json({
      error: `Insufficient quantity available: need ${quantity}, have ${sourceInventory.quantity_remaining}`,
      available: sourceInventory.quantity_remaining
    }, { status: 400 })
  }

  // Check if target product already has this batch linked
  const { data: existingTarget } = await serviceClient
    .from('product_batch_inventory')
    .select('*')
    .eq('product_id', to_product_id)
    .eq('batch_id', batch_id)
    .eq('is_active', true)
    .single()

  // Reduce from source
  const newSourceRemaining = sourceInventory.quantity_remaining - quantity
  const newSourceAllocated = sourceInventory.quantity_allocated - quantity

  await serviceClient
    .from('product_batch_inventory')
    .update({
      quantity_remaining: newSourceRemaining,
      quantity_allocated: newSourceAllocated,
      updated_by: user.id
    })
    .eq('id', sourceInventory.id)

  // If source is now empty, deactivate it
  if (newSourceRemaining === 0) {
    await serviceClient
      .from('product_batch_inventory')
      .update({ is_active: false })
      .eq('id', sourceInventory.id)
  }

  let targetInventory

  if (existingTarget) {
    // Add to existing allocation
    const { data: updated } = await serviceClient
      .from('product_batch_inventory')
      .update({
        quantity_remaining: existingTarget.quantity_remaining + quantity,
        quantity_allocated: existingTarget.quantity_allocated + quantity,
        updated_by: user.id
      })
      .eq('id', existingTarget.id)
      .select()
      .single()

    targetInventory = updated
  } else {
    // Create new allocation
    const { data: created } = await serviceClient
      .from('product_batch_inventory')
      .insert({
        product_id: to_product_id,
        batch_id,
        quantity_allocated: quantity,
        quantity_remaining: quantity,
        is_active: true,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single()

    targetInventory = created
  }

  // Log admin action for source product
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'stock_adjusted',
      p_entity_type: 'product',
      p_entity_id: from_product_id,
      p_business_id: null,
      p_old_values: {
        quantity_remaining: sourceInventory.quantity_remaining,
        quantity_allocated: sourceInventory.quantity_allocated
      },
      p_new_values: {
        quantity_remaining: newSourceRemaining,
        quantity_allocated: newSourceAllocated,
        transfer_to: to_product_id,
        transfer_quantity: quantity
      },
      p_admin_id: user.id,
      p_reason: `Transfer: ${reason}`,
      p_notes: notes || null
    })
  } catch (logError) {
    console.error('Failed to log admin action:', logError)
  }

  return NextResponse.json({
    success: true,
    message: `Transferred ${quantity} units from ${fromProduct.name} to ${toProduct.name}`,
    source: {
      product_id: from_product_id,
      new_remaining: newSourceRemaining,
      new_allocated: newSourceAllocated
    },
    target: {
      product_id: to_product_id,
      inventory: targetInventory
    }
  })
}
