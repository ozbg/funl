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

    let shortId: string
    let shortUrl: string
    let qrCodeSVG: string
    let reservedCodeId: string | null = null

    // Handle reserved codes vs generated codes
    if (validatedData.code_source === 'reserved' && validatedData.reserved_code_id) {
      try {
        // Allocate the reserved code to this funnel (we'll create funnel first, then update)
        const { data: reservedCode } = await supabase
          .from('reserved_codes')
          .select('code, base_qr_svg, status, business_id')
          .eq('id', validatedData.reserved_code_id)
          .single()

        if (!reservedCode) {
          return NextResponse.json({ error: 'Reserved code not found' }, { status: 404 })
        }

        // Verify the code is available or belongs to the user
        if (reservedCode.status !== 'available' && reservedCode.business_id !== user.id) {
          return NextResponse.json({ error: 'Reserved code not available' }, { status: 409 })
        }

        shortId = reservedCode.code
        shortUrl = generateShortUrl(shortId)
        qrCodeSVG = reservedCode.base_qr_svg || ''
        reservedCodeId = validatedData.reserved_code_id

        console.log('Using reserved code:', shortId)
      } catch (error) {
        console.error('Error handling reserved code:', error)
        return NextResponse.json({ error: 'Failed to allocate reserved code' }, { status: 500 })
      }
    } else {
      // Generate new code (existing behavior)
      shortId = generateShortId()
      shortUrl = generateShortUrl(shortId)

      console.log('Generated short URL:', shortUrl)

      // Generate QR code SVG
      try {
        qrCodeSVG = await generateQRCodeSVG(shortUrl, qrOptions)
        console.log('QR code SVG generated successfully, length:', qrCodeSVG.length)
      } catch (qrError) {
        console.error('Error generating QR code:', qrError)
        throw new Error('Failed to generate QR code')
      }
    }

    // Extract property_address and open_house_time from content to top-level fields
    const content = { ...(validatedData.content || {}) }
    const property_address = content.property_address as string | undefined
    const open_house_time_raw = content.open_house_time as string | undefined
    // Convert empty string to null for timestamp field
    const open_house_time = open_house_time_raw && open_house_time_raw.trim() !== '' ? open_house_time_raw : null
    delete content.property_address
    delete content.open_house_time

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
        content,
        property_address,
        open_house_time,
        qr_code_url: qrCodeSVG, // Store SVG directly as text
        status: 'draft',
        code_source: validatedData.code_source || 'generated',
        reserved_code_id: reservedCodeId,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create funnel' }, { status: 500 })
    }

    // If using reserved code, update the code status to assigned
    if (validatedData.code_source === 'reserved' && reservedCodeId) {
      try {
        // Update reserved code to assigned status
        await supabase
          .from('reserved_codes')
          .update({
            status: 'assigned',
            funnel_id: funnel.id,
            business_id: user.id,
            assigned_at: new Date()
          })
          .eq('id', reservedCodeId)
          .eq('status', 'available') // Only update if still available

        console.log('Reserved code assigned to funnel:', funnel.id)
      } catch (error) {
        console.error('Error assigning reserved code:', error)
        // Don't fail the funnel creation, but log the issue
      }
    }

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