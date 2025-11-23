import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/subscriptions/addon-funnels/[id]/cancel
 * Cancel addon funnels (won't renew at end of period)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: addonFunnel } = await supabase
    .from('subscription_addon_funnels')
    .select('*')
    .eq('id', id)
    .eq('business_id', user.id)
    .single()

  if (!addonFunnel) {
    return NextResponse.json({ error: 'Addon funnel not found' }, { status: 404 })
  }

  // Mark for cancellation at period end
  const { data: updated, error } = await supabase
    .from('subscription_addon_funnels')
    .update({
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error canceling addon funnel:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    addon_funnel: updated,
    message: 'Addon funnel will be canceled at the end of the current period',
  })
}
