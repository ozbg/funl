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
    const { searchParams } = new URL(request.url)

    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({
        businesses: []
      })
    }

    // Search businesses by name or email
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        email,
        type,
        created_at
      `)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error searching businesses:', error)
      return NextResponse.json(
        { error: 'Failed to search businesses' },
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
    console.error('Error in business search API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}