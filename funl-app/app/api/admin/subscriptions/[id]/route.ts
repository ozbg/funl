import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface UpdateSubscriptionRequest {
  action: 'extend_trial' | 'change_billing_period' | 'adjust_dates' | 'reactivate'
  new_trial_end?: string
  new_billing_period?: 'weekly' | 'monthly'
  new_period_start?: string
  new_period_end?: string
  reason: string
  notes?: string
}

/**
 * PUT /api/admin/subscriptions/[id]
 * Update subscription details (extend trial, change billing period, etc.)
 *
 * Request Body:
 * - action: Type of update to perform
 * - new_trial_end: For extend_trial action
 * - new_billing_period: For change_billing_period action
 * - new_period_start/new_period_end: For adjust_dates action
 * - reason: Required reason for audit
 * - notes: Optional additional context
 */
export async function PUT(
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
  let body: UpdateSubscriptionRequest
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action, reason, notes } = body

  if (!action || !reason) {
    return NextResponse.json(
      { error: 'Missing required fields: action, reason' },
      { status: 400 }
    )
  }

  if (reason.length < 10) {
    return NextResponse.json(
      { error: 'Reason must be at least 10 characters for audit trail' },
      { status: 400 }
    )
  }

  const serviceClient = await createServiceClient()

  // Get existing subscription
  const { data: subscription, error: subError } = await serviceClient
    .from('subscription_history')
    .select('*, subscription_plan:subscription_plans(*), business:businesses(id, name, email)')
    .eq('id', id)
    .single()

  if (subError || !subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  // Store old values for audit
  const oldValues: Record<string, unknown> = {
    status: subscription.status,
    billing_period: subscription.billing_period,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    trial_end: subscription.trial_end,
  }

  let updateData: Record<string, unknown> = {}
  let actionDescription = ''

  // Perform action
  switch (action) {
    case 'extend_trial':
      if (!body.new_trial_end) {
        return NextResponse.json(
          { error: 'new_trial_end is required for extend_trial action' },
          { status: 400 }
        )
      }

      const newTrialEnd = new Date(body.new_trial_end)
      const currentTrialEnd = subscription.trial_end ? new Date(subscription.trial_end) : new Date()

      if (newTrialEnd <= currentTrialEnd) {
        return NextResponse.json(
          { error: 'New trial end must be after current trial end' },
          { status: 400 }
        )
      }

      updateData = {
        trial_end: newTrialEnd.toISOString(),
        status: 'trialing', // Ensure status is trialing
      }
      actionDescription = 'trial_extended'
      break

    case 'change_billing_period':
      if (!body.new_billing_period || !['weekly', 'monthly'].includes(body.new_billing_period)) {
        return NextResponse.json(
          { error: 'new_billing_period must be "weekly" or "monthly"' },
          { status: 400 }
        )
      }

      // Recalculate period end based on new billing period
      const currentStart = new Date(subscription.current_period_start)
      const newPeriodLength = body.new_billing_period === 'weekly' ? 7 : 30
      const newPeriodEnd = new Date(currentStart)
      newPeriodEnd.setDate(newPeriodEnd.getDate() + newPeriodLength)

      updateData = {
        billing_period: body.new_billing_period,
        current_period_end: newPeriodEnd.toISOString(),
      }
      actionDescription = 'billing_period_changed'
      break

    case 'adjust_dates':
      if (!body.new_period_start && !body.new_period_end) {
        return NextResponse.json(
          { error: 'Either new_period_start or new_period_end is required for adjust_dates action' },
          { status: 400 }
        )
      }

      if (body.new_period_start) {
        updateData.current_period_start = new Date(body.new_period_start).toISOString()
      }
      if (body.new_period_end) {
        updateData.current_period_end = new Date(body.new_period_end).toISOString()
      }
      actionDescription = 'dates_adjusted'
      break

    case 'reactivate':
      if (subscription.status !== 'canceled') {
        return NextResponse.json(
          { error: 'Can only reactivate canceled subscriptions' },
          { status: 400 }
        )
      }

      // Reactivate subscription
      const reactivateStart = new Date()
      const reactivatePeriodLength = subscription.billing_period === 'weekly' ? 7 : 30
      const reactivateEnd = new Date(reactivateStart)
      reactivateEnd.setDate(reactivateEnd.getDate() + reactivatePeriodLength)

      updateData = {
        status: 'active',
        cancel_at_period_end: false,
        canceled_at: null,
        current_period_start: reactivateStart.toISOString(),
        current_period_end: reactivateEnd.toISOString(),
      }
      actionDescription = 'reactivated'
      break

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }

  // Update subscription
  const { data: updatedSub, error: updateError } = await serviceClient
    .from('subscription_history')
    .update(updateData)
    .eq('id', id)
    .select('*, subscription_plan:subscription_plans(*), business:businesses(id, name, email)')
    .single()

  if (updateError) {
    console.error('Error updating subscription:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: actionDescription,
      p_entity_type: 'subscription',
      p_entity_id: id,
      p_business_id: subscription.business_id,
      p_old_values: oldValues,
      p_new_values: updateData,
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null,
    })
  } catch (logError) {
    console.error('Error logging admin action:', logError)
  }

  return NextResponse.json({
    subscription: updatedSub,
    message: `Successfully ${actionDescription.replace('_', ' ')} for ${subscription.business.name}`,
  })
}
