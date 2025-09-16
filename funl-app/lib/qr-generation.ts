/**
 * Reusable QR code generation utilities shared between sticker builder and batch creation
 */

export interface QRPreset {
  id: string
  name: string
  style_config: Record<string, unknown>
}

export interface QRGenerationOptions {
  url: string
  preset: QRPreset
  width?: number
  height?: number
}

/**
 * Generate QR code SVG using qr-code-styling with preset configuration
 */
export async function generateQRCodeWithPreset(options: QRGenerationOptions): Promise<string> {
  const { url, preset, width = 400, height = 400 } = options

  try {
    const { default: QRCodeStyling } = await import('qr-code-styling')

    const config = {
      width: Math.max(width, height),
      height: Math.max(width, height),
      type: "svg" as const,
      data: url,
      margin: 0,
      // Apply the preset's style configuration first
      ...preset.style_config,
      // Then merge qrOptions properly
      qrOptions: {
        errorCorrectionLevel: 'M' as const,
        ...((preset.style_config as Record<string, unknown>)?.qrOptions as Record<string, unknown> || {})
      }
    }

    // Add jsdom only in server environment
    if (typeof window === 'undefined') {
      const { JSDOM } = await import('jsdom')
      ;(config as Record<string, unknown>).jsdom = JSDOM
    }

    const qrCode = new QRCodeStyling(config)
    const svgBuffer = await qrCode.getRawData('svg')

    let svg: string
    if (svgBuffer instanceof Blob) {
      svg = await svgBuffer.text()
    } else if (svgBuffer) {
      svg = new TextDecoder().decode(svgBuffer)
    } else {
      throw new Error('Failed to generate QR code')
    }

    return svg
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    throw error
  }
}

/**
 * Load available QR presets for a business category or all presets for admin
 */
export async function loadQRPresetsForBusiness(supabase: any, businessId?: string): Promise<QRPreset[]> {
  try {
    // Get current user to check admin status
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Check if user is an admin
    const { data: userBusiness } = await supabase
      .from('businesses')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    // If user is admin, return ALL presets regardless of business category
    if (userBusiness?.is_admin) {
      console.log('🔧 Admin detected - loading all QR presets')
      const { data: allPresets } = await supabase
        .from('qr_code_presets')
        .select('id, name, style_config')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      return allPresets || []
    }

    // Non-admin logic: get presets based on business category
    let categoryId: string | null = null

    if (businessId) {
      // Get specified business category
      const { data: business } = await supabase
        .from('businesses')
        .select('business_category_id')
        .eq('id', businessId)
        .single()

      categoryId = business?.business_category_id
    } else {
      // Get current user's business category
      const { data: business } = await supabase
        .from('businesses')
        .select('business_category_id')
        .eq('id', user.id)
        .single()

      categoryId = business?.business_category_id
    }

    if (!categoryId) {
      console.log('⚠️ No business category found for non-admin user')
      return []
    }

    // Get QR presets for this business category
    const { data: presets } = await supabase
      .from('qr_code_presets')
      .select(`
        id,
        name,
        style_config,
        category_qr_presets!inner(
          business_category_id
        )
      `)
      .eq('category_qr_presets.business_category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    return presets || []
  } catch (error) {
    console.error('Error loading QR presets:', error)
    return []
  }
}

/**
 * Generate a sample QR code for preview (uses placeholder URL)
 */
export async function generateSampleQR(preset: QRPreset, codeText: string = 'SAMPLE'): Promise<string> {
  const sampleUrl = `https://funl.app/f/${codeText}`
  return generateQRCodeWithPreset({
    url: sampleUrl,
    preset,
    width: 200,
    height: 200
  })
}