import { requireStripe } from '@/lib/stripe/stripe-client'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Create Supabase client with service role (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('No Stripe signature found')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    const stripe = requireStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()

  // Idempotency check
  const { data: existingEvent } = await supabase
    .from('stripe_events')
    .select('id, processed')
    .eq('stripe_event_id', event.id)
    .single()

  if (existingEvent?.processed) {
    console.log(`Event ${event.id} already processed`)
    return NextResponse.json({ received: true })
  }

  // Log event
  const eventObject = event.data.object as { id?: string; object?: string }
  await supabase.from('stripe_events').upsert({
    stripe_event_id: event.id,
    event_type: event.type,
    api_version: event.api_version || null,
    resource_id: eventObject.id || null,
    resource_type: eventObject.object || null,
    payload: event.data as unknown as Record<string, unknown>,
    processed: false,
  }, {
    onConflict: 'stripe_event_id'
  })

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark as processed
    await supabase
      .from('stripe_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('stripe_event_id', event.id)

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error(`Error processing webhook ${event.id}:`, error)

    await supabase
      .from('stripe_events')
      .update({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('stripe_event_id', event.id)

    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const supabase = getServiceClient()
  const orderId = paymentIntent.metadata.order_id

  if (!orderId) {
    throw new Error('No order_id in Payment Intent metadata')
  }

  console.log(`Payment succeeded for order ${orderId}`)

  // Get order
  const { data: order } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (!order) {
    throw new Error(`Order ${orderId} not found`)
  }

  // Allocate codes using the atomic function
  console.log(`Allocating codes for order ${orderId}`)
  const { data: allocationResult, error: allocationError } = await supabase.rpc(
    'allocate_codes_for_order',
    { p_order_id: orderId }
  )

  if (allocationError) {
    console.error('Code allocation error:', allocationError)
    throw new Error(`Code allocation failed: ${allocationError.message}`)
  }

  if (!allocationResult?.success) {
    throw new Error(`Code allocation failed: ${allocationResult?.error || 'Unknown error'}`)
  }

  console.log(`Successfully allocated ${allocationResult.codes_allocated} codes`)

  // Update order status
  await supabase
    .from('purchase_orders')
    .update({
      payment_status: 'paid',
      status: 'processing',
      paid_at: new Date().toISOString(),
      payment_method_id: paymentIntent.payment_method as string,
      stripe_charge_id: paymentIntent.latest_charge as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  console.log(`Payment succeeded and codes allocated for order ${orderId}`)
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const supabase = getServiceClient()
  const orderId = paymentIntent.metadata.order_id

  if (!orderId) return

  console.log(`Payment failed for order ${orderId}`)

  await supabase
    .from('purchase_orders')
    .update({
      payment_status: 'failed',
      payment_error: paymentIntent.last_payment_error?.message || 'Payment failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
}

async function handleRefund(charge: Stripe.Charge) {
  const supabase = getServiceClient()

  // Find order by charge ID
  const { data: order } = await supabase
    .from('purchase_orders')
    .select('id')
    .eq('stripe_charge_id', charge.id)
    .single()

  if (!order) {
    console.log(`No order found for charge ${charge.id}`)
    return
  }

  console.log(`Refund processed for order ${order.id}`)

  await supabase
    .from('purchase_orders')
    .update({
      payment_status: 'refunded',
      refund_id: charge.refunds?.data[0]?.id || null,
      refund_reason: charge.refunds?.data[0]?.reason || 'refund',
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
}

// Disable body parsing (required for Stripe webhooks)
export const runtime = 'nodejs'
