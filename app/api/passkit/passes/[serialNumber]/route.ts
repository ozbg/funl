/**
 * PassKit Pass Download API
 *
 * GET /api/passkit/passes/[serialNumber].pkpass
 * Downloads a specific Apple Wallet pass file
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPassKitService } from '@/lib/passkit'
import type { Database } from '@/lib/database.types'

type RouteParams = {
  params: Promise<{ serialNumber: string }>
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { serialNumber: serialNumberWithExt } = await context.params

    // Remove .pkpass extension if present
    const serialNumber = serialNumberWithExt.replace(/\.pkpass$/, '')

    const supabase = await createClient()

    // Find the pass instance
    const { data: passInstance, error: passError } = await supabase
      .from('wallet_pass_instances')
      .select(`
        *,
        funnel:funnels(*),
        business:businesses(*)
      `)
      .eq('serial_number', serialNumber)
      .eq('status', 'active')
      .single()

    if (passError || !passInstance) {
      return NextResponse.json(
        { error: 'Pass not found' },
        { status: 404 }
      )
    }

    // Check authentication token if provided
    const authToken = request.nextUrl.searchParams.get('auth')
    if (authToken && authToken !== passInstance.authentication_token) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Generate fresh pass data
    const passKitService = createPassKitService()

    // Create pass data structure
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: passInstance.pass_type_identifier,
      serialNumber: passInstance.serial_number,
      teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER!,
      organizationName: passInstance.business.name,
      description: `Property information from ${passInstance.business.name}`,
      authenticationToken: passInstance.authentication_token,
      webServiceURL: process.env.PASSKIT_WEB_SERVICE_URL,

      // Visual styling
      backgroundColor: '#FFFFFF',
      foregroundColor: '#000000',
      labelColor: '#666666',

      // QR code
      barcodes: [{
        message: `https://funl.app/f/${passInstance.funnel_id}`,
        format: 'PKBarcodeFormatQR' as const,
        messageEncoding: 'iso-8859-1',
        altText: 'Scan to view property details'
      }],

      // Pass structure
      generic: {
        headerFields: [{
          key: 'organization',
          label: 'Organization',
          value: passInstance.business.name
        }],
        primaryFields: [{
          key: 'funnel_name',
          label: 'Property',
          value: passInstance.funnel.name
        }],
        secondaryFields: [{
          key: 'agent',
          label: 'Agent',
          value: `${passInstance.business.vcard_data.firstName} ${passInstance.business.vcard_data.lastName}`
        }],
        auxiliaryFields: [{
          key: 'phone',
          label: 'Phone',
          value: passInstance.business.vcard_data.phone
        }],
        backFields: [{
          key: 'email',
          label: 'Email',
          value: passInstance.business.vcard_data.email
        }]
      },

      userInfo: {
        funnelId: passInstance.funnel_id,
        businessId: passInstance.business_id,
        downloadedAt: new Date().toISOString()
      }
    }

    // Create minimal assets
    const assets = {
      'icon.png': await createPlaceholderIcon(),
      'icon@2x.png': await createPlaceholderIcon(),
      'icon@3x.png': await createPlaceholderIcon()
    }

    // Generate signed pass
    const pkpassBuffer = await passKitService.signPass(passData, assets)

    // Update download count and analytics
    await Promise.all([
      // Update pass instance
      supabase
        .from('wallet_pass_instances')
        .update({
          download_count: passInstance.download_count + 1,
          last_downloaded_at: new Date().toISOString(),
          first_downloaded_at: passInstance.first_downloaded_at || new Date().toISOString()
        })
        .eq('id', passInstance.id),

      // Update funnel download count
      supabase
        .from('funnels')
        .update({
          wallet_pass_download_count: (passInstance.funnel.wallet_pass_download_count || 0) + 1
        })
        .eq('id', passInstance.funnel_id),

      // Log analytics
      supabase
        .from('wallet_pass_analytics')
        .insert({
          funnel_id: passInstance.funnel_id,
          pass_instance_id: passInstance.id,
          event_type: 'download_completed',
          session_id: crypto.randomUUID(),
          user_agent: request.headers.get('user-agent') || '',
          ip_address: request.ip || '',
          metadata: {
            serial_number: serialNumber,
            download_count: passInstance.download_count + 1
          }
        })
    ])

    // Return the .pkpass file
    return new NextResponse(pkpassBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${serialNumber}.pkpass"`,
        'Content-Length': pkpassBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Pass download error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Creates a minimal placeholder icon for development
 */
async function createPlaceholderIcon(): Promise<Buffer> {
  // Create a minimal 1x1 transparent PNG
  const png = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: RGBA, Compression: 0, Filter: 0, Interlace: 0
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0D, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, // Compressed image data
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ])
  return png
}