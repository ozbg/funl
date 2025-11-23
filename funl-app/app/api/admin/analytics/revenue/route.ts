import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/analytics/revenue
 * Get revenue analytics including MRR, ARR, growth metrics
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

  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get('period') || '30' // days

  const serviceClient = await createServiceClient()

  // Get all active subscriptions
  const { data: activeSubscriptions } = await serviceClient
    .from('subscription_history')
    .select(`
      *,
      subscription_plan:subscription_plans(*),
      addon_funnels:subscription_addon_funnels(*)
    `)
    .in('status', ['active', 'trialing'])

  // Calculate MRR (Monthly Recurring Revenue)
  let mrr = 0
  let weeklyRevenue = 0

  for (const sub of activeSubscriptions || []) {
    const planPrice = sub.billing_period === 'monthly'
      ? sub.subscription_plan.price_monthly
      : sub.subscription_plan.price_weekly

    if (sub.billing_period === 'monthly') {
      mrr += planPrice
    } else {
      // Convert weekly to monthly
      mrr += (planPrice * 52) / 12
      weeklyRevenue += planPrice
    }

    // Add addon funnel revenue
    const addonFunnels = sub.addon_funnels || []
    for (const addon of addonFunnels) {
      if (!addon.is_active) continue
      const addonPrice = addon.billing_period === 'monthly'
        ? addon.price_per_funnel * addon.quantity
        : (addon.price_per_funnel * addon.quantity * 52) / 12
      mrr += addonPrice
    }
  }

  // Calculate ARR (Annual Recurring Revenue)
  const arr = mrr * 12

  // Get historical revenue for growth calculation
  const daysAgo = parseInt(period)
  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - daysAgo)

  const { data: pastSubscriptions } = await serviceClient
    .from('subscription_history')
    .select('*')
    .in('status', ['active', 'trialing'])
    .lte('created_at', pastDate.toISOString())

  let pastMrr = 0
  for (const sub of pastSubscriptions || []) {
    const price = sub.billing_period === 'monthly'
      ? sub.subscription_plan?.price_monthly || 0
      : ((sub.subscription_plan?.price_weekly || 0) * 52) / 12
    pastMrr += price
  }

  const mrrGrowth = pastMrr > 0 ? ((mrr - pastMrr) / pastMrr) * 100 : 0

  // Get total revenue from completed orders
  const { data: orders } = await serviceClient
    .from('orders')
    .select('total_price, status, created_at')
    .eq('status', 'completed')

  const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0

  // Revenue this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const monthRevenue = orders
    ?.filter(o => new Date(o.created_at) >= startOfMonth)
    .reduce((sum, order) => sum + (order.total_price || 0), 0) || 0

  return NextResponse.json({
    mrr: Math.round(mrr),
    arr: Math.round(arr),
    mrr_growth_percent: Math.round(mrrGrowth * 100) / 100,
    total_revenue: totalRevenue,
    monthly_revenue: monthRevenue,
    weekly_recurring_revenue: Math.round(weeklyRevenue),
    active_subscriptions: activeSubscriptions?.length || 0,
    period_days: daysAgo
  })
}
