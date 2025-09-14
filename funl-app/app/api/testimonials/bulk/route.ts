import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database, TestimonialStatus } from '@/lib/database.types'

const bulkActionSchema = z.object({
  testimonial_ids: z.array(z.string().uuid()).min(1, 'At least one testimonial ID is required'),
  action: z.enum(['approve', 'reject', 'delete', 'archive', 'feature', 'unfeature']),
  rejection_reason: z.string().max(255).optional(),
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

async function verifyTestimonialsBelongToBusiness(
  supabase: Awaited<ReturnType<typeof createClient>>,
  testimonialIds: string[],
  businessId: string
): Promise<boolean> {
  const { data: testimonials, error } = await supabase
    .from('testimonials')
    .select('id, business_id')
    .in('id', testimonialIds)

  if (error || !testimonials) return false

  return testimonials.every((t: any) => t.business_id === businessId) &&
         testimonials.length === testimonialIds.length
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
    const validationResult = bulkActionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { testimonial_ids, action, rejection_reason } = validationResult.data

    // Verify all testimonials belong to the user's business
    if (!await verifyTestimonialsBelongToBusiness(supabase, testimonial_ids, userBusinessId)) {
      return NextResponse.json(
        { error: 'Some testimonials not found or access denied' },
        { status: 404 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()
    const reviewData = {
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id || null,
    }

    let updateData: Record<string, any> = {}
    let successMessage = ''

    switch (action) {
      case 'approve':
        updateData = {
          status: 'approved' as TestimonialStatus,
          ...reviewData,
        }
        successMessage = 'Testimonials approved successfully'
        break

      case 'reject':
        updateData = {
          status: 'rejected' as TestimonialStatus,
          rejection_reason: rejection_reason || 'No reason provided',
          ...reviewData,
        }
        successMessage = 'Testimonials rejected successfully'
        break

      case 'archive':
        updateData = {
          status: 'archived' as TestimonialStatus,
          ...reviewData,
        }
        successMessage = 'Testimonials archived successfully'
        break

      case 'feature':
        updateData = {
          featured: true,
          status: 'featured' as TestimonialStatus,
          ...reviewData,
        }
        successMessage = 'Testimonials featured successfully'
        break

      case 'unfeature':
        updateData = {
          featured: false,
          status: 'approved' as TestimonialStatus,
          ...reviewData,
        }
        successMessage = 'Testimonials unfeatured successfully'
        break

      case 'delete':
        const { error: deleteError } = await supabase
          .from('testimonials')
          .delete()
          .in('id', testimonial_ids)

        if (deleteError) throw deleteError

        return NextResponse.json({
          message: 'Testimonials deleted successfully',
          processed_count: testimonial_ids.length
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Apply the update to all testimonials
    const { data: updatedTestimonials, error } = await supabase
      .from('testimonials')
      .update(updateData)
      .in('id', testimonial_ids)
      .select()

    if (error) throw error

    return NextResponse.json({
      data: updatedTestimonials,
      message: successMessage,
      processed_count: updatedTestimonials?.length || 0
    })

  } catch (error) {
    console.error('POST /api/testimonials/bulk error:', error)

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