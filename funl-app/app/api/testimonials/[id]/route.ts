import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database, TestimonialStatus } from '@/lib/database.types'

const testimonialUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'archived', 'featured']).optional(),
  featured: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
  edited_comment: z.string().max(500).optional(),
  rejection_reason: z.string().max(255).optional(),
  internal_notes: z.string().max(1000).optional(),
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

async function verifyTestimonialAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  testimonialId: string,
  userBusinessId: string
) {
  const { data: testimonial, error } = await supabase
    .from('testimonials')
    .select('business_id')
    .eq('id', testimonialId)
    .single()

  if (error || !testimonial) return false
  return testimonial.business_id === userBusinessId
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: testimonialId } = await params
  try {
    const supabase = await createClient()

    const userBusinessId = await getBusinessIdFromAuth(supabase)
    if (!userBusinessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await verifyTestimonialAccess(supabase, testimonialId, userBusinessId)) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
    }

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .select(`
        *,
        funnel:funnels(id, name, type)
      `)
      .eq('id', testimonialId)
      .single()

    if (error) throw error

    return NextResponse.json({ data: testimonial })

  } catch (error) {
    console.error(`GET /api/testimonials/${testimonialId} error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: testimonialId } = await params
  try {
    const supabase = await createClient()
    const body = await req.json()

    const userBusinessId = await getBusinessIdFromAuth(supabase)
    if (!userBusinessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await verifyTestimonialAccess(supabase, testimonialId, userBusinessId)) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
    }

    // Validate request body
    const validationResult = testimonialUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Add review metadata if status is being changed
    if (updateData.status) {
      const { data: { user } } = await supabase.auth.getUser()
      ;(updateData as any).reviewed_at = new Date().toISOString()
      ;(updateData as any).reviewed_by = user?.id || null
    }

    // Handle featured status - ensure only one featured per business at display_order level
    if (updateData.featured && updateData.display_order !== undefined) {
      await supabase
        .from('testimonials')
        .update({ featured: false })
        .eq('business_id', userBusinessId)
        .eq('display_order', updateData.display_order)
    }

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .update(updateData)
      .eq('id', testimonialId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      data: testimonial,
      message: 'Testimonial updated successfully'
    })

  } catch (error) {
    console.error(`PATCH /api/testimonials/${testimonialId} error:`, error)

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: testimonialId } = await params
  try {
    const supabase = await createClient()

    const userBusinessId = await getBusinessIdFromAuth(supabase)
    if (!userBusinessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await verifyTestimonialAccess(supabase, testimonialId, userBusinessId)) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', testimonialId)

    if (error) throw error

    return NextResponse.json({
      message: 'Testimonial deleted successfully'
    })

  } catch (error) {
    console.error(`DELETE /api/testimonials/${testimonialId} error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}