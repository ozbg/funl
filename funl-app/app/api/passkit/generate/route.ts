/**
 * PassKit Generation API
 *
 * POST /api/passkit/generate
 * Generates an Apple Wallet pass for a given funnel
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePassForFunnel, validateFunnelForPassGeneration } from '@/lib/passkit'
import { PassGenerationRequestSchema } from '@/lib/validations'
import type { Database } from '@/lib/database.types'
import type { Funnel, Business } from '@/lib/types'

type FunnelWithBusiness = Database['public']['Tables']['funnels']['Row'] & {
  business: Database['public']['Tables']['businesses']['Row']
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = PassGenerationRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { funnelId, customization, forceRegenerate } = validationResult.data

    // Fetch funnel with business data
    const { data: funnelData, error: funnelError } = await supabase
      .from('funnels')
      .select(`
        *,
        business:businesses(*)
      `)
      .eq('id', funnelId)
      .eq('business_id', user.id)
      .single()

    if (funnelError || !funnelData) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 404 }
      )
    }

    const funnel = funnelData as unknown as FunnelWithBusiness
    const business = funnel.business

    // Validate funnel and business data for pass generation
    const validation = validateFunnelForPassGeneration(funnel as Funnel, business as unknown as Business)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Funnel validation failed',
          details: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      )
    }

    // Check if pass generation is enabled for this funnel
    if (!funnel.wallet_pass_enabled && !forceRegenerate) {
      return NextResponse.json(
        { error: 'Wallet pass generation is not enabled for this funnel' },
        { status: 400 }
      )
    }

    // Check if pass already exists and force regeneration is not requested
    if (funnel.wallet_pass_last_updated && !forceRegenerate) {
      const { data: existingInstance } = await supabase
        .from('wallet_pass_instances')
        .select('*')
        .eq('funnel_id', funnelId)
        .eq('status', 'active')
        .single()

      if (existingInstance) {
        return NextResponse.json(
          {
            success: true,
            passUrl: `/api/passkit/passes/${existingInstance.serial_number}.pkpass`,
            serialNumber: existingInstance.serial_number,
            message: 'Pass already exists. Use forceRegenerate=true to create a new version.'
          }
        )
      }
    }

    // Generate the pass
    const passResult = await generatePassForFunnel(
      funnel as Funnel,
      business as unknown as Business,
      customization
    )

    if (!passResult.success) {
      return NextResponse.json(
        {
          error: 'Pass generation failed',
          details: passResult.error
        },
        { status: 500 }
      )
    }

    // Store pass instance in database
    const { error: insertError } = await supabase
      .from('wallet_pass_instances')
      .insert({
        funnel_id: funnelId,
        business_id: user.id,
        serial_number: passResult.serialNumber!,
        pass_type_identifier: process.env.APPLE_PASS_TYPE_IDENTIFIER || 'pass.com.funl.property',
        authentication_token: crypto.randomUUID(),
        download_count: 0,
        status: 'active',
        update_tag: '1'
      })

    if (insertError) {
      console.error('Failed to store pass instance:', insertError)
      // Continue anyway - pass was generated successfully
    }

    // Update funnel with pass information
    const { error: updateError } = await supabase
      .from('funnels')
      .update({
        wallet_pass_last_updated: new Date().toISOString(),
        wallet_pass_download_count: 0
      })
      .eq('id', funnelId)

    if (updateError) {
      console.error('Failed to update funnel:', updateError)
    }

    // Log analytics event
    await supabase
      .from('wallet_pass_analytics')
      .insert({
        funnel_id: funnelId,
        event_type: 'download_requested',
        session_id: crypto.randomUUID(),
        user_agent: request.headers.get('user-agent') || '',
        ip_address: (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'),
        metadata: {
          customization: !!customization,
          force_regenerate: !!forceRegenerate
        }
      })

    return NextResponse.json({
      success: true,
      passUrl: passResult.passUrl,
      serialNumber: passResult.serialNumber,
      message: 'Pass generated successfully'
    })

  } catch (error) {
    console.error('PassKit generation error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint - PUBLIC ACCESS for generating passes from funnel pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const funnelId = searchParams.get('funnelId')

    if (!funnelId) {
      return NextResponse.json(
        { error: 'funnelId parameter is required' },
        { status: 400 }
      )
    }

    // Use service key to bypass RLS for public access
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // Fetch funnel (PUBLIC ACCESS - no auth required)
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('*')
      .eq('id', funnelId)
      .eq('status', 'active')
      .single()

    if (funnelError || !funnel) {
      return NextResponse.json(
        { error: 'Funnel not found or not active' },
        { status: 404 }
      )
    }

    // Fetch business data separately
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', funnel.business_id)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Check if wallet pass is enabled
    if (!funnel.wallet_pass_enabled) {
      return NextResponse.json(
        { error: 'Wallet pass is not enabled for this funnel' },
        { status: 400 }
      )
    }

    // Validate funnel data
    const validation = validateFunnelForPassGeneration(funnel as Funnel, business as Business)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Funnel validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Generate the pass
    console.log('Generating pass for funnel:', funnel.id)
    const passResult = await generatePassForFunnel(
      funnel as Funnel,
      business as Business
    )

    console.log('Pass generation result:', { success: passResult.success, error: passResult.error })

    if (!passResult.success || !passResult.passBuffer) {
      console.error('Pass generation failed:', passResult.error)
      return NextResponse.json(
        {
          error: 'Pass generation failed',
          details: passResult.error
        },
        { status: 500 }
      )
    }

    // Store pass instance in database
    const serialNumber = passResult.serialNumber || crypto.randomUUID()
    const { error: insertError } = await supabase
      .from('wallet_pass_instances')
      .insert({
        funnel_id: funnelId,
        business_id: funnel.business_id,
        serial_number: serialNumber,
        pass_type_identifier: process.env.APPLE_PASS_TYPE_IDENTIFIER || 'pass.au.funl.wallet',
        authentication_token: crypto.randomUUID(),
        download_count: 1,
        status: 'active',
        update_tag: '1'
      })

    if (insertError) {
      console.error('Failed to store pass instance:', insertError)
    }

    // Log analytics
    await supabase
      .from('wallet_pass_analytics')
      .insert({
        funnel_id: funnelId,
        event_type: 'download_requested',
        session_id: crypto.randomUUID(),
        user_agent: request.headers.get('user-agent') || '',
        ip_address: (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'),
        metadata: { public_download: true }
      })

    // Return the .pkpass file
    console.log('Returning pass buffer, size:', passResult.passBuffer?.length)

    if (!passResult.passBuffer || passResult.passBuffer.length === 0) {
      console.error('Pass buffer is empty!')
      return NextResponse.json(
        { error: 'Pass generation succeeded but buffer is empty' },
        { status: 500 }
      )
    }

    return new NextResponse(passResult.passBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${funnel.name.replace(/[^a-z0-9]/gi, '_')}.pkpass"`,
        'Content-Length': passResult.passBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('PassKit generation error:', error)

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}