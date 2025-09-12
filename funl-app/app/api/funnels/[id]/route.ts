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

    // Update funnel
    const { data: funnel, error } = await supabase
      .from('funnels')
      .update({
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.type && { type: validatedData.type }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.print_size && { print_size: validatedData.print_size }),
        ...(validatedData.content && { 
          content: { ...existingFunnel.content, ...validatedData.content }
        }),
      })
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
    const { error } = await supabase
      .from('funnels')
      .delete()
      .eq('id', id)
      .eq('business_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete funnel' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}