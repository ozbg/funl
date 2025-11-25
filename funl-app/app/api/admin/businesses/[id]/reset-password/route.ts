import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'

/**
 * POST /api/admin/businesses/[id]/reset-password
 * Reset a user's password (admin only)
 */
export async function POST(
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
    const { newPassword, reason, notes } = body

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    if (!reason || reason.length < 10) {
      return NextResponse.json(
        { error: 'Reason is required and must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Get business details
    const { data: business } = await supabase
      .from('businesses')
      .select('name, email')
      .eq('id', id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Use service key to update password
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error resetting password:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      )
    }

    // Log the action
    const { data: { user } } = await supabase.auth.getUser()
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_user_id: user!.id,
      action: 'reset_password',
      entity_type: 'business',
      entity_id: id,
      reason,
      notes: notes || `Reset password for: ${business.name} (${business.email})`,
      metadata: {
        business_name: business.name,
        business_email: business.email,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in reset password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
