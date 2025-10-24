import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/my-stickers - Get all user's QR codes with assignment history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get filter from query params
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') // 'all', 'assigned', 'owned_unassigned', 'damaged', 'lost'

    // First, get ALL codes to calculate correct stats
    const { data: allCodes, error: allCodesError } = await supabase
      .from('reserved_codes')
      .select('id, status')
      .eq('business_id', user.id)

    if (allCodesError) {
      console.error('Error fetching all codes for stats:', allCodesError)
      return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 })
    }

    // Calculate stats from ALL codes (not filtered)
    const stats = {
      total: allCodes?.length || 0,
      assigned: allCodes?.filter(c => c.status === 'assigned').length || 0,
      available: allCodes?.filter(c => c.status === 'owned_unassigned').length || 0,
      damaged: allCodes?.filter(c => c.status === 'damaged').length || 0,
      lost: allCodes?.filter(c => c.status === 'lost').length || 0
    }

    // Build query for filtered codes with full details including batch asset info
    let query = supabase
      .from('reserved_codes')
      .select(`
        id,
        code,
        status,
        business_id,
        funnel_id,
        batch_id,
        assigned_at,
        purchased_at,
        purchase_price,
        created_at,
        updated_at,
        funnels:funnel_id (
          id,
          name,
          type,
          status
        ),
        batch:batch_id (
          asset_type,
          asset_metadata
        )
      `)
      .eq('business_id', user.id)
      .order('updated_at', { ascending: false })

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: codes, error: codesError } = await query

    if (codesError) {
      console.error('Error fetching codes:', codesError)
      return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 })
    }

    // For each code, fetch its allocation history
    const codesWithHistory = await Promise.all(
      (codes || []).map(async (code) => {
        const { data: history, error: historyError } = await supabase
          .from('code_allocations')
          .select(`
            id,
            action,
            previous_status,
            new_status,
            reason,
            created_at,
            metadata
          `)
          .eq('reserved_code_id', code.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (historyError) {
          console.error('Error fetching history for code:', code.code, historyError)
        }

        return {
          ...code,
          history: history || []
        }
      })
    )

    return NextResponse.json({
      codes: codesWithHistory,
      stats
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
