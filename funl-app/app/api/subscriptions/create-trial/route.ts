import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/subscriptions/create-trial
 * Create a trial subscription without payment
 */
export async function POST(request: NextRequest) {
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

    if (plan.trial_period_days === 0) {
      return NextResponse.json({ error: 'This plan does not offer a trial' }, { status: 400 })
    }

    // Check if user already has a subscription
    const { data: existingSub } = await supabase
      .from('subscription_history')
      .select('id')
      .eq('business_id', user.id)
      .in('status', ['active', 'trialing'])
      .single()

    if (existingSub) {
      return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 })
    }

    // Calculate trial end date
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + plan.trial_period_days)

    // Create trial subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscription_history')
      .insert({
        business_id: user.id,
        plan_id: planId,
        status: 'trialing',
        billing_period: billingPeriod,
        trial_end: trialEnd.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnd.toISOString(),
      })
      .select()
      .single()

    if (subError) {
      console.error('Error creating subscription:', subError)
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error('Error in create-trial:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
