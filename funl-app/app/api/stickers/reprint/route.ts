import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code_id, size, style, quantity, unit_price, subtotal, tax, shipping, total } = body

    if (!code_id || !size || !style || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user owns this code
    const { data: code, error: codeError } = await supabase
      .from('reserved_codes')
      .select('id, code, business_id, status')
      .eq('id', code_id)
      .eq('business_id', user.id)
      .single()

    if (codeError || !code) {
      return NextResponse.json({ error: 'Code not found or not owned by user' }, { status: 404 })
    }

    if (code.status !== 'assigned') {
      return NextResponse.json({ error: 'Code must be assigned to order reprint' }, { status: 400 })
    }

    // Generate order number
    const orderNumber = 'ORD-' + new Date().toISOString().split('T')[0].replace(/-/g, '') +
                        '-' + Math.random().toString(36).substring(2, 8).toUpperCase()

    // Create reprint order
    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        business_id: user.id,
        order_number: orderNumber,
        order_type: 'reprint',
        items: [{
          reprint_code_ids: [code_id],
          code: code.code,
          size,
          style,
          quantity,
          unit_price
        }],
        subtotal,
        tax,
        shipping,
        total,
        status: 'pending',
        payment_status: 'pending',
        shipping_address: {} // Will be collected in checkout if needed
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create reprint order' }, { status: 500 })
    }

    // Log the reprint allocation
    await supabase
      .from('code_allocations')
      .insert({
        reserved_code_id: code_id,
        action: 'reprint',
        previous_status: code.status,
        new_status: code.status, // Status doesn't change for reprints
        business_id: user.id,
        purchase_order_id: order.id,
        reason: `Reprint order ${orderNumber}`,
        is_successful: true
      })

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number
    })

  } catch (error) {
    console.error('Error in reprint API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
