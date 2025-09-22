import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper to generate order numbers
function generateOrderNumber(): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${date}-${random}`
}

// POST /api/stickers/purchase - Purchase and allocate sticker to funnel
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stickerId, funnelId, shippingAddress } = await request.json()

    if (!stickerId || !funnelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Start transaction-like operation
    // First, check if sticker is available
    const { data: sticker, error: stickerError } = await supabase
      .from('reserved_codes')
      .select('*')
      .eq('id', stickerId)
      .eq('status', 'available')
      .single()

    if (stickerError || !sticker) {
      return NextResponse.json({ error: 'Sticker not available' }, { status: 409 })
    }

    // Create purchase order
    const orderNumber = generateOrderNumber()
    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        business_id: user.id,
        order_number: orderNumber,
        items: [{
          code_id: stickerId,
          quantity: 1,
          price: 4.99,
          size: 'medium'
        }],
        subtotal: 4.99,
        tax: 0,
        shipping: 0,
        total: 4.99,
        shipping_address: shippingAddress,
        status: 'paid',
        payment_status: 'paid',
        paid_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Update sticker status to assigned
    const { error: updateStickerError } = await supabase
      .from('reserved_codes')
      .update({
        status: 'assigned',
        business_id: user.id,
        funnel_id: funnelId,
        purchase_order_id: order.id,
        purchased_at: new Date().toISOString(),
        purchase_price: 4.99,
        assigned_at: new Date().toISOString()
      })
      .eq('id', stickerId)
      .eq('status', 'available') // Double-check status hasn't changed

    if (updateStickerError) {
      console.error('Sticker update error:', updateStickerError)
      // TODO: Should rollback order creation here
      return NextResponse.json({ error: 'Failed to allocate sticker' }, { status: 500 })
    }

    // Update funnel with reserved code
    const { error: funnelError } = await supabase
      .from('funnels')
      .update({
        reserved_code_id: stickerId,
        code_source: 'reserved',
        short_url: sticker.code
      })
      .eq('id', funnelId)
      .eq('business_id', user.id) // Ensure user owns the funnel

    if (funnelError) {
      console.error('Funnel update error:', funnelError)
      // TODO: Should rollback previous operations
      return NextResponse.json({ error: 'Failed to update funnel' }, { status: 500 })
    }

    // Create inventory record
    const { error: inventoryError } = await supabase
      .from('user_sticker_inventory')
      .insert({
        business_id: user.id,
        reserved_code_id: stickerId,
        acquired_via: 'purchase',
        purchase_order_id: order.id,
        is_used: true,
        used_for_funnel_id: funnelId,
        used_at: new Date().toISOString()
      })

    if (inventoryError) {
      console.error('Inventory error:', inventoryError)
      // Non-critical error, don't fail the purchase
    }

    // Log the allocation
    const { error: logError } = await supabase
      .from('code_allocations')
      .insert({
        reserved_code_id: stickerId,
        action: 'assign',
        new_status: 'assigned',
        previous_status: 'available',
        business_id: user.id,
        funnel_id: funnelId,
        reason: 'Direct purchase and assignment',
        metadata: { order_id: order.id }
      })

    if (logError) {
      console.error('Allocation log error:', logError)
      // Non-critical error
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        total: order.total
      },
      sticker: {
        id: sticker.id,
        code: sticker.code
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}