import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface CancelAddonRequest {
  cancel_immediately: boolean
  reason: string
  notes?: string
}

/**
 * DELETE /api/admin/addon-funnels/[id]
 * Remove addon funnels (immediately or at period end)
 *
 * Request Body:
 * - cancel_immediately: If true, remove now. If false, remove at period end.
 * - reason: Required reason for audit (min 10 chars)
 * - notes: Optional additional context
 */
export async function DELETE(
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
  let body: CancelAddonRequest
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { cancel_immediately, reason, notes } = body

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

  // Get addon funnel
  const { data: addonFunnel, error: addonError } = await serviceClient
    .from('subscription_addon_funnels')
    .select('*, business:businesses(id, name, email, funnel_count)')
    .eq('id', id)
    .single()

  if (addonError || !addonFunnel) {
    return NextResponse.json({ error: 'Addon funnel not found' }, { status: 404 })
  }

  // Check if already canceled
  if (!addonFunnel.is_active) {
    return NextResponse.json(
      { error: 'Addon funnel is already canceled' },
      { status: 400 }
    )
  }

  // Get total funnel limit (including this addon)
  const { data: totalLimit } = await serviceClient.rpc('get_business_funnel_limit', {
    p_business_id: addonFunnel.business_id,
  })

  // Check if removing would cause issues
  const newLimit = (totalLimit || 0) - addonFunnel.quantity
  const currentUsage = addonFunnel.business.funnel_count || 0

  if (currentUsage > newLimit && cancel_immediately) {
    return NextResponse.json(
      {
        error: `Cannot remove addon immediately. Business is using ${currentUsage} funnels, but removing ${addonFunnel.quantity} addon funnels would reduce limit to ${newLimit}. Please cancel at period end or ask business to delete funnels first.`,
      },
      { status: 400 }
    )
  }

  // Store old values for audit
  const oldValues = {
    is_active: addonFunnel.is_active,
    cancel_at_period_end: addonFunnel.cancel_at_period_end,
    canceled_at: addonFunnel.canceled_at,
  }

  let updateData: Record<string, unknown>
  let actionDescription: string

  if (cancel_immediately) {
    // Immediate cancellation
    updateData = {
      is_active: false,
      cancel_at_period_end: false,
      canceled_at: new Date().toISOString(),
      current_period_end: new Date().toISOString(), // End immediately
    }
    actionDescription = 'addon_removed_immediately'

    // TODO: If Stripe subscription item exists, cancel it immediately
    // if (addonFunnel.stripe_subscription_item_id) {
    //   await stripe.subscriptionItems.del(addonFunnel.stripe_subscription_item_id)
    // }
  } else {
    // Cancel at period end
    updateData = {
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString(),
    }
    actionDescription = 'addon_removed_at_period_end'

    // TODO: If Stripe subscription item exists, set to cancel at period end
    // if (addonFunnel.stripe_subscription_item_id) {
    //   // Stripe doesn't have cancel_at_period_end for subscription items
    //   // We'll need to handle this in webhook or scheduled job
    // }
  }

  // Update addon funnel
  const { data: updatedAddon, error: updateError } = await serviceClient
    .from('subscription_addon_funnels')
    .update(updateData)
    .eq('id', id)
    .select('*, business:businesses(id, name, email)')
    .single()

  if (updateError) {
    console.error('Error canceling addon funnel:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Get current subscription for logging
  const { data: currentSub } = await serviceClient
    .from('subscription_history')
    .select('id')
    .eq('business_id', addonFunnel.business_id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Log admin action
  if (currentSub) {
    try {
      await serviceClient.rpc('log_admin_action', {
        p_action: actionDescription,
        p_entity_type: 'subscription',
        p_entity_id: currentSub.id,
        p_business_id: addonFunnel.business_id,
        p_old_values: {
          ...oldValues,
          quantity: addonFunnel.quantity,
        },
        p_new_values: updateData,
        p_admin_id: user.id,
        p_reason: reason,
        p_notes: notes || null,
      })
    } catch (logError) {
      console.error('Error logging admin action:', logError)
    }
  }

  // TODO: Send notification email
  // await sendEmail({
  //   to: addonFunnel.business.email,
  //   subject: 'Addon Funnels Cancellation',
  //   template: cancel_immediately ? 'addon-canceled-immediately' : 'addon-canceled-at-period-end',
  //   data: { business: addonFunnel.business, quantity: addonFunnel.quantity, periodEnd: addonFunnel.current_period_end }
  // })

  const message = cancel_immediately
    ? `Removed ${addonFunnel.quantity} addon funnel${addonFunnel.quantity > 1 ? 's' : ''} immediately from ${addonFunnel.business.name}`
    : `Addon funnel${addonFunnel.quantity > 1 ? 's' : ''} will be removed at period end (${new Date(addonFunnel.current_period_end).toLocaleDateString()}) for ${addonFunnel.business.name}`

  return NextResponse.json({
    addon_funnel: updatedAddon,
    message,
    new_funnel_limit: newLimit,
  })
}
