import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePDF } from '@/lib/simple-pdf-generator'

export async function POST(request: NextRequest) {
  try {
    const { layoutId, pageSize, data, filename, returnDataURL } = await request.json() as {
      layoutId?: string
      pageSize?: string
      data: any
      filename?: string
      returnDataURL?: boolean
    }

    if (!data) {
      return NextResponse.json(
        { error: 'data is required' },
        { status: 400 }
      )
    }

    // Get Supabase client with server-side auth
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let template
    
    if (layoutId) {
      // Use specific layout ID
      const { data: templateData, error: templateError } = await supabase
        .from('print_layouts')
        .select('*')
        .eq('id', layoutId)
        .eq('is_active', true)
        .single()

      if (templateError || !templateData) {
        console.error('Template error:', templateError)
        return NextResponse.json(
          { error: `Layout not found for ID: ${layoutId}` },
          { status: 404 }
        )
      }
      template = templateData
    } else if (pageSize) {
      // Fallback to pageSize for backward compatibility
      const printType = pageSize.replace(/-/g, '_')
      
      const { data: templateData, error: templateError } = await supabase
        .from('print_layouts')
        .select('*')
        .eq('print_type', printType)
        .eq('is_active', true)
        .eq('is_default', true)
        .single()

      if (templateError || !templateData) {
        console.error('Template error:', templateError)
        return NextResponse.json(
          { error: `No layout found for ${pageSize}` },
          { status: 404 }
        )
      }
      template = templateData
    } else {
      return NextResponse.json(
        { error: 'Either layoutId or pageSize is required' },
        { status: 400 }
      )
    }

    // Generate PDF using the separate module
    const pdfData = await generatePDF({
      pageSize: template.print_type.replace(/_/g, '-'),
      data,
      template
    })

    // If requesting data URL for preview, return as JSON
    if (returnDataURL) {
      // Use Buffer to avoid stack overflow with large arrays
      const base64 = Buffer.from(pdfData).toString('base64')
      const dataURL = `data:application/pdf;base64,${base64}`
      
      return NextResponse.json({ dataURL })
    }

    // Otherwise return PDF as download
    return new NextResponse(pdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'layout.pdf'}"`,
        'Content-Length': pdfData.length.toString(),
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}