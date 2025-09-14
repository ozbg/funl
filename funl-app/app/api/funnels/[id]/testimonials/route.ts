import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database, TablesInsert, TablesUpdate, DisplayStyle, DisplayPosition } from '@/lib/database.types'

const testimonialConfigSchema = z.object({
  enabled: z.boolean().optional(),
  display_count: z.number().int().min(1).max(20).optional(),
  display_style: z.enum(['carousel', 'grid', 'list']).optional(),
  position: z.enum(['top', 'bottom', 'sidebar']).optional(),
  minimum_rating: z.number().int().min(1).max(5).optional(),
  show_featured_only: z.boolean().optional(),
  theme_override: z.object({
    background_color: z.string().optional(),
    text_color: z.string().optional(),
    accent_color: z.string().optional(),
    border_radius: z.number().optional(),
    font_size: z.string().optional(),
  }).optional(),
})

async function getBusinessIdFromAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('email', user.email)
      .single()

    return business?.id || null
  } catch {
    return null
  }
}

async function verifyFunnelAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  funnelId: string,
  userBusinessId: string
) {
  const { data: funnel, error } = await supabase
    .from('funnels')
    .select('business_id')
    .eq('id', funnelId)
    .single()

  if (error || !funnel) return false
  return funnel.business_id === userBusinessId
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: funnelId } = await params
  try {
    const url = new URL(req.url)
    const isPublic = url.searchParams.get('public') === 'true'

    let supabase: Awaited<ReturnType<typeof createClient>>

    if (!isPublic) {
      // Private access - requires authentication
      supabase = await createClient()
      const userBusinessId = await getBusinessIdFromAuth(supabase)
      if (!userBusinessId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (!await verifyFunnelAccess(supabase, funnelId, userBusinessId)) {
        return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
      }
    } else {
      // Public access - just verify funnel exists
      supabase = await createServiceClient()
      const { data: funnel, error: funnelError } = await supabase
        .from('funnels')
        .select('id, status')
        .eq('id', funnelId)
        .eq('status', 'active')
        .single()

      if (funnelError || !funnel) {
        return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
      }
    }

    const { data: config, error } = await supabase
      .from('funnel_testimonial_config')
      .select('*')
      .eq('funnel_id', funnelId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error
    }

    // Return default config if none exists
    const defaultConfig = {
      funnel_id: funnelId,
      enabled: false,
      display_count: 3,
      display_style: 'carousel' as DisplayStyle,
      position: 'bottom' as DisplayPosition,
      minimum_rating: 3,
      show_featured_only: false,
      theme_override: null,
    }

    return NextResponse.json({
      data: config || defaultConfig
    })

  } catch (error) {
    console.error(`GET /api/funnels/${funnelId}/testimonials error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: funnelId } = await params
  try {
    const supabase = await createClient()
    const body = await req.json()

    const userBusinessId = await getBusinessIdFromAuth(supabase)
    if (!userBusinessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await verifyFunnelAccess(supabase, funnelId, userBusinessId)) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    // Validate request body
    const validationResult = testimonialConfigSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const configData = validationResult.data

    // Check if config already exists
    const { data: existingConfig } = await supabase
      .from('funnel_testimonial_config')
      .select('id')
      .eq('funnel_id', funnelId)
      .single()

    if (existingConfig) {
      // Update existing config
      const { data: updatedConfig, error } = await supabase
        .from('funnel_testimonial_config')
        .update(configData as TablesUpdate<'funnel_testimonial_config'>)
        .eq('funnel_id', funnelId)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        data: updatedConfig,
        message: 'Testimonial configuration updated successfully'
      })
    } else {
      // Create new config
      const newConfig: TablesInsert<'funnel_testimonial_config'> = {
        funnel_id: funnelId,
        ...configData,
      }

      const { data: createdConfig, error } = await supabase
        .from('funnel_testimonial_config')
        .insert(newConfig)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        data: createdConfig,
        message: 'Testimonial configuration created successfully'
      }, { status: 201 })
    }

  } catch (error) {
    console.error(`POST /api/funnels/${funnelId}/testimonials error:`, error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}