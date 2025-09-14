import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database, TablesInsert, TablesUpdate } from '@/lib/database.types'

const testimonialSettingsSchema = z.object({
  auto_approve: z.boolean().optional(),
  require_email: z.boolean().optional(),
  require_rating: z.boolean().optional(),
  min_comment_length: z.number().int().min(5).max(100).optional(),
  max_comment_length: z.number().int().min(100).max(1000).optional(),
  notify_on_submission: z.boolean().optional(),
  notification_emails: z.array(z.string().email()).max(5).optional(),
  rate_limit_minutes: z.number().int().min(1).max(1440).optional(),
  profanity_filter: z.boolean().optional(),
  require_captcha: z.boolean().optional(),
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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const businessId = url.searchParams.get('business_id')

    let targetBusinessId: string
    let supabase: Awaited<ReturnType<typeof createClient>>

    if (businessId) {
      // Public request - use provided business_id and service client
      targetBusinessId = businessId
      supabase = await createServiceClient()
    } else {
      // Private request - requires authentication
      supabase = await createClient()
      const userBusinessId = await getBusinessIdFromAuth(supabase)
      if (!userBusinessId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      targetBusinessId = userBusinessId
    }

    const { data: settings, error } = await supabase
      .from('testimonial_settings')
      .select('*')
      .eq('business_id', targetBusinessId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error
    }

    // Return default settings if none exist
    const defaultSettings = {
      business_id: targetBusinessId,
      auto_approve: false,
      require_email: false,
      require_rating: false,
      min_comment_length: 10,
      max_comment_length: 500,
      notify_on_submission: true,
      notification_emails: [],
      rate_limit_minutes: 60,
      profanity_filter: true,
      require_captcha: false,
    }

    return NextResponse.json({
      data: settings || defaultSettings
    })

  } catch (error) {
    console.error('GET /api/testimonials/settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const userBusinessId = await getBusinessIdFromAuth(supabase)
    if (!userBusinessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const validationResult = testimonialSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const settingsData = validationResult.data

    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from('testimonial_settings')
      .select('id')
      .eq('business_id', userBusinessId)
      .single()

    if (existingSettings) {
      // Update existing settings
      const { data: updatedSettings, error } = await supabase
        .from('testimonial_settings')
        .update(settingsData as TablesUpdate<'testimonial_settings'>)
        .eq('business_id', userBusinessId)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        data: updatedSettings,
        message: 'Testimonial settings updated successfully'
      })
    } else {
      // Create new settings
      const newSettings: TablesInsert<'testimonial_settings'> = {
        business_id: userBusinessId,
        ...settingsData,
      }

      const { data: createdSettings, error } = await supabase
        .from('testimonial_settings')
        .insert(newSettings)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        data: createdSettings,
        message: 'Testimonial settings created successfully'
      }, { status: 201 })
    }

  } catch (error) {
    console.error('POST /api/testimonials/settings error:', error)

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