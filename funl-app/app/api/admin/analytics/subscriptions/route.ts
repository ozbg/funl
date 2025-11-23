import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/analytics/subscriptions
 * Get subscription analytics including churn, retention, plan distribution
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

  // Get all subscriptions
  const { data: allSubscriptions } = await serviceClient
    .from('subscription_history')
    .select(`
      *,
      subscription_plan:subscription_plans(*)
    `)

  const now = new Date()
  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - parseInt(period))

  // Status breakdown
  const statusCounts = {
    active: allSubscriptions?.filter(s => s.status === 'active').length || 0,
    trialing: allSubscriptions?.filter(s => s.status === 'trialing').length || 0,
    canceled: allSubscriptions?.filter(s => s.status === 'canceled').length || 0,
    past_due: allSubscriptions?.filter(s => s.status === 'past_due').length || 0
  }

  // New subscriptions in period
  const newSubscriptions = allSubscriptions?.filter(s =>
    new Date(s.created_at) >= periodStart
  ).length || 0

  // Canceled in period
  const canceledInPeriod = allSubscriptions?.filter(s =>
    s.canceled_at && new Date(s.canceled_at) >= periodStart
  ).length || 0

  // Calculate churn rate
  const totalAtStartOfPeriod = (statusCounts.active + statusCounts.trialing + canceledInPeriod)
  const churnRate = totalAtStartOfPeriod > 0
    ? (canceledInPeriod / totalAtStartOfPeriod) * 100
    : 0

  // Plan distribution
  const planDistribution: Record<string, { count: number; name: string }> = {}
  for (const sub of allSubscriptions?.filter(s => s.status === 'active' || s.status === 'trialing') || []) {
    const planId = sub.subscription_plan_id
    if (!planDistribution[planId]) {
      planDistribution[planId] = {
        count: 0,
        name: sub.subscription_plan?.name || 'Unknown'
      }
    }
    planDistribution[planId].count++
  }

  // Trial conversions
  const trialsStarted = allSubscriptions?.filter(s =>
    s.trial_end && new Date(s.created_at) >= periodStart
  ).length || 0

  const trialsConverted = allSubscriptions?.filter(s =>
    s.trial_end &&
    new Date(s.created_at) >= periodStart &&
    s.status === 'active'
  ).length || 0

  const conversionRate = trialsStarted > 0
    ? (trialsConverted / trialsStarted) * 100
    : 0

  return NextResponse.json({
    total_subscriptions: allSubscriptions?.length || 0,
    status_breakdown: statusCounts,
    new_subscriptions: newSubscriptions,
    canceled_subscriptions: canceledInPeriod,
    churn_rate_percent: Math.round(churnRate * 100) / 100,
    trial_conversion_rate_percent: Math.round(conversionRate * 100) / 100,
    trials_started: trialsStarted,
    trials_converted: trialsConverted,
    plan_distribution: planDistribution,
    period_days: parseInt(period)
  })
}
