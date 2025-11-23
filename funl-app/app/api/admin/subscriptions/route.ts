import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/subscriptions
 * List all subscriptions with filtering and pagination
 *
 * Query Parameters:
 * - status: Filter by status (active, trialing, canceled, past_due)
 * - plan_id: Filter by plan
 * - search: Search by business name or email
 * - page: Pagination page (default 1)
 * - limit: Results per page (default 50, max 100)
 * - sort: Sort by (created_at, business_name, plan_name, current_period_end)
 * - order: asc/desc (default desc)
 */
export async function GET(request: NextRequest) {
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

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') || undefined
  const planId = searchParams.get('plan_id') || undefined
  const search = searchParams.get('search') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const sort = searchParams.get('sort') || 'created_at'
  const order = searchParams.get('order') || 'desc'

  const offset = (page - 1) * limit

  // Use service client to bypass RLS
  const serviceClient = await createServiceClient()

  // Build base query - get latest subscription for each business
  let query = serviceClient
    .from('subscription_history')
    .select(`
      id,
      business_id,
      subscription_plan_id,
      status,
      billing_period,
      current_period_start,
      current_period_end,
      trial_start,
      trial_end,
      cancel_at_period_end,
      canceled_at,
      stripe_subscription_id,
      created_at,
      business:businesses!inner(
        id,
        name,
        email,
        funnel_count
      ),
      subscription_plan:subscription_plans(
        id,
        name,
        slug,
        funnel_limit,
        price_monthly,
        price_weekly
      )
    `, { count: 'exact' })

  // Filter by status
  if (status) {
    query = query.eq('status', status)
  }

  // Filter by plan
  if (planId) {
    query = query.eq('subscription_plan_id', planId)
  }

  // Search by business name or email
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`, { foreignTable: 'businesses' })
  }

  // Get only the latest subscription per business
  // This is done by ordering and then deduplicating in code
  query = query.order('created_at', { ascending: false })

  // Execute query
  const { data: allSubscriptions, error, count } = await query

  if (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Deduplicate - keep only latest subscription per business
  const latestSubscriptions = new Map()
  allSubscriptions?.forEach((sub) => {
    if (!latestSubscriptions.has(sub.business_id)) {
      latestSubscriptions.set(sub.business_id, sub)
    }
  })

  let subscriptions = Array.from(latestSubscriptions.values())

  // Get addon funnels for each subscription
  const businessIds = subscriptions.map((sub) => sub.business_id)
  const { data: addonFunnels } = await serviceClient
    .from('subscription_addon_funnels')
    .select('business_id, quantity')
    .in('business_id', businessIds)
    .eq('is_active', true)
    .eq('cancel_at_period_end', false)

  // Map addon funnels by business
  const addonsByBusiness = new Map()
  addonFunnels?.forEach((addon) => {
    const existing = addonsByBusiness.get(addon.business_id) || 0
    addonsByBusiness.set(addon.business_id, existing + addon.quantity)
  })

  // Enrich subscriptions with calculated fields
  subscriptions = subscriptions.map((sub) => {
    const planLimit = sub.subscription_plan?.funnel_limit || 0
    const addonLimit = addonsByBusiness.get(sub.business_id) || 0
    const totalLimit = planLimit + addonLimit
    const currentUsage = sub.business?.funnel_count || 0

    // Calculate days until renewal
    const periodEnd = new Date(sub.current_period_end)
    const now = new Date()
    const daysUntilRenewal = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      id: sub.id,
      business: {
        id: sub.business?.id,
        name: sub.business?.name,
        email: sub.business?.email,
      },
      subscription_plan: sub.subscription_plan,
      status: sub.status,
      billing_period: sub.billing_period,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      trial_end: sub.trial_end,
      cancel_at_period_end: sub.cancel_at_period_end,
      stripe_subscription_id: sub.stripe_subscription_id,
      funnel_usage: {
        current: currentUsage,
        limit: totalLimit,
        addon_funnels: addonLimit,
      },
      days_until_renewal: daysUntilRenewal,
    }
  })

  // Apply sorting
  subscriptions.sort((a, b) => {
    let aVal, bVal
    switch (sort) {
      case 'business_name':
        aVal = a.business.name || ''
        bVal = b.business.name || ''
        break
      case 'plan_name':
        aVal = a.subscription_plan?.name || ''
        bVal = b.subscription_plan?.name || ''
        break
      case 'current_period_end':
        aVal = new Date(a.current_period_end).getTime()
        bVal = new Date(b.current_period_end).getTime()
        break
      case 'created_at':
      default:
        aVal = new Date(a.current_period_start).getTime()
        bVal = new Date(b.current_period_start).getTime()
    }

    if (order === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  // Apply pagination after deduplication
  const paginatedSubscriptions = subscriptions.slice(offset, offset + limit)
  const total = subscriptions.length

  // Calculate stats
  const stats = {
    total_active: subscriptions.filter((s) => s.status === 'active').length,
    total_trialing: subscriptions.filter((s) => s.status === 'trialing').length,
    total_canceled: subscriptions.filter((s) => s.status === 'canceled').length,
    mrr: subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        const plan = s.subscription_plan
        if (!plan) return sum
        const price = s.billing_period === 'weekly' ? plan.price_weekly * 4.33 : plan.price_monthly
        return sum + price
      }, 0),
  }

  return NextResponse.json({
    subscriptions: paginatedSubscriptions,
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
    stats,
  })
}
