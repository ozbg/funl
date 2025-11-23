import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/funnels/can-create
 * Check if user can create a new funnel based on their subscription limits
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use the can_create_funnel function
  const { data: canCreate, error } = await supabase.rpc('can_create_funnel', {
    p_business_id: user.id,
  })

  if (error) {
    console.error('Error checking funnel limit:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get detailed info for the response
  const { data: business } = await supabase
    .from('businesses')
    .select('funnel_count')
    .eq('id', user.id)
    .single()

  // Get total limit
  const { data: totalLimit } = await supabase.rpc('get_business_funnel_limit', {
    p_business_id: user.id,
  })

  // Get current subscription for plan details
  const { data: currentSub } = await supabase
    .from('subscription_history')
    .select('*, subscription_plan:subscription_plans(*)')
    .eq('business_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    can_create: canCreate,
    current_count: business?.funnel_count || 0,
    limit: totalLimit || 0,
    plan: currentSub?.subscription_plan?.name || 'No plan',
    upgrade_url: '/dashboard/subscription',
  })
}
