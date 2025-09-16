import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'
import { BatchGenerationService } from '@/lib/services/batch-generation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const supabase = await createClient()
    const batchService = new BatchGenerationService(supabase)

    // Await the params
    const { id } = await params

    // Get batch details
    const batch = await batchService.getBatch(id)
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Get codes from batch
    const codes = await batchService.getCodesFromBatch(id)

    // Create CSV content
    const csvHeaders = 'Code,URL,Status,Created At\n'
    const csvRows = codes.map(code =>
      `${code.code},${process.env.NEXT_PUBLIC_APP_URL}/f/${code.code},${code.status},${code.created_at}`
    ).join('\n')

    const csvContent = csvHeaders + csvRows

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${batch.batch_number}-codes.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting batch:', error)
    return NextResponse.json({ error: 'Failed to export batch' }, { status: 500 })
  }
}