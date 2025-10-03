/**
 * PassKit Configuration API
 *
 * GET /api/passkit/config - Get PassKit configuration and status
 * PUT /api/passkit/config - Update PassKit configuration for a funnel
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validatePassSetup } from '@/lib/passkit'
import { WalletPassConfigSchema } from '@/lib/validations'

// GET - Check PassKit configuration and system status
export async function GET(request: NextRequest) {
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

    // Check if user is admin or has PassKit access
    const { data: business } = await supabase
      .from('businesses')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const hasPassKitAccess = business?.subscription_tier !== 'basic' // Assuming basic tier doesn't have PassKit

    // Validate PassKit setup
    const setupValidation = await validatePassSetup()

    // Get system configuration (safe to expose)
    const systemConfig = {
      passKitEnabled: hasPassKitAccess,
      setupValid: setupValidation.valid,
      setupErrors: setupValidation.errors,
      setupWarnings: setupValidation.warnings,
      supportedPassTypes: ['property-listing', 'contact-card', 'generic'],
      maxPassLifetimeDays: 365,
      features: {
        pushNotifications: !!process.env.PASSKIT_WEB_SERVICE_URL,
        passUpdates: !!process.env.PASSKIT_WEB_SERVICE_URL,
        analytics: true,
        customBranding: hasPassKitAccess
      }
    }

    return NextResponse.json(systemConfig)

  } catch (error) {
    console.error('PassKit config check error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update funnel PassKit configuration
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { funnelId, config } = body

    if (!funnelId) {
      return NextResponse.json(
        { error: 'funnelId is required' },
        { status: 400 }
      )
    }

    // Validate the configuration
    const validationResult = WalletPassConfigSchema.safeParse(config)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid configuration',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    // Check funnel ownership
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, wallet_pass_config')
      .eq('id', funnelId)
      .eq('business_id', user.id)
      .single()

    if (funnelError || !funnel) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 404 }
      )
    }

    // Store configuration in dedicated config table
    const { error: configError } = await supabase
      .from('funnel_wallet_pass_config')
      .upsert({
        funnel_id: funnelId,
        config: validationResult.data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'funnel_id'
      })

    if (configError) {
      console.error('Failed to update pass config:', configError)
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      )
    }

    // Update funnel with enabled status and reference to config
    const { error: funnelUpdateError } = await supabase
      .from('funnels')
      .update({
        wallet_pass_enabled: validationResult.data.enabled,
        wallet_pass_config: validationResult.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', funnelId)

    if (funnelUpdateError) {
      console.error('Failed to update funnel:', funnelUpdateError)
      return NextResponse.json(
        { error: 'Failed to update funnel configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'PassKit configuration updated successfully',
      config: validationResult.data
    })

  } catch (error) {
    console.error('PassKit config update error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Enable/disable PassKit for a funnel
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

    const body = await request.json()
    const { funnelId, enabled } = body

    if (!funnelId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'funnelId and enabled (boolean) are required' },
        { status: 400 }
      )
    }

    // Check funnel ownership
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, wallet_pass_enabled')
      .eq('id', funnelId)
      .eq('business_id', user.id)
      .single()

    if (funnelError || !funnel) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 404 }
      )
    }

    // Update funnel PassKit status
    const { error: updateError } = await supabase
      .from('funnels')
      .update({
        wallet_pass_enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', funnelId)

    if (updateError) {
      console.error('Failed to update funnel PassKit status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update PassKit status' },
        { status: 500 }
      )
    }

    // If enabling PassKit, create default configuration if none exists
    if (enabled) {
      const { data: existingConfig } = await supabase
        .from('funnel_wallet_pass_config')
        .select('*')
        .eq('funnel_id', funnelId)
        .single()

      if (!existingConfig) {
        const defaultConfig = {
          enabled: true,
          backgroundColor: '#ffffff',
          foregroundColor: '#000000',
          showPriceHistory: false,
          showPropertyFeatures: true,
          showOpenHouseTimes: true,
          maxDescriptionLength: 200,
          autoUpdateEnabled: true
        }

        await supabase
          .from('funnel_wallet_pass_config')
          .insert({
            funnel_id: funnelId,
            config: defaultConfig
          })
      }
    }

    return NextResponse.json({
      success: true,
      message: `PassKit ${enabled ? 'enabled' : 'disabled'} for funnel`,
      funnelId,
      enabled
    })

  } catch (error) {
    console.error('PassKit toggle error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}