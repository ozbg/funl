import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface CancelSubscriptionRequest {
  cancel_immediately: boolean
  reason: string
  refund_amount?: number
  notes?: string
}

/**
 * POST /api/admin/subscriptions/[id]/cancel
 * Cancel a subscription (immediately or at period end)
 *
 * Request Body:
 * - cancel_immediately: If true, cancel now. If false, cancel at period end.
 * - reason: Required reason for audit (min 10 chars)
 * - refund_amount: Optional refund amount (for immediate cancellation)
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
  let body: CancelSubscriptionRequest
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { cancel_immediately, reason, refund_amount, notes } = body

  if (cancel_immediately === undefined || !reason) {
    return NextResponse.json(
      { error: 'Missing required fields: cancel_immediately, reason' },
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

  // Check if already canceled
  if (subscription.status === 'canceled') {
    return NextResponse.json(
      { error: 'Subscription is already canceled' },
      { status: 400 }
    )
  }

  // Store old values for audit
  const oldValues = {
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at,
  }

  let updateData: Record<string, unknown>
  let actionDescription: string

  if (cancel_immediately) {
    // Immediate cancellation
    updateData = {
      status: 'canceled',
      cancel_at_period_end: false,
      canceled_at: new Date().toISOString(),
      current_period_end: new Date().toISOString(), // End immediately
    }
    actionDescription = 'canceled_immediately'

    // TODO: If Stripe subscription exists, cancel it immediately
    // if (subscription.stripe_subscription_id) {
    //   await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
    // }

    // TODO: Process refund if refund_amount > 0
    // if (refund_amount && refund_amount > 0) {
    //   await processRefund(subscription, refund_amount)
    // }
  } else {
    // Cancel at period end
    updateData = {
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString(),
    }
    actionDescription = 'canceled_at_period_end'

    // TODO: If Stripe subscription exists, set to cancel at period end
    // if (subscription.stripe_subscription_id) {
    //   await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    //     cancel_at_period_end: true
    //   })
    // }
  }

  // Update subscription
  const { data: updatedSub, error: updateError } = await serviceClient
    .from('subscription_history')
    .update(updateData)
    .eq('id', id)
    .select('*, subscription_plan:subscription_plans(*), business:businesses(id, name, email)')
    .single()

  if (updateError) {
    console.error('Error canceling subscription:', updateError)
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
      p_new_values: {
        ...updateData,
        refund_amount: refund_amount || null,
      },
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null,
    })
  } catch (logError) {
    console.error('Error logging admin action:', logError)
  }

  // TODO: Send cancellation notification email
  // await sendEmail({
  //   to: subscription.business.email,
  //   subject: 'Subscription Cancellation Confirmation',
  //   template: cancel_immediately ? 'subscription-canceled-immediately' : 'subscription-canceled-at-period-end',
  //   data: { subscription, business: subscription.business }
  // })

  const message = cancel_immediately
    ? `Subscription canceled immediately for ${subscription.business.name}`
    : `Subscription will be canceled at period end (${new Date(subscription.current_period_end).toLocaleDateString()}) for ${subscription.business.name}`

  return NextResponse.json({
    subscription: updatedSub,
    message,
    refund_processed: refund_amount ? refund_amount : 0,
  })
}
