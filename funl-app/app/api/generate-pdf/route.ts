import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LayoutTemplate, LayoutData, PageSize, LayoutDefinition } from '@/lib/types/layout'
import { LayoutEngine } from '@/lib/layout-engine'
import { PDFGenerator } from '@/lib/pdf-generator'


export async function POST(request: NextRequest) {
  try {
    const { pageSize, data, filename, returnDataURL } = await request.json() as {
      pageSize: PageSize
      data: LayoutData
      filename?: string
      returnDataURL?: boolean
    }

    if (!pageSize || !data) {
      return NextResponse.json(
        { error: 'pageSize and data are required' },
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

    // Convert pageSize format (A4-portrait) to print_type format (A4_portrait)
    const printType = pageSize.replace(/-/g, '_')
    
    // Fetch the layout template from database ONLY - NO FALLBACKS
    const { data: template, error: templateError } = await supabase
      .from('print_layouts')
      .select('*')
      .eq('print_type', printType)
      .eq('is_active', true)
      .eq('is_default', true)
      .single()

    if (templateError) {
      console.error('Database error:', templateError)
      return NextResponse.json(
        { error: `No layout template found for ${pageSize}. Please create one in the database.` },
        { status: 404 }
      )
    }

    if (!template) {
      return NextResponse.json(
        { error: `No layout template found for ${pageSize}. Please create one in the database.` },
        { status: 404 }
      )
    }

    // print_layouts uses 'layout_config' instead of 'layout_definition'
    if (!LayoutEngine.validateLayoutDefinition(template.layout_config)) {
      console.error('Invalid layout definition:', template.layout_config)
      return NextResponse.json(
        { error: `Invalid layout template for ${pageSize}. Please check the database configuration.` },
        { status: 500 }
      )
    }

    const layoutDefinition: LayoutDefinition = template.layout_config

    // Render the layout
    const renderedLayout = LayoutEngine.renderLayout(layoutDefinition, data)

    // Generate PDF
    const pdfData = await PDFGenerator.generatePDF(renderedLayout)

    // If requesting data URL for preview, return as JSON
    if (returnDataURL) {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfData)))
      const dataURL = `data:application/pdf;base64,${base64}`
      
      return NextResponse.json({ dataURL })
    }

    // Otherwise return PDF as download
    return new NextResponse(new Uint8Array(pdfData), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'layout.pdf'}"`,
        'Content-Length': pdfData.length.toString(),
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}