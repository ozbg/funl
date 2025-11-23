import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface AssignSubscriptionRequest {
  business_id: string
  plan_id: string
  billing_period: 'weekly' | 'monthly'
  start_date?: string
  trial_days?: number
  skip_trial?: boolean
  reason: string
  notes?: string
}

/**
 * POST /api/admin/subscriptions/assign
 * Manually assign a subscription to a business
 *
 * Request Body:
 * - business_id: UUID of the business
 * - plan_id: UUID of the subscription plan
 * - billing_period: 'weekly' or 'monthly'
 * - start_date: Optional start date (defaults to now)
 * - trial_days: Optional override trial period
 * - skip_trial: Skip trial entirely
 * - reason: Required reason for audit (min 10 chars)
 * - notes: Optional additional context
 */
export async function POST(request: NextRequest) {
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

  // Parse and validate request body
  let body: AssignSubscriptionRequest
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { business_id, plan_id, billing_period, start_date, trial_days, skip_trial, reason, notes } = body

  // Validate required fields
  if (!business_id || !plan_id || !billing_period || !reason) {
    return NextResponse.json(
      { error: 'Missing required fields: business_id, plan_id, billing_period, reason' },
      { status: 400 }
    )
  }

  if (reason.length < 10) {
    return NextResponse.json(
      { error: 'Reason must be at least 10 characters for audit trail' },
      { status: 400 }
    )
  }

  if (!['weekly', 'monthly'].includes(billing_period)) {
    return NextResponse.json(
      { error: 'billing_period must be "weekly" or "monthly"' },
      { status: 400 }
    )
  }

  const serviceClient = await createServiceClient()

  // Validate business exists
  const { data: business, error: businessError } = await serviceClient
    .from('businesses')
    .select('id, name, email')
    .eq('id', business_id)
    .single()

  if (businessError || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Check if business already has active subscription
  const { data: existingSub } = await serviceClient
    .from('subscription_history')
    .select('id, status')
    .eq('business_id', business_id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existingSub) {
    return NextResponse.json(
      {
        error: `Business already has an ${existingSub.status} subscription. Please cancel or change the existing subscription first.`,
      },
      { status: 400 }
    )
  }

  // Validate plan exists
  const { data: plan, error: planError } = await serviceClient
    .from('subscription_plans')
    .select('*')
    .eq('id', plan_id)
    .single()

  if (planError || !plan) {
    return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 })
  }

  if (!plan.is_active) {
    return NextResponse.json({ error: 'Cannot assign inactive plan' }, { status: 400 })
  }

  // Calculate dates
  const startDate = start_date ? new Date(start_date) : new Date()
  const periodLength = billing_period === 'weekly' ? 7 : 30
  const currentPeriodEnd = new Date(startDate)
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + periodLength)

  // Calculate trial
  let trialStart: Date | null = null
  let trialEnd: Date | null = null
  let status: 'active' | 'trialing' = 'active'

  if (!skip_trial) {
    const trialPeriod = trial_days !== undefined ? trial_days : plan.trial_period_days
    if (trialPeriod > 0) {
      trialStart = new Date(startDate)
      trialEnd = new Date(startDate)
      trialEnd.setDate(trialEnd.getDate() + trialPeriod)
      status = 'trialing'
    }
  }

  // Create subscription_history record
  const { data: subscription, error: subError } = await serviceClient
    .from('subscription_history')
    .insert({
      business_id,
      subscription_plan_id: plan_id,
      status,
      billing_period,
      current_period_start: startDate.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      trial_start: trialStart?.toISOString() || null,
      trial_end: trialEnd?.toISOString() || null,
      plan_snapshot: {
        plan_id: plan.id,
        name: plan.name,
        funnel_limit: plan.funnel_limit,
        price_monthly: plan.price_monthly,
        price_weekly: plan.price_weekly,
        features: plan.features,
      },
      event_type: 'created',
      notes: `Admin assigned subscription. Reason: ${reason}`,
    })
    .select()
    .single()

  if (subError) {
    console.error('Error creating subscription:', subError)
    return NextResponse.json({ error: subError.message }, { status: 500 })
  }

  // Update business.current_subscription_id
  await serviceClient
    .from('businesses')
    .update({ current_subscription_id: subscription.id })
    .eq('id', business_id)

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'created',
      p_entity_type: 'subscription',
      p_entity_id: subscription.id,
      p_business_id: business_id,
      p_old_values: null,
      p_new_values: {
        plan: plan.name,
        billing_period,
        status,
        trial_days: trial_days || plan.trial_period_days,
      },
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null,
    })
  } catch (logError) {
    console.error('Error logging admin action:', logError)
    // Don't fail the request if logging fails
  }

  // TODO: Send notification email to customer
  // await sendEmail({
  //   to: business.email,
  //   subject: 'Your FunL Subscription',
  //   template: 'subscription-assigned',
  //   data: { business, plan, subscription }
  // })

  return NextResponse.json({
    subscription: {
      ...subscription,
      subscription_plan: plan,
      business: {
        id: business.id,
        name: business.name,
        email: business.email,
      },
    },
    message: `Successfully assigned ${plan.name} plan to ${business.name}`,
  })
}
