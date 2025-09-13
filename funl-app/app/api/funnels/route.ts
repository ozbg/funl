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

    // Use default QR options since QR styling is managed elsewhere
    const qrOptions: {
      width: number
      style: 'square' | 'rounded' | 'dots' | 'dots-rounded' | 'classy' | 'classy-rounded' | 'extra-rounded'
      darkColor?: string
      lightColor?: string
    } = { width: 400, style: 'square' as const }

    // Find funnel type to get the ID
    let funnel_type_id = null
    if (validatedData.type) {
      try {
        const { data: funnelType, error: typeError } = await supabase
          .from('funnel_types')
          .select('id')
          .eq('slug', validatedData.type)
          .single()

        if (typeError) {
          console.error('Error fetching funnel type:', typeError)
        }

        if (funnelType) {
          funnel_type_id = funnelType.id
        } else {
          console.warn('No funnel type found for slug:', validatedData.type)
        }
      } catch (error) {
        console.error('Error looking up funnel type:', error)
      }
    }

    // Generate short ID and URL
    const shortId = generateShortId()
    const shortUrl = generateShortUrl(shortId)

    console.log('Generated short URL:', shortUrl)

    // Generate QR code SVG
    let qrCodeSVG: string
    try {
      qrCodeSVG = await generateQRCodeSVG(shortUrl, qrOptions)
      console.log('QR code SVG generated successfully, length:', qrCodeSVG.length)
    } catch (qrError) {
      console.error('Error generating QR code:', qrError)
      throw new Error('Failed to generate QR code')
    }

    // Create funnel in database
    const { data: funnel, error } = await supabase
      .from('funnels')
      .insert({
        business_id: user.id,
        name: validatedData.name,
        type: validatedData.type,
        funnel_type_id,
        qr_preset_id: null,
        short_url: shortId, // Store just the short ID
        content: validatedData.content || {},
        qr_code_url: qrCodeSVG, // Store SVG directly as text
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