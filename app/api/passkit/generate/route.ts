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
          details: validationResult.error.errors
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
    const validation = validateFunnelForPassGeneration(funnel as Funnel, business as Business)
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
      business as Business,
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
        ip_address: request.ip || '',
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

// GET endpoint to check pass generation status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const funnelId = searchParams.get('funnelId')

    if (!funnelId) {
      return NextResponse.json(
        { error: 'funnelId parameter is required' },
        { status: 400 }
      )
    }

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check funnel ownership
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, wallet_pass_enabled, wallet_pass_last_updated, wallet_pass_download_count')
      .eq('id', funnelId)
      .eq('business_id', user.id)
      .single()

    if (funnelError || !funnel) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 404 }
      )
    }

    // Get active pass instance
    const { data: passInstance, error: passError } = await supabase
      .from('wallet_pass_instances')
      .select('*')
      .eq('funnel_id', funnelId)
      .eq('status', 'active')
      .single()

    const hasActivePass = !!passInstance && !passError

    return NextResponse.json({
      funnelId,
      passEnabled: funnel.wallet_pass_enabled,
      hasActivePass,
      lastUpdated: funnel.wallet_pass_last_updated,
      downloadCount: funnel.wallet_pass_download_count || 0,
      serialNumber: passInstance?.serial_number,
      passUrl: hasActivePass ? `/api/passkit/passes/${passInstance.serial_number}.pkpass` : null
    })

  } catch (error) {
    console.error('PassKit status check error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}