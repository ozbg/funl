import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/stickers/connect - Connect verified sticker to funnel
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stickerId, funnelId, verificationToken, code, method } = await request.json()

    if (!funnelId) {
      return NextResponse.json({ error: 'Funnel ID is required' }, { status: 400 })
    }

    let stickerToConnect = stickerId

    // If code is provided instead of stickerId, look it up
    if (!stickerToConnect && code) {
      const { data: sticker, error: lookupError } = await supabase
        .from('reserved_codes')
        .select('id')
        .eq('code', code.toUpperCase())
        .single()

      if (lookupError || !sticker) {
        return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
      }

      stickerToConnect = sticker.id
    }

    if (!stickerToConnect) {
      return NextResponse.json({ error: 'Sticker ID or code is required' }, { status: 400 })
    }

    // Get sticker details
    const { data: sticker, error: stickerError } = await supabase
      .from('reserved_codes')
      .select('*')
      .eq('id', stickerToConnect)
      .single()

    if (stickerError || !sticker) {
      return NextResponse.json({ error: 'Sticker not found' }, { status: 404 })
    }

    // Verify token if provided
    if (verificationToken) {
      if (sticker.verification_token !== verificationToken) {
        // Log failed verification attempt
        await supabase.from('security_logs').insert({
          event: 'failed_verification',
          details: { sticker_id: stickerToConnect, provided_token: verificationToken },
          business_id: user.id,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent')
        })

        return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 })
      }

      if (sticker.verification_expires_at && new Date() > new Date(sticker.verification_expires_at)) {
        return NextResponse.json({ error: 'Verification token expired' }, { status: 403 })
      }
    }

    // For list method with owned stickers, verify ownership
    if (method === 'list' && sticker.status === 'owned_unassigned') {
      if (sticker.business_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Check if sticker is available for connection
    if (sticker.status === 'assigned' && sticker.funnel_id) {
      return NextResponse.json({ error: 'Sticker already assigned to a funnel' }, { status: 409 })
    }

    // Verify sticker is in a connectable state
    if (!['owned_unassigned', 'available'].includes(sticker.status)) {
      return NextResponse.json({
        error: `Sticker cannot be connected (status: ${sticker.status})`
      }, { status: 409 })
    }

    // Verify funnel ownership
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, business_id')
      .eq('id', funnelId)
      .eq('business_id', user.id)
      .single()

    if (funnelError || !funnel) {
      return NextResponse.json({ error: 'Funnel not found or unauthorized' }, { status: 404 })
    }

    // Update sticker status
    const { error: updateStickerError } = await supabase
      .from('reserved_codes')
      .update({
        status: 'assigned',
        business_id: user.id,
        funnel_id: funnelId,
        assigned_at: new Date().toISOString(),
        verification_token: null,
        verification_expires_at: null
      })
      .eq('id', stickerToConnect)

    if (updateStickerError) {
      console.error('Failed to update sticker:', updateStickerError)
      return NextResponse.json({ error: 'Failed to connect sticker' }, { status: 500 })
    }

    // Update funnel with reserved code
    const { error: updateFunnelError } = await supabase
      .from('funnels')
      .update({
        reserved_code_id: stickerToConnect,
        code_source: 'reserved',
        short_url: sticker.code
      })
      .eq('id', funnelId)

    if (updateFunnelError) {
      console.error('Failed to update funnel:', updateFunnelError)
      // TODO: Rollback sticker update
      return NextResponse.json({ error: 'Failed to update funnel' }, { status: 500 })
    }

    // Update or create inventory record
    const { error: inventoryError } = await supabase
      .from('user_sticker_inventory')
      .upsert({
        business_id: user.id,
        reserved_code_id: stickerToConnect,
        acquired_via: sticker.status === 'owned_unassigned' ? 'purchase' : 'promotion',
        is_used: true,
        used_for_funnel_id: funnelId,
        used_at: new Date().toISOString()
      }, {
        onConflict: 'business_id,reserved_code_id'
      })

    if (inventoryError) {
      console.error('Inventory update error:', inventoryError)
      // Non-critical error
    }

    // Log the successful connection
    await supabase.from('code_allocations').insert({
      reserved_code_id: stickerToConnect,
      action: 'assign',
      new_status: 'assigned',
      previous_status: sticker.status,
      business_id: user.id,
      funnel_id: funnelId,
      reason: `Connected via ${method || 'direct'} method`,
      metadata: { method, verification_used: !!verificationToken }
    })

    // Log successful connection in security logs
    await supabase.from('security_logs').insert({
      event: 'sticker_connected',
      details: {
        sticker_id: stickerToConnect,
        funnel_id: funnelId,
        method: method || 'direct'
      },
      business_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      message: 'Sticker successfully connected to funnel',
      sticker: {
        id: sticker.id,
        code: sticker.code
      },
      funnel: {
        id: funnelId
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}