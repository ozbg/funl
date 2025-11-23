import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/products/[id]/adjust-inventory
 * Manually adjust product stock
 *
 * Request Body:
 * - adjustment_type: 'add' | 'remove' | 'set'
 * - quantity: number (amount to add/remove, or new total if 'set')
 * - reason: 'received' | 'damaged' | 'lost' | 'found' | 'correction' | 'other'
 * - notes?: string
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await context.params
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin privileges
  const { data: adminCheck } = await authClient
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { adjustment_type, quantity, reason, notes } = body

  // Validate inputs
  if (!adjustment_type || !['add', 'remove', 'set'].includes(adjustment_type)) {
    return NextResponse.json({ error: 'Invalid adjustment_type. Must be add, remove, or set' }, { status: 400 })
  }

  if (quantity === undefined || quantity === null || typeof quantity !== 'number') {
    return NextResponse.json({ error: 'Quantity is required and must be a number' }, { status: 400 })
  }

  if (quantity < 0) {
    return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 })
  }

  if (!reason) {
    return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()

  // Get current product
  const { data: product, error: productError } = await serviceClient
    .from('sellable_products')
    .select('id, name, current_stock, tracks_inventory')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  if (!product.tracks_inventory) {
    return NextResponse.json({ error: 'This product does not track inventory' }, { status: 400 })
  }

  const currentStock = product.current_stock || 0
  let newStock: number
  let quantityChange: number

  // Calculate new stock based on adjustment type
  switch (adjustment_type) {
    case 'add':
      newStock = currentStock + quantity
      quantityChange = quantity
      break
    case 'remove':
      newStock = currentStock - quantity
      quantityChange = -quantity
      if (newStock < 0) {
        return NextResponse.json({ error: 'Cannot reduce stock below 0' }, { status: 400 })
      }
      break
    case 'set':
      newStock = quantity
      quantityChange = quantity - currentStock
      break
    default:
      return NextResponse.json({ error: 'Invalid adjustment_type' }, { status: 400 })
  }

  // Update product stock
  const { error: updateError } = await serviceClient
    .from('sellable_products')
    .update({ current_stock: newStock })
    .eq('id', productId)

  if (updateError) {
    console.error('Error updating product stock:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log inventory adjustment
  const { data: adjustment, error: adjustmentError } = await serviceClient
    .from('inventory_adjustments')
    .insert({
      product_id: productId,
      adjustment_type: `manual_${adjustment_type}`,
      quantity_change: quantityChange,
      quantity_before: currentStock,
      quantity_after: newStock,
      admin_id: user.id,
      admin_email: user.email,
      reason,
      notes: notes || null,
    })
    .select()
    .single()

  if (adjustmentError) {
    console.error('Error creating inventory adjustment log:', adjustmentError)
    // Don't fail the request if logging fails
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'inventory_adjusted',
      p_entity_type: 'product',
      p_entity_id: productId,
      p_old_values: { current_stock: currentStock },
      p_new_values: { current_stock: newStock, adjustment_type, quantity },
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null,
    })
  } catch (error) {
    console.error('Error logging admin action:', error)
    // Don't fail the request if audit logging fails
  }

  return NextResponse.json({
    success: true,
    product: {
      id: product.id,
      name: product.name,
      previous_stock: currentStock,
      new_stock: newStock,
      quantity_change: quantityChange,
    },
    adjustment: adjustment || null,
  })
}
