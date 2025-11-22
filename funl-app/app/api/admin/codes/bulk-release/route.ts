import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create service role client (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    const body = await request.json()
    const { code_ids } = body

    if (!code_ids || !Array.isArray(code_ids) || code_ids.length === 0) {
      return NextResponse.json({ error: 'No codes selected' }, { status: 400 })
    }

    // Update codes to owned_unassigned status
    const { data: updatedCodes, error: updateError } = await supabase
      .from('reserved_codes')
      .update({
        status: 'owned_unassigned',
        funnel_id: null,
        assigned_at: null,
        updated_at: new Date().toISOString()
      })
      .in('id', code_ids)
      .eq('status', 'assigned') // Only release assigned codes
      .select('id, code, business_id, status')

    if (updateError) {
      console.error('Bulk release error:', updateError)
      return NextResponse.json(
        { error: 'Failed to release codes' },
        { status: 500 }
      )
    }

    // Update user_sticker_inventory
    await supabase
      .from('user_sticker_inventory')
      .update({
        is_used: false,
        used_for_funnel_id: null,
        used_at: null
      })
      .in('reserved_code_id', code_ids)

    // Log allocations for each code
    const allocations = (updatedCodes || []).map(code => ({
      reserved_code_id: code.id,
      action: 'release',
      previous_status: 'assigned',
      new_status: 'owned_unassigned',
      business_id: code.business_id,
      admin_id: null, // Could pass admin ID from auth
      reason: 'Bulk release by admin',
      is_successful: true
    }))

    if (allocations.length > 0) {
      await supabase
        .from('code_allocations')
        .insert(allocations)
    }

    return NextResponse.json({
      success: true,
      released_count: updatedCodes?.length || 0
    })

  } catch (error) {
    console.error('Error in bulk release API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
