import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin()

    // Create admin client with service role for bypassing RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // Get businesses that have been recently active (have funnels or recent assignments)
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        email,
        type,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recent businesses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recent businesses' },
        { status: 500 }
      )
    }

    // Add funnel count to each business
    const businessesWithCounts = await Promise.all(
      (businesses || []).map(async (business) => {
        const { count } = await supabase
          .from('funnels')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', business.id)

        return {
          ...business,
          funnel_count: count || 0
        }
      })
    )

    return NextResponse.json({
      businesses: businessesWithCounts
    })

  } catch (error) {
    console.error('Error in recent businesses API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}