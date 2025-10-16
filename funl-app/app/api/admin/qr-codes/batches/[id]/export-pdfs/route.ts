import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'
import { PDFExportService } from '@/lib/services/pdf-export'
import { pdfExportSizeSchema, type PDFExportRequest } from '@/lib/types/qr-reservation'
import { z } from 'zod'

const exportRequestSchema = z.object({
  size: z.enum(['25mm', '50mm', '75mm', '100mm', '150mm', '200mm']),
  customWidth: z.number().optional(),
  customHeight: z.number().optional(),
  textSize: z.enum(['tiny', 'small', 'medium', 'custom']),
  customTextSize: z.number().optional(),
  includeIdText: z.boolean().default(true),
  overrideStylePresetId: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const supabase = await createClient()
    const pdfService = new PDFExportService(supabase)

    // Await the params
    const { id: batchId } = await params

    // Parse request body
    const body = await request.json()
    const validatedData = exportRequestSchema.parse(body)

    // Create export request
    const exportRequest: PDFExportRequest = {
      batchId,
      ...validatedData
    }

    // Generate PDFs
    const result = await pdfService.exportBatchAsPDFs(exportRequest)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error exporting batch as PDFs:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error message:', error instanceof Error ? error.message : String(error))

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to export batch as PDFs',
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Progress endpoint for tracking export progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const exportId = searchParams.get('exportId')

    if (!exportId) {
      return NextResponse.json(
        { error: 'exportId parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const pdfService = new PDFExportService(supabase)

    const progress = await pdfService.getExportProgress(exportId)

    if (!progress) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Error fetching export progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch export progress' },
      { status: 500 }
    )
  }
}