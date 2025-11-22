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
    const { code_ids, business_id, funnel_id } = body

    if (!code_ids || !Array.isArray(code_ids) || code_ids.length === 0) {
      return NextResponse.json({ error: 'No codes selected' }, { status: 400 })
    }

    if (!business_id) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    // Verify business exists
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, email')
      .eq('id', business_id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // If funnel_id provided, verify it belongs to the business
    if (funnel_id) {
      const { data: funnel, error: funnelError } = await supabase
        .from('funnels')
        .select('id, name')
        .eq('id', funnel_id)
        .eq('business_id', business_id)
        .single()

      if (funnelError || !funnel) {
        return NextResponse.json({ error: 'Funnel not found or not owned by business' }, { status: 404 })
      }
    }

    // Update codes
    const updateData: {
      status: string
      business_id: string
      updated_at: string
      funnel_id?: string
      assigned_at?: string
    } = {
      status: funnel_id ? 'assigned' : 'owned_unassigned',
      business_id,
      updated_at: new Date().toISOString()
    }

    if (funnel_id) {
      updateData.funnel_id = funnel_id
      updateData.assigned_at = new Date().toISOString()
    }

    const { data: updatedCodes, error: updateError } = await supabase
      .from('reserved_codes')
      .update(updateData)
      .in('id', code_ids)
      .eq('status', 'available') // Only assign available codes
      .select('id, code')

    if (updateError) {
      console.error('Bulk assign error:', updateError)
      return NextResponse.json(
        { error: 'Failed to assign codes' },
        { status: 500 }
      )
    }

    // Create user inventory records
    const inventoryRecords = (updatedCodes || []).map(code => ({
      business_id,
      reserved_code_id: code.id,
      acquired_via: 'admin_assignment',
      is_used: !!funnel_id,
      used_for_funnel_id: funnel_id || null,
      used_at: funnel_id ? new Date().toISOString() : null
    }))

    if (inventoryRecords.length > 0) {
      await supabase
        .from('user_sticker_inventory')
        .insert(inventoryRecords)
    }

    // Log allocations
    const allocations = (updatedCodes || []).map(code => ({
      reserved_code_id: code.id,
      action: 'assign',
      previous_status: 'available',
      new_status: funnel_id ? 'assigned' : 'owned_unassigned',
      business_id,
      funnel_id: funnel_id || null,
      admin_id: null, // Could pass admin ID from auth
      reason: `Bulk assignment by admin to ${business.name}`,
      is_successful: true
    }))

    if (allocations.length > 0) {
      await supabase
        .from('code_allocations')
        .insert(allocations)
    }

    return NextResponse.json({
      success: true,
      assigned_count: updatedCodes?.length || 0,
      business: business.name
    })

  } catch (error) {
    console.error('Error in bulk assign API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
