import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: businessId } = await params
  try {
    // Require admin authentication
    await requireAdmin()

    // Create admin client with service role for bypassing RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const hasCode = searchParams.get('has_code')

    // Build query
    let query = supabase
      .from('funnels')
      .select(`
        id,
        name,
        status,
        type,
        code_source,
        reserved_code_id,
        short_url,
        created_at,
        updated_at
      `)
      .eq('business_id', businessId)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (hasCode === 'true') {
      query = query.not('reserved_code_id', 'is', null)
    } else if (hasCode === 'false') {
      query = query.is('reserved_code_id', null)
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false })

    const { data: funnels, error } = await query

    if (error) {
      console.error('Error fetching funnels:', error)
      return NextResponse.json(
        { error: 'Failed to fetch funnels' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      funnels: funnels || []
    })

  } catch (error) {
    console.error('Error in funnels API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}