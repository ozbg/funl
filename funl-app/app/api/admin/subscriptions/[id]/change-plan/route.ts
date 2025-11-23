import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ChangePlanRequest {
  new_plan_id: string
  prorate: boolean
  effective_date: 'immediate' | 'next_period'
  reason: string
  notes?: string
}

/**
 * POST /api/admin/subscriptions/[id]/change-plan
 * Upgrade or downgrade a customer's subscription plan
 *
 * Request Body:
 * - new_plan_id: UUID of the new plan
 * - prorate: If true, calculate prorated refund/charge
 * - effective_date: 'immediate' or 'next_period'
 * - reason: Required reason for audit (min 10 chars)
 * - notes: Optional additional context
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin privileges
  const { data: adminCheck } = await authClient
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  // Parse request body
  let body: ChangePlanRequest
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { new_plan_id, prorate, effective_date, reason, notes } = body

  if (!new_plan_id || prorate === undefined || !effective_date || !reason) {
    return NextResponse.json(
      { error: 'Missing required fields: new_plan_id, prorate, effective_date, reason' },
      { status: 400 }
    )
  }

  if (reason.length < 10) {
    return NextResponse.json(
      { error: 'Reason must be at least 10 characters for audit trail' },
      { status: 400 }
    )
  }

  if (!['immediate', 'next_period'].includes(effective_date)) {
    return NextResponse.json(
      { error: 'effective_date must be "immediate" or "next_period"' },
      { status: 400 }
    )
  }

  const serviceClient = await createServiceClient()

  // Get current subscription
  const { data: currentSub, error: subError } = await serviceClient
    .from('subscription_history')
    .select('*, subscription_plan:subscription_plans(*), business:businesses(id, name, email)')
    .eq('id', id)
    .single()

  if (subError || !currentSub) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  // Get new plan
  const { data: newPlan, error: planError } = await serviceClient
    .from('subscription_plans')
    .select('*')
    .eq('id', new_plan_id)
    .single()

  if (planError || !newPlan) {
    return NextResponse.json({ error: 'New plan not found' }, { status: 404 })
  }

  if (!newPlan.is_active) {
    return NextResponse.json({ error: 'Cannot change to inactive plan' }, { status: 400 })
  }

  if (currentSub.subscription_plan_id === new_plan_id) {
    return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
  }

  // Determine if upgrade or downgrade
  const currentPrice = currentSub.billing_period === 'weekly'
    ? currentSub.subscription_plan.price_weekly
    : currentSub.subscription_plan.price_monthly
  const newPrice = currentSub.billing_period === 'weekly'
    ? newPlan.price_weekly
    : newPlan.price_monthly

  const isUpgrade = newPrice > currentPrice
  const eventType = isUpgrade ? 'upgraded' : 'downgraded'

  // Calculate proration if requested
  let proratedAmount = 0
  if (prorate && effective_date === 'immediate') {
    const now = new Date()
    const periodStart = new Date(currentSub.current_period_start)
    const periodEnd = new Date(currentSub.current_period_end)
    const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    const daysUsed = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    const daysRemaining = totalDays - daysUsed

    // Calculate refund for unused portion of current plan
    const unusedAmount = (daysRemaining / totalDays) * currentPrice

    // Calculate charge for new plan (prorated for remaining period)
    const newAmount = (daysRemaining / totalDays) * newPrice

    proratedAmount = newAmount - unusedAmount
  }

  let updateData: Record<string, unknown>
  let newSubscriptionData: Record<string, unknown> | null = null

  if (effective_date === 'immediate') {
    // Create new subscription_history record for immediate change
    const now = new Date()
    const periodEnd = new Date(currentSub.current_period_end)

    newSubscriptionData = {
      business_id: currentSub.business_id,
      subscription_plan_id: new_plan_id,
      status: currentSub.status,
      billing_period: currentSub.billing_period,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_start: null,
      trial_end: null,
      plan_snapshot: {
        plan_id: newPlan.id,
        name: newPlan.name,
        funnel_limit: newPlan.funnel_limit,
        price_monthly: newPlan.price_monthly,
        price_weekly: newPlan.price_weekly,
        features: newPlan.features,
      },
      event_type: eventType,
      previous_plan_id: currentSub.subscription_plan_id,
      notes: `Admin changed plan. Reason: ${reason}`,
    }

    const { data: newSub, error: newSubError } = await serviceClient
      .from('subscription_history')
      .insert(newSubscriptionData)
      .select()
      .single()

    if (newSubError) {
      console.error('Error creating new subscription:', newSubError)
      return NextResponse.json({ error: newSubError.message }, { status: 500 })
    }

    // Update business.current_subscription_id
    await serviceClient
      .from('businesses')
      .update({ current_subscription_id: newSub.id })
      .eq('id', currentSub.business_id)

    // Mark old subscription as inactive (by updating its end date)
    await serviceClient
      .from('subscription_history')
      .update({ current_period_end: now.toISOString() })
      .eq('id', id)

    updateData = newSub
  } else {
    // Schedule for next period
    // Update current subscription to change plan at period end
    updateData = {
      // We'll store this as a note for now
      // In production, you might want a separate "scheduled_plan_change" field
      notes: currentSub.notes
        ? `${currentSub.notes}\nScheduled plan change to ${newPlan.name} at period end. Reason: ${reason}`
        : `Scheduled plan change to ${newPlan.name} at period end. Reason: ${reason}`,
    }

    await serviceClient
      .from('subscription_history')
      .update(updateData)
      .eq('id', id)
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: eventType,
      p_entity_type: 'subscription',
      p_entity_id: id,
      p_business_id: currentSub.business_id,
      p_old_values: {
        plan_id: currentSub.subscription_plan_id,
        plan_name: currentSub.subscription_plan.name,
        funnel_limit: currentSub.subscription_plan.funnel_limit,
      },
      p_new_values: {
        plan_id: newPlan.id,
        plan_name: newPlan.name,
        funnel_limit: newPlan.funnel_limit,
        effective_date,
        prorated_amount: proratedAmount,
      },
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null,
    })
  } catch (logError) {
    console.error('Error logging admin action:', logError)
  }

  // TODO: If Stripe subscription exists, update it
  // if (currentSub.stripe_subscription_id) {
  //   if (effective_date === 'immediate') {
  //     await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
  //       items: [{ id: currentSub.stripe_subscription_item_id, price: newPlan.stripe_price_id }],
  //       proration_behavior: prorate ? 'create_prorations' : 'none'
  //     })
  //   } else {
  //     await stripe.subscriptions.schedule.create({
  //       from_subscription: currentSub.stripe_subscription_id,
  //       phases: [
  //         { items: [{ price: newPlan.stripe_price_id }], start_date: periodEnd }
  //       ]
  //     })
  //   }
  // }

  const message = effective_date === 'immediate'
    ? `Successfully ${eventType} ${currentSub.business.name} to ${newPlan.name} plan`
    : `Scheduled plan change to ${newPlan.name} at period end for ${currentSub.business.name}`

  return NextResponse.json({
    subscription: updateData,
    message,
    prorated_amount: proratedAmount,
    effective_date,
  })
}
