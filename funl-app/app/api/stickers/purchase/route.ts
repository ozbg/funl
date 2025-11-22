import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, shipping_address, subtotal, tax, shipping, total } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    if (!shipping_address) {
      return NextResponse.json({ error: 'Shipping address required' }, { status: 400 })
    }

    // Validate pricing for each item - SECURITY CRITICAL
    for (const item of items) {
      const { data: isValid, error: validationError } = await supabase
        .rpc('validate_purchase_pricing', {
          p_batch_id: item.batch_id,
          p_quantity: item.quantity,
          p_size: item.size,
          p_unit_price: item.unit_price
        })

      if (validationError) {
        console.error('Price validation error:', validationError)
        return NextResponse.json(
          { error: 'Price validation failed. Please refresh and try again.' },
          { status: 400 }
        )
      }

      if (!isValid) {
        return NextResponse.json(
          { error: `Invalid pricing for item. Please refresh and try again.` },
          { status: 400 }
        )
      }
    }

    // Check inventory availability before creating order
    for (const item of items) {
      const { data: batch } = await supabase
        .from('qr_code_batches')
        .select('quantity_available')
        .eq('id', item.batch_id)
        .single()

      if (!batch || batch.quantity_available < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient inventory for one or more items. Please refresh and try again.` },
          { status: 400 }
        )
      }
    }

    // Generate order number
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomStr = nanoid(8).toUpperCase()
    const order_number = `ORD-${dateStr}-${randomStr}`

    // Create order WITHOUT allocating codes (codes will be allocated after payment succeeds)
    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        business_id: user.id,
        order_number,
        order_type: 'purchase',
        items,
        subtotal,
        tax,
        shipping,
        total,
        shipping_address,
        status: 'pending',
        payment_status: 'pending',
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      requires_payment: true,
    })

  } catch (error) {
    console.error('Error in purchase API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}