import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRevenueAnalytics } from '@/lib/admin/analytics'

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
  const period = parseInt(searchParams.get('period') || '30')

  const data = await getRevenueAnalytics(period)
  return NextResponse.json(data)
}
