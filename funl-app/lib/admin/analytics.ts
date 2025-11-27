import { createServiceClient } from '@/lib/supabase/server'

/**
 * Get revenue analytics including MRR, ARR, growth metrics
 */
export async function getRevenueAnalytics(periodDays: number = 30) {
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
  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - periodDays)

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

  return {
    mrr: Math.round(mrr),
    arr: Math.round(arr),
    mrr_growth_percent: Math.round(mrrGrowth * 100) / 100,
    total_revenue: totalRevenue,
    monthly_revenue: monthRevenue,
    weekly_recurring_revenue: Math.round(weeklyRevenue),
    active_subscriptions: activeSubscriptions?.length || 0,
    period_days: periodDays
  }
}

/**
 * Get subscription analytics including churn, retention, plan distribution
 */
export async function getSubscriptionAnalytics(periodDays: number = 30) {
  const serviceClient = await createServiceClient()

  // Get all subscriptions
  const { data: allSubscriptions } = await serviceClient
    .from('subscription_history')
    .select(`
      *,
      subscription_plan:subscription_plans(*)
    `)

  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - periodDays)

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

  return {
    total_subscriptions: allSubscriptions?.length || 0,
    status_breakdown: statusCounts,
    new_subscriptions: newSubscriptions,
    canceled_subscriptions: canceledInPeriod,
    churn_rate_percent: Math.round(churnRate * 100) / 100,
    trial_conversion_rate_percent: Math.round(conversionRate * 100) / 100,
    trials_started: trialsStarted,
    trials_converted: trialsConverted,
    plan_distribution: planDistribution,
    period_days: periodDays
  }
}

/**
 * Get all subscriptions with stats (for admin subscription management page)
 */
export async function getSubscriptionsWithStats() {
  const serviceClient = await createServiceClient()

  // Get latest subscription for each business
  const { data: allSubscriptions } = await serviceClient
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
    `)
    .order('created_at', { ascending: false })

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

  return { subscriptions, stats }
}

/**
 * Get all subscription plans with stats
 */
export async function getPlansWithStats() {
  const serviceClient = await createServiceClient()

  const { data: plans } = await serviceClient
    .from('subscription_plans')
    .select('*')
    .is('deleted_at', null)
    .order('display_order', { ascending: true })

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

  return { plans: plansWithStats, stats }
}

/**
 * Get all products with inventory stats
 */
export async function getProductsWithStats() {
  const serviceClient = await createServiceClient()

  const { data: products } = await serviceClient
    .from('sellable_products')
    .select('*')
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  // Fetch inventory stats for products that track inventory
  const productsWithInventory = await Promise.all(
    (products || []).map(async (product) => {
      if (!product.tracks_inventory) {
        return {
          ...product,
          inventory_allocated: 0,
          inventory_remaining: 0,
          batches_linked: 0
        }
      }

      const { data: inventoryStats } = await serviceClient
        .from('product_batch_inventory')
        .select('quantity_allocated, quantity_remaining')
        .eq('product_id', product.id)
        .eq('is_active', true)

      const totalAllocated = inventoryStats?.reduce((sum, inv) => sum + (inv.quantity_allocated || 0), 0) || 0
      const totalRemaining = inventoryStats?.reduce((sum, inv) => sum + (inv.quantity_remaining || 0), 0) || 0

      return {
        ...product,
        inventory_allocated: totalAllocated,
        inventory_remaining: totalRemaining,
        batches_linked: inventoryStats?.length || 0
      }
    })
  )

  // Get deleted products count
  const { count: deletedCount } = await serviceClient
    .from('sellable_products')
    .select('*', { count: 'exact', head: true })
    .not('deleted_at', 'is', null)

  // Calculate stats
  const stats = {
    total_products: productsWithInventory.length,
    active_products: productsWithInventory.filter(p => p.is_active).length,
    inactive_products: productsWithInventory.filter(p => !p.is_active).length,
    deleted_products: deletedCount || 0,
    low_stock_count: productsWithInventory.filter(p =>
      p.tracks_inventory &&
      p.current_stock !== null &&
      p.current_stock <= 10
    ).length
  }

  return { products: productsWithInventory, stats }
}
