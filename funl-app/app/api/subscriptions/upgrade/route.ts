import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/subscriptions/upgrade
 * Upgrade/downgrade subscription plan
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan_id, billing_period } = await request.json()

  if (!plan_id || !billing_period) {
    return NextResponse.json(
      { error: 'Missing required fields: plan_id, billing_period' },
      { status: 400 }
    )
  }

  // Get new plan details
  const { data: newPlan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', plan_id)
    .single()

  if (planError || !newPlan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Get current subscription
  const { data: currentSub } = await supabase
    .from('subscription_history')
    .select('*, subscription_plan:subscription_plans(*)')
    .eq('business_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const eventType = !currentSub
    ? 'created'
    : currentSub.subscription_plan_id === plan_id
    ? 'renewed'
    : 'upgraded' // We'll determine if it's actually a downgrade later

  // Create new subscription history entry
  const { data: newSubscription, error: subError } = await supabase
    .from('subscription_history')
    .insert({
      business_id: user.id,
      subscription_plan_id: plan_id,
      status: 'active',
      billing_period,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + (billing_period === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
      plan_snapshot: {
        plan_id: newPlan.id,
        name: newPlan.name,
        funnel_limit: newPlan.funnel_limit,
        price_monthly: newPlan.price_monthly,
        price_weekly: newPlan.price_weekly,
        features: newPlan.features,
      },
      event_type: eventType,
      previous_plan_id: currentSub?.subscription_plan_id || null,
    })
    .select()
    .single()

  if (subError) {
    console.error('Error creating subscription:', subError)
    return NextResponse.json({ error: subError.message }, { status: 500 })
  }

  // Update business current_subscription_id
  await supabase
    .from('businesses')
    .update({ current_subscription_id: newSubscription.id })
    .eq('id', user.id)

  return NextResponse.json({
    subscription: newSubscription,
    message: `Successfully ${eventType} to ${newPlan.name} plan`,
  })
}
