import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/plans
 * List all subscription plans with filtering and stats
 */
export async function GET(request: NextRequest) {
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

  // Get query parameters
  const searchParams = request.nextUrl.searchParams
  const isActive = searchParams.get('is_active')
  const includeDeleted = searchParams.get('include_deleted') === 'true'

  // Build query
  const serviceClient = await createServiceClient()
  let query = serviceClient
    .from('subscription_plans')
    .select('*', { count: 'exact' })

  if (!includeDeleted) {
    query = query.is('deleted_at', null)
  }

  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true')
  }

  query = query.order('display_order', { ascending: true })

  const { data: plans, error, count } = await query

  if (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get subscriber counts for each plan
  const plansWithStats = await Promise.all(
    (plans || []).map(async (plan) => {
      const { count: subscriberCount } = await serviceClient
        .from('subscription_history')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_plan_id', plan.id)
        .in('status', ['active', 'trialing'])

      return {
        ...plan,
        subscriber_count: subscriberCount || 0
      }
    })
  )

  // Calculate stats
  const stats = {
    total_plans: plansWithStats.length,
    active_plans: plansWithStats.filter(p => p.is_active).length,
    inactive_plans: plansWithStats.filter(p => !p.is_active).length,
    total_subscribers: plansWithStats.reduce((sum, p) => sum + p.subscriber_count, 0)
  }

  return NextResponse.json({
    plans: plansWithStats,
    stats,
    pagination: {
      total: count || 0
    }
  })
}

/**
 * POST /api/admin/plans
 * Create a new subscription plan
 *
 * Note: billing_period is the default billing frequency for this plan.
 * Customers can choose their preferred billing frequency (monthly/weekly) at checkout.
 */
export async function POST(request: NextRequest) {
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
    is_default,
    featured,
    display_order,
    reason,
    notes
  } = body

  // Validate required fields
  if (!name || !slug || !price_monthly || !billing_period || funnel_limit === undefined || !reason || reason.length < 10) {
    return NextResponse.json({
      error: 'Missing required fields: name, slug, price_monthly, billing_period, funnel_limit, reason (min 10 chars)'
    }, { status: 400 })
  }

  if (funnel_limit < 1) {
    return NextResponse.json({
      error: 'Funnel limit must be at least 1'
    }, { status: 400 })
  }

  const serviceClient = await createServiceClient()

  // If this is set as default, unset other defaults first
  if (is_default) {
    await serviceClient
      .from('subscription_plans')
      .update({ is_default: false })
      .eq('is_default', true)
  }

  // Create plan
  const { data: plan, error: createError } = await serviceClient
    .from('subscription_plans')
    .insert({
      name,
      slug,
      description: description || null,
      tagline: tagline || null,
      cta_text: cta_text || 'Get Started',
      price_monthly,
      price_weekly: price_weekly || null,
      billing_period,
      trial_period_days: trial_period_days || 0,
      funnel_limit,
      features: features || null,
      is_active: true,
      is_default: is_default || false,
      featured: featured || false,
      display_order: display_order || 999
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating plan:', createError)
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'created',
      p_entity_type: 'subscription',
      p_entity_id: plan.id,
      p_business_id: null,
      p_old_values: null,
      p_new_values: plan,
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null
    })
  } catch (logError) {
    console.error('Failed to log admin action:', logError)
  }

  return NextResponse.json({ plan }, { status: 201 })
}
