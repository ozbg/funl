import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateFunnelSchema } from '@/lib/validations'

// GET /api/funnels/[id] - Get single funnel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data: funnel, error } = await supabase
      .from('funnels')
      .select('*')
      .eq('id', id)
      .eq('business_id', user.id)
      .single()

    if (error || !funnel) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    return NextResponse.json({ data: funnel })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/funnels/[id] - Update funnel
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateFunnelSchema.parse(body)

    // Check if funnel exists and belongs to user
    const { data: existingFunnel, error: fetchError } = await supabase
      .from('funnels')
      .select('*')
      .eq('id', id)
      .eq('business_id', user.id)
      .single()

    if (fetchError || !existingFunnel) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    // Extract property_address and open_house_time from content to top-level fields
    const updateData: Record<string, unknown> = {}
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.type) updateData.type = validatedData.type
    if (validatedData.status) updateData.status = validatedData.status

    if (validatedData.content) {
      const content = { ...existingFunnel.content, ...validatedData.content }
      const property_address = content.property_address as string | undefined
      const open_house_time_raw = content.open_house_time as string | undefined
      // Convert empty string to null for timestamp field
      const open_house_time = open_house_time_raw && open_house_time_raw.trim() !== '' ? open_house_time_raw : null
      delete content.property_address
      delete content.open_house_time

      updateData.content = content
      if (property_address !== undefined) updateData.property_address = property_address
      if (open_house_time !== undefined) updateData.open_house_time = open_house_time
    }

    // Update funnel
    const { data: funnel, error } = await supabase
      .from('funnels')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update funnel' }, { status: 500 })
    }

    return NextResponse.json({ data: funnel })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/funnels/[id] - Update funnel (alias for PATCH)
export async function PUT(
  request: NextRequest,
  params: { params: Promise<{ id: string }> }
) {
  return PATCH(request, params)
}

// DELETE /api/funnels/[id] - Delete funnel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if funnel has assigned codes before deletion
    const { data: assignedCodes, error: codesError } = await supabase
      .from('reserved_codes')
      .select('code, assigned_at')
      .eq('funnel_id', id)
      .eq('business_id', user.id)
      .eq('status', 'assigned')

    if (codesError) {
      console.error('Error checking codes:', codesError)
    }

    // Delete funnel (trigger will automatically release codes to inventory)
    const { error } = await supabase
      .from('funnels')
      .delete()
      .eq('id', id)
      .eq('business_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        error: 'Failed to delete funnel',
        details: error.message
      }, { status: 500 })
    }

    const codesReleased = assignedCodes?.length || 0

    return NextResponse.json({
      success: true,
      codes_released: codesReleased,
      message: codesReleased > 0
        ? `Funnel deleted. ${codesReleased} QR code${codesReleased > 1 ? 's' : ''} returned to your inventory for reassignment.`
        : 'Funnel deleted successfully.'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}