import { stripe, dollarsToCents, validateAmount } from '@/lib/stripe/stripe-client'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { order_id, amount } = await request.json()

    if (!order_id || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Validate minimum amount
    if (!validateAmount(amount)) {
      return NextResponse.json(
        { error: `Amount must be at least $0.50 AUD` },
        { status: 400 }
      )
    }

    // Verify order belongs to user and get details
    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .select('id, total, business_id, payment_intent_id, payment_status, order_number')
      .eq('id', order_id)
      .eq('business_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 })
    }

    // Verify amount matches order total (prevent manipulation)
    if (Math.abs(order.total - amount) > 0.01) {
      return NextResponse.json(
        { error: 'Amount mismatch. Please refresh and try again.' },
        { status: 400 }
      )
    }

    // Check if Payment Intent already exists
    if (order.payment_intent_id) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          order.payment_intent_id
        )

        if (existingIntent.status !== 'canceled' && existingIntent.status !== 'succeeded') {
          return NextResponse.json({
            clientSecret: existingIntent.client_secret,
            paymentIntentId: existingIntent.id,
          })
        }
      } catch (err) {
        console.error('Error retrieving existing Payment Intent:', err)
        // If retrieval fails, create a new one below
      }
    }

    // Get or create Stripe customer
    let customerId: string | null = null
    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_customer_id, email, name')
      .eq('id', user.id)
      .single()

    if (business?.stripe_customer_id) {
      customerId = business.stripe_customer_id
    } else if (business?.email) {
      const customer = await stripe.customers.create({
        email: business.email,
        name: business.name || undefined,
        metadata: { business_id: user.id },
      })
      customerId = customer.id

      // Save customer ID
      await supabase
        .from('businesses')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: dollarsToCents(amount),
      currency: 'aud',
      customer: customerId || undefined,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        business_id: user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Update order with payment_intent_id
    await supabase
      .from('purchase_orders')
      .update({
        payment_intent_id: paymentIntent.id,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })

  } catch (error) {
    console.error('Error creating Payment Intent:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
