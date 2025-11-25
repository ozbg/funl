import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null

/**
 * POST /api/subscriptions/create-checkout
 * Create a Stripe Checkout session for paid plan
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
    const { planId, billingPeriod } = body

    if (!planId || !billingPeriod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Get business details
    const { data: business } = await supabase
      .from('businesses')
      .select('email, name')
      .eq('id', user.id)
      .single()

    // Create or get Stripe customer
    let stripeCustomerId = null
    const { data: existingCustomer } = await supabase
      .from('businesses')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (existingCustomer?.stripe_customer_id) {
      stripeCustomerId = existingCustomer.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: business?.email || user.email || '',
        name: business?.name || '',
        metadata: {
          business_id: user.id,
        },
      })
      stripeCustomerId = customer.id

      // Save stripe customer ID
      await supabase
        .from('businesses')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

    // Get the price based on billing period
    const amount = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_weekly
    const interval = billingPeriod === 'monthly' ? 'month' : 'week'

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: plan.name,
              description: plan.description || undefined,
            },
            unit_amount: amount,
            recurring: {
              interval: interval,
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          business_id: user.id,
          plan_id: planId,
          billing_period: billingPeriod,
        },
        trial_period_days: plan.trial_period_days > 0 ? plan.trial_period_days : undefined,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/select-plan`,
      metadata: {
        business_id: user.id,
        plan_id: planId,
        billing_period: billingPeriod,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
