import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/plans/[id]/customers
 * List all customers on a specific subscription plan
 *
 * Returns:
 * - Plan details
 * - List of customers currently on this plan
 * - Total count and MRR
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await context.params
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

  const serviceClient = await createServiceClient()

  // Get plan details
  const { data: plan, error: planError } = await serviceClient
    .from('subscription_plans')
    .select('id, name, slug, price_monthly, price_weekly')
    .eq('id', planId)
    .single()

  if (planError || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Get all current subscriptions for this plan
  // We need to get the latest subscription_history for each business
  const { data: subscriptions, error: subscriptionsError } = await serviceClient
    .from('subscription_history')
    .select(`
      id,
      business_id,
      status,
      billing_period,
      created_at,
      current_period_start,
      current_period_end,
      trial_end,
      business:businesses(
        id,
        name,
        email
      )
    `)
    .eq('subscription_plan_id', planId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })

  if (subscriptionsError) {
    console.error('Error fetching subscriptions:', subscriptionsError)
    return NextResponse.json({ error: subscriptionsError.message }, { status: 500 })
  }

  // Filter to only the latest subscription per business
  const businessMap = new Map()
  subscriptions?.forEach((sub) => {
    if (!businessMap.has(sub.business_id)) {
      businessMap.set(sub.business_id, sub)
    }
  })

  const latestSubscriptions = Array.from(businessMap.values())

  // Format customer data
  const customers = latestSubscriptions.map((sub) => ({
    business_id: sub.business_id,
    business_name: sub.business?.name || 'Unknown',
    email: sub.business?.email || '',
    subscription_status: sub.status,
    billing_period: sub.billing_period,
    started_at: sub.created_at,
    current_period_end: sub.current_period_end,
    trial_end: sub.trial_end,
  }))

  // Calculate MRR for this plan
  let mrr = 0
  latestSubscriptions.forEach((sub) => {
    if (sub.status === 'active') {
      if (sub.billing_period === 'monthly') {
        mrr += plan.price_monthly
      } else if (sub.billing_period === 'weekly') {
        // Convert weekly to monthly: weekly * 52 weeks / 12 months
        mrr += (plan.price_weekly * 52) / 12
      }
    }
  })

  return NextResponse.json({
    plan: {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
    },
    customers,
    total: customers.length,
    mrr: Math.round(mrr * 100) / 100, // Round to 2 decimal places
  })
}
