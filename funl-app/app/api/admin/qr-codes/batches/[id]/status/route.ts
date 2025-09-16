import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'
import { BatchGenerationService } from '@/lib/services/batch-generation'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const validStatuses = ['generated', 'exporting', 'printing', 'printed', 'shipped', 'received', 'active', 'depleted']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = await createClient()
    const batchService = new BatchGenerationService(supabase)

    // Await the params
    const { id } = await params

    const success = await batchService.updateBatchStatus(id, status)

    if (!success) {
      return NextResponse.json({ error: 'Failed to update batch status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating batch status:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}