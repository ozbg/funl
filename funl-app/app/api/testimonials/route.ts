import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database, Tables, TablesInsert, TestimonialStatus } from '@/lib/database.types'

const testimonialCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  suburb: z.string().min(1, 'Suburb is required').max(100),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(500),
  rating: z.number().int().min(1).max(5).optional(),
  email: z.union([z.string().email(), z.literal('')]).optional().transform(val => val === '' ? undefined : val),
  phone: z.string().optional().transform(val => val === '' ? undefined : val),
  business_id: z.string().uuid(),
  funnel_id: z.string().uuid().optional(),
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
    const supabase = await createClient()
    const url = new URL(req.url)
    const searchParams = url.searchParams

    // Check if this is a public request for approved testimonials
    const isPublic = searchParams.get('public') === 'true'
    const businessId = searchParams.get('business_id')

    if (isPublic && businessId) {
      // Public endpoint - get approved testimonials
      const { data: testimonials, error } = await supabase
        .from('testimonials')
        .select(`
          id,
          name,
          suburb,
          comment,
          rating,
          featured,
          submitted_at,
          display_order
        `)
        .eq('business_id', businessId)
        .in('status', ['approved', 'featured'])
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('submitted_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ data: testimonials })
    }

    // Private endpoint - requires authentication
    const userBusinessId = await getBusinessIdFromAuth(supabase)
    if (!userBusinessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse filters
    const status = searchParams.getAll('status') as TestimonialStatus[]
    const featured = searchParams.get('featured') === 'true'
    const funnelId = searchParams.get('funnel_id')
    const search = searchParams.get('search')

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    let query = supabase
      .from('testimonials')
      .select(`
        *,
        funnel:funnels(id, name, type)
      `, { count: 'exact' })
      .eq('business_id', userBusinessId)

    if (status.length > 0) {
      query = query.in('status', status)
    }

    if (featured) {
      query = query.eq('featured', true)
    }

    if (funnelId) {
      query = query.eq('funnel_id', funnelId)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,comment.ilike.%${search}%,suburb.ilike.%${search}%`)
    }

    const { data: testimonials, error, count } = await query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      data: testimonials,
      meta: {
        total: count || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('GET /api/testimonials error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServiceClient() // Use service client for public testimonial submission
    const body = await req.json()

    // Validate request body
    const validationResult = testimonialCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Get testimonial settings for this business
    const { data: settings } = await supabase
      .from('testimonial_settings')
      .select('*')
      .eq('business_id', data.business_id)
      .single()

    // Get client IP and user agent for tracking
    const forwarded = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || 'Unknown'

    // Check rate limiting if settings exist
    if (settings?.rate_limit_minutes) {
      const rateLimit = new Date()
      rateLimit.setMinutes(rateLimit.getMinutes() - settings.rate_limit_minutes)

      const { data: recentSubmissions } = await supabase
        .from('testimonials')
        .select('id')
        .eq('business_id', data.business_id)
        .or(data.email ? `email.eq.${data.email},ip_address.eq.${ip}` : `ip_address.eq.${ip}`)
        .gte('submitted_at', rateLimit.toISOString())

      if (recentSubmissions && recentSubmissions.length > 0) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before submitting another testimonial.' },
          { status: 429 }
        )
      }
    }

    // Determine initial status
    const status = settings?.auto_approve ? 'approved' : 'pending'

    // Create testimonial
    const testimonialData: TablesInsert<'testimonials'> = {
      ...data,
      email: data.email || null,
      status,
      ip_address: ip,
      user_agent: userAgent,
      submitted_at: new Date().toISOString(),
    }

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .insert(testimonialData)
      .select()
      .single()

    if (error) throw error

    // TODO: Send notification if enabled
    if (settings?.notify_on_submission) {
      // Implement notification logic here
      console.log('Testimonial submission notification needed for business:', data.business_id)
    }

    return NextResponse.json(
      { data: testimonial, message: 'Testimonial submitted successfully' },
      { status: 201 }
    )

  } catch (error) {
    console.error('POST /api/testimonials error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    // Log the actual error for debugging
    console.error('Detailed error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    })

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}