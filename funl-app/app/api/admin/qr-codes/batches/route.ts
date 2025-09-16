import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'
import { BatchGenerationService } from '@/lib/services/batch-generation'
import { generateBatchSchema } from '@/lib/types/qr-reservation'

export async function GET() {
  try {
    await requireAdmin()

    const supabase = await createClient()
    const batchService = new BatchGenerationService(supabase)

    const batches = await batchService.listBatches()

    return NextResponse.json({ batches })
  } catch (error) {
    console.error('Error fetching batches:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()

    const body = await request.json()

    // Validate request body
    const validationResult = generateBatchSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const batchService = new BatchGenerationService(supabase)

    // Add created_by admin ID
    const batchData = {
      ...validationResult.data,
      created_by: admin.admin.id
    }

    const result = await batchService.generateBatch(batchData)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error generating batch:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate batch' },
      { status: 500 }
    )
  }
}