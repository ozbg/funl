import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { AllocationService, AllocationError } from '@/lib/services/code-allocation'
import { allocateCodeSchema } from '@/lib/types/qr-reservation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validationResult = allocateCodeSchema.safeParse({
      ...body,
      businessId: user.id // Set businessId from authenticated user
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    // Verify funnel belongs to user
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, business_id')
      .eq('id', validationResult.data.funnelId)
      .eq('business_id', user.id)
      .single()

    if (funnelError || !funnel) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 403 }
      )
    }

    const allocationService = new AllocationService(supabase)
    const allocatedCode = await allocationService.allocateCode(validationResult.data)

    return NextResponse.json(allocatedCode, { status: 201 })
  } catch (error) {
    console.error('Error allocating code:', error)

    if (error instanceof AllocationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // Conflict status for race conditions
      )
    }

    return NextResponse.json(
      { error: 'Failed to allocate code' },
      { status: 500 }
    )
  }
}