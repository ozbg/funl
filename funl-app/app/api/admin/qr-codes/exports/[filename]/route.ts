import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    await requireAdmin()

    const { filename } = await params

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // In a real implementation, you'd fetch from cloud storage
    // For now, we'll simulate serving from a temp directory
    const exportsDir = join(process.cwd(), 'temp', 'exports')
    const filePath = join(exportsDir, filename)

    try {
      const fileBuffer = await readFile(filePath)

      return new NextResponse(fileBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileBuffer.length.toString()
        }
      })
    } catch (fileError) {
      console.error('Error reading export file:', fileError)
      return NextResponse.json(
        { error: 'Export file not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error serving export file:', error)
    return NextResponse.json(
      { error: 'Failed to serve export file' },
      { status: 500 }
    )
  }
}