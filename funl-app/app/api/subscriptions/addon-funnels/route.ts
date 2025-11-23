import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/subscriptions/addon-funnels
 * Get current user's addon funnels
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: addonFunnels, error } = await supabase
    .from('subscription_addon_funnels')
    .select('*')
    .eq('business_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching addon funnels:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ addon_funnels: addonFunnels })
}

/**
 * POST /api/subscriptions/addon-funnels
 * Purchase additional funnels
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { quantity, billing_period } = await request.json()

  if (!quantity || quantity < 1) {
    return NextResponse.json(
      { error: 'Quantity must be at least 1' },
      { status: 400 }
    )
  }

  if (!['weekly', 'monthly'].includes(billing_period)) {
    return NextResponse.json(
      { error: 'Invalid billing period. Must be weekly or monthly' },
      { status: 400 }
    )
  }

  // Get current subscription to determine addon pricing
  const { data: currentSub } = await supabase
    .from('subscription_history')
    .select('*, subscription_plan:subscription_plans(*)')
    .eq('business_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!currentSub) {
    return NextResponse.json(
      { error: 'No active subscription found. Please subscribe to a plan first.' },
      { status: 400 }
    )
  }

  const pricePerFunnel =
    billing_period === 'weekly'
      ? currentSub.subscription_plan.addon_funnel_price_weekly
      : currentSub.subscription_plan.addon_funnel_price_monthly

  if (!pricePerFunnel) {
    return NextResponse.json(
      { error: 'Addon funnels not available for this plan' },
      { status: 400 }
    )
  }

  // Create addon funnel record
  const { data: addonFunnel, error } = await supabase
    .from('subscription_addon_funnels')
    .insert({
      business_id: user.id,
      quantity,
      price_per_funnel: pricePerFunnel,
      billing_period,
      is_active: true,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + (billing_period === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating addon funnel:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    addon_funnel: addonFunnel,
    message: `Successfully added ${quantity} funnel${quantity > 1 ? 's' : ''}`,
  })
}
