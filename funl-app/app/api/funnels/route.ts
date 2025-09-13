import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateFunnelSchema } from '@/lib/validations'
import { generateShortId, generateShortUrl, generateQRCodeSVG } from '@/lib/qr'

// GET /api/funnels - List user's funnels
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: funnels, error } = await supabase
      .from('funnels')
      .select('*')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch funnels' }, { status: 500 })
    }

    return NextResponse.json({ data: funnels })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/funnels - Create new funnel
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateFunnelSchema.parse(body)
    const { qr_preset_id } = body

    // Fetch QR preset if provided
    let qrOptions: any = { width: 400, style: 'square' as const }
    if (qr_preset_id) {
      const { data: qrPreset } = await supabase
        .from('qr_code_presets')
        .select('style_config')
        .eq('id', qr_preset_id)
        .single()
      
      if (qrPreset?.style_config) {
        qrOptions = {
          width: 400,
          style_config: qrPreset.style_config
        }
      }
    }

    // Find funnel type to get the ID
    let funnel_type_id = null
    if (validatedData.type) {
      const { data: funnelType } = await supabase
        .from('funnel_types')
        .select('id')
        .eq('slug', validatedData.type)
        .single()
      
      if (funnelType) {
        funnel_type_id = funnelType.id
      }
    }

    // Generate short ID and URL
    const shortId = generateShortId()
    const shortUrl = generateShortUrl(shortId)
    
    // Generate QR code SVG and convert to data URL
    const qrCodeSVG = await generateQRCodeSVG(shortUrl, qrOptions)
    const qrCodeDataUrl = `data:image/svg+xml;base64,${Buffer.from(qrCodeSVG).toString('base64')}`

    // Create funnel in database
    const { data: funnel, error } = await supabase
      .from('funnels')
      .insert({
        business_id: user.id,
        name: validatedData.name,
        type: validatedData.type,
        funnel_type_id,
        qr_preset_id: qr_preset_id || null,
        short_url: shortId, // Store just the short ID
        content: validatedData.content || {},
        qr_code_url: qrCodeDataUrl, // Store SVG as base64 data URL
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create funnel' }, { status: 500 })
    }

    return NextResponse.json({ data: funnel }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}