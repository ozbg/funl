import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { AllocationService } from '@/lib/services/code-allocation'
import { reserveCodeSchema } from '@/lib/types/qr-reservation'

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
    const validationResult = reserveCodeSchema.safeParse({
      ...body,
      businessId: user.id // Set businessId from authenticated user
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const allocationService = new AllocationService(supabase)
    const reservation = await allocationService.reserveCode(validationResult.data)

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error('Error reserving code:', error)

    if (error instanceof Error && error.message.includes('No available codes')) {
      return NextResponse.json(
        { error: 'No available codes matching your criteria' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to reserve code' },
      { status: 500 }
    )
  }
}