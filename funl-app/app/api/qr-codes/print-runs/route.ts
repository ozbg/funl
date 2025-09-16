import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PrintRunService } from '@/lib/services/print-run'
import { createPrintRunSchema } from '@/lib/types/qr-reservation'

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
    const validationResult = createPrintRunSchema.safeParse({
      ...body,
      businessId: user.id // Set businessId from authenticated user
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    // Verify reserved code belongs to user
    const { data: reservedCode, error: codeError } = await supabase
      .from('reserved_codes')
      .select('id, business_id, status')
      .eq('id', validationResult.data.reservedCodeId)
      .single()

    if (codeError || !reservedCode) {
      return NextResponse.json(
        { error: 'Reserved code not found' },
        { status: 404 }
      )
    }

    if (reservedCode.business_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied to reserved code' },
        { status: 403 }
      )
    }

    if (reservedCode.status !== 'assigned') {
      return NextResponse.json(
        { error: 'Code must be assigned to a funnel before printing' },
        { status: 400 }
      )
    }

    const printRunService = new PrintRunService(supabase)
    const result = await printRunService.createPrintRuns(validationResult.data)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating print run:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create print run' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const printRunService = new PrintRunService(supabase)
    const printRuns = await printRunService.getBusinessPrintRuns(user.id)

    return NextResponse.json({ printRuns })
  } catch (error) {
    console.error('Error fetching print runs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch print runs' },
      { status: 500 }
    )
  }
}