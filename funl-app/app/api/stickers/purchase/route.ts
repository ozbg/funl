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
    const { items, shipping_address, subtotal, tax, shipping, total } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    if (!shipping_address) {
      return NextResponse.json({ error: 'Shipping address required' }, { status: 400 })
    }

    // Transform items for the database function
    const dbItems = items.map((item: {
      batch_id: string
      quantity: number
      unit_price: number
      style: Record<string, unknown>
      size: string
    }) => ({
      batch_id: item.batch_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      style: item.style,
      size: item.size
    }))

    // Call the atomic purchase function
    const { data: result, error } = await supabase.rpc(
      'process_qr_purchase',
      {
        p_business_id: user.id,
        p_items: dbItems,
        p_subtotal: subtotal,
        p_tax: tax,
        p_shipping: shipping,
        p_total: total,
        p_shipping_address: shipping_address,
        p_order_type: 'purchase'
      }
    )

    if (error) {
      console.error('Purchase function error:', error)
      return NextResponse.json(
        { error: 'Database error during purchase' },
        { status: 500 }
      )
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Purchase failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      order_id: result.order_id,
      order_number: result.order_number,
      codes_allocated: result.codes_allocated
    })

  } catch (error) {
    console.error('Error in purchase API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}