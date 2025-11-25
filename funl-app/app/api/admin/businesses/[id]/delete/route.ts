import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'

/**
 * DELETE /api/admin/businesses/[id]/delete
 * Delete a business and associated data (admin only)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const supabase = await createClient()

    // Verify admin
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { reason, notes } = body

    if (!reason || reason.length < 10) {
      return NextResponse.json(
        { error: 'Reason is required and must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Get business details for audit log
    const { data: business } = await supabase
      .from('businesses')
      .select('name, email')
      .eq('id', id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Use service key for admin operations
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // Delete business (cascade will handle related records if configured)
    const { error: deleteError } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting business:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete business' },
        { status: 500 }
      )
    }

    // Log the action
    const { data: { user } } = await supabase.auth.getUser()
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_user_id: user!.id,
      action: 'delete_business',
      entity_type: 'business',
      entity_id: id,
      reason,
      notes: notes || `Deleted business: ${business.name} (${business.email})`,
      metadata: {
        business_name: business.name,
        business_email: business.email,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete business:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
