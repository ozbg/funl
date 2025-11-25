import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null

/**
 * POST /api/subscriptions/cancel
 * Cancel user's subscription
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { immediately = false } = body

    // Get current subscription
    const { data: subscription } = await supabase
      .from('subscription_history')
      .select('stripe_subscription_id')
      .eq('business_id', user.id)
      .in('status', ['active', 'trialing'])
      .single()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Cancel in Stripe
    let canceledSubscription
    if (immediately) {
      canceledSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
    } else {
      canceledSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
    }

    // Update in database
    await supabase
      .from('subscription_history')
      .update({
        cancel_at_period_end: !immediately,
        status: immediately ? 'canceled' : 'active',
      })
      .eq('business_id', user.id)
      .eq('stripe_subscription_id', subscription.stripe_subscription_id)

    return NextResponse.json({
      success: true,
      subscription: canceledSubscription,
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
