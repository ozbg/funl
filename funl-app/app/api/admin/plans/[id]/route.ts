import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/plans/[id]
 * Get a single subscription plan with subscriber details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  // Verify admin authentication
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminCheck } = await authClient
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceClient = await createServiceClient()

  // Get plan
  const { data: plan, error } = await serviceClient
    .from('subscription_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Get subscriber stats
  const { data: subscriptions, count: totalSubscribers } = await serviceClient
    .from('subscription_history')
    .select('status', { count: 'exact' })
    .eq('subscription_plan_id', id)

  const stats = {
    total_subscribers: totalSubscribers || 0,
    active_subscribers: subscriptions?.filter(s => s.status === 'active').length || 0,
    trialing_subscribers: subscriptions?.filter(s => s.status === 'trialing').length || 0,
    canceled_subscribers: subscriptions?.filter(s => s.status === 'canceled').length || 0
  }

  return NextResponse.json({
    plan,
    stats
  })
}

/**
 * PUT /api/admin/plans/[id]
 * Update a subscription plan
 *
 * Note: billing_period is the default billing frequency for this plan.
 * Customers can choose their preferred billing frequency (monthly/weekly) at checkout.
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  // Verify admin authentication
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminCheck } = await authClient
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceClient = await createServiceClient()

  // Get existing plan
  const { data: oldPlan, error: fetchError } = await serviceClient
    .from('subscription_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !oldPlan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Parse request body
  const body = await request.json()
  const {
    name,
    slug,
    description,
    tagline,
    cta_text,
    price_monthly,
    price_weekly,
    billing_period,
    trial_period_days,
    funnel_limit,
    features,
    is_active,
    is_default,
    featured,
    display_order,
    reason,
    notes
  } = body

  if (!reason || reason.length < 10) {
    return NextResponse.json({
      error: 'Reason is required and must be at least 10 characters'
    }, { status: 400 })
  }

  // Build update data
  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (slug !== undefined) updateData.slug = slug
  if (description !== undefined) updateData.description = description
  if (tagline !== undefined) updateData.tagline = tagline
  if (cta_text !== undefined) updateData.cta_text = cta_text
  if (price_monthly !== undefined) updateData.price_monthly = price_monthly
  if (price_weekly !== undefined) updateData.price_weekly = price_weekly
  if (billing_period !== undefined) updateData.billing_period = billing_period
  if (trial_period_days !== undefined) updateData.trial_period_days = trial_period_days
  if (funnel_limit !== undefined) {
    if (funnel_limit < 1) {
      return NextResponse.json({ error: 'Funnel limit must be at least 1' }, { status: 400 })
    }
    updateData.funnel_limit = funnel_limit
  }
  if (features !== undefined) updateData.features = features
  if (is_active !== undefined) updateData.is_active = is_active
  if (is_default !== undefined) updateData.is_default = is_default
  if (featured !== undefined) updateData.featured = featured
  if (display_order !== undefined) updateData.display_order = display_order

  // If setting as default, unset others first
  if (is_default === true) {
    await serviceClient
      .from('subscription_plans')
      .update({ is_default: false })
      .eq('is_default', true)
      .neq('id', id)
  }

  // Update plan
  const { data: plan, error: updateError } = await serviceClient
    .from('subscription_plans')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating plan:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Determine action type
  let action = 'updated'
  if (is_active !== undefined && is_active !== oldPlan.is_active) {
    action = is_active ? 'activated' : 'deactivated'
  } else if (price_monthly !== undefined && price_monthly !== oldPlan.price_monthly) {
    action = 'price_changed'
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: action,
      p_entity_type: 'subscription',
      p_entity_id: plan.id,
      p_business_id: null,
      p_old_values: oldPlan,
      p_new_values: plan,
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null
    })
  } catch (logError) {
    console.error('Failed to log admin action:', logError)
  }

  return NextResponse.json({ plan })
}

/**
 * DELETE /api/admin/plans/[id]
 * Soft delete a subscription plan
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  // Verify admin authentication
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminCheck } = await authClient
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { reason, notes } = body

  if (!reason || reason.length < 10) {
    return NextResponse.json({
      error: 'Reason is required and must be at least 10 characters'
    }, { status: 400 })
  }

  const serviceClient = await createServiceClient()

  // Get existing plan
  const { data: oldPlan, error: fetchError } = await serviceClient
    .from('subscription_plans')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !oldPlan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Check if plan has active subscribers
  const { count: activeSubscribers } = await serviceClient
    .from('subscription_history')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_plan_id', id)
    .in('status', ['active', 'trialing'])

  if (activeSubscribers && activeSubscribers > 0) {
    return NextResponse.json({
      error: `Cannot delete plan with ${activeSubscribers} active subscribers. Deactivate the plan instead.`,
      active_subscribers: activeSubscribers
    }, { status: 400 })
  }

  // Soft delete
  const { data: plan, error: deleteError } = await serviceClient
    .from('subscription_plans')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id)
    .select()
    .single()

  if (deleteError) {
    console.error('Error deleting plan:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'deleted',
      p_entity_type: 'subscription',
      p_entity_id: plan.id,
      p_business_id: null,
      p_old_values: oldPlan,
      p_new_values: plan,
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null
    })
  } catch (logError) {
    console.error('Failed to log admin action:', logError)
  }

  return NextResponse.json({ success: true, plan })
}
