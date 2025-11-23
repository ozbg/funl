import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/subscriptions/current
 * Get current user's active subscription
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get current subscription from subscription_history
  const { data: subscription, error } = await supabase
    .from('subscription_history')
    .select(`
      *,
      subscription_plan:subscription_plans(*)
    `)
    .eq('business_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get addon funnels
  const { data: addonFunnels, error: addonError } = await supabase
    .from('subscription_addon_funnels')
    .select('*')
    .eq('business_id', user.id)
    .eq('is_active', true)
    .eq('cancel_at_period_end', false)

  if (addonError) {
    console.error('Error fetching addon funnels:', addonError)
  }

  // Get business funnel count
  const { data: business } = await supabase
    .from('businesses')
    .select('funnel_count')
    .eq('id', user.id)
    .single()

  // Calculate total funnel limit
  const planLimit = subscription?.subscription_plan?.funnel_limit || 0
  const addonLimit = addonFunnels?.reduce((sum, addon) => sum + addon.quantity, 0) || 0
  const totalLimit = planLimit + addonLimit

  return NextResponse.json({
    subscription: subscription || null,
    addon_funnels: addonFunnels || [],
    funnel_usage: {
      current: business?.funnel_count || 0,
      limit: totalLimit,
      plan_limit: planLimit,
      addon_limit: addonLimit,
      can_create: (business?.funnel_count || 0) < totalLimit
    }
  })
}
