import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/orders/[id]/fulfill
 * Fulfill an order and deduct from product inventory
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await context.params

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

  // Get reason from body
  const body = await request.json()
  const { reason, notes } = body

  if (!reason || reason.length < 10) {
    return NextResponse.json({
      error: 'Reason is required and must be at least 10 characters'
    }, { status: 400 })
  }

  const serviceClient = await createServiceClient()

  // Get order details
  const { data: order, error: orderError } = await serviceClient
    .from('orders')
    .select(`
      *,
      business:businesses(id, name, email),
      product:sellable_products(id, name, slug, tracks_inventory)
    `)
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.status === 'fulfilled') {
    return NextResponse.json({ error: 'Order already fulfilled' }, { status: 400 })
  }

  // Check if product tracks inventory
  if (!order.product.tracks_inventory) {
    // Just mark as fulfilled without inventory deduction
    const { data: updatedOrder, error: updateError } = await serviceClient
      .from('orders')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      order: updatedOrder,
      inventory_deducted: false,
      message: 'Order fulfilled (product does not track inventory)'
    })
  }

  // Get available inventory for this product
  const { data: inventory, error: inventoryError } = await serviceClient
    .from('product_batch_inventory')
    .select('*')
    .eq('product_id', order.product_id)
    .eq('is_active', true)
    .gt('quantity_remaining', 0)
    .order('created_at', { ascending: true }) // FIFO

  if (inventoryError) {
    return NextResponse.json({ error: inventoryError.message }, { status: 500 })
  }

  // Calculate total available
  const totalAvailable = inventory?.reduce((sum, inv) => sum + inv.quantity_remaining, 0) || 0

  if (totalAvailable < order.quantity) {
    return NextResponse.json({
      error: `Insufficient inventory: need ${order.quantity}, have ${totalAvailable}`,
      available: totalAvailable,
      needed: order.quantity
    }, { status: 400 })
  }

  // Deduct inventory using FIFO (First In, First Out)
  let remainingToDeduct = order.quantity
  const deductions: Array<{ inventory_id: string; batch_id: string; quantity: number }> = []

  for (const inv of inventory || []) {
    if (remainingToDeduct <= 0) break

    const deductFromThis = Math.min(inv.quantity_remaining, remainingToDeduct)

    // Update inventory
    await serviceClient
      .from('product_batch_inventory')
      .update({
        quantity_remaining: inv.quantity_remaining - deductFromThis
      })
      .eq('id', inv.id)

    deductions.push({
      inventory_id: inv.id,
      batch_id: inv.batch_id,
      quantity: deductFromThis
    })

    remainingToDeduct -= deductFromThis
  }

  // Mark order as fulfilled
  const { data: updatedOrder, error: updateError } = await serviceClient
    .from('orders')
    .update({
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      fulfillment_details: {
        deductions,
        fulfilled_by: user.id
      }
    })
    .eq('id', orderId)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'order_fulfilled',
      p_entity_type: 'product',
      p_entity_id: order.product_id,
      p_business_id: order.business_id,
      p_old_values: { order_status: order.status },
      p_new_values: {
        order_status: 'fulfilled',
        deductions,
        total_deducted: order.quantity
      },
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null
    })
  } catch (logError) {
    console.error('Failed to log admin action:', logError)
  }

  return NextResponse.json({
    order: updatedOrder,
    inventory_deducted: true,
    deductions,
    message: `Order fulfilled, ${order.quantity} units deducted from inventory`
  })
}
