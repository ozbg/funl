import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/subscriptions/plans
 * Fetch all active subscription plans
 */
export async function GET() {
  const supabase = await createClient()

  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ plans })
}
