import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()

    // Get the stored admin ID
    const adminId = cookieStore.get('impersonation-admin-id')
    const impersonationActive = cookieStore.get('impersonation-active')

    if (!impersonationActive || impersonationActive.value !== 'true') {
      return NextResponse.json(
        { error: 'No active impersonation session found' },
        { status: 400 }
      )
    }

    // Create admin client with service role for audit logging
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Log the stop impersonation action
    if (adminId) {
      try {
        await supabaseAdmin.from('admin_audit_log').insert({
          admin_user_id: adminId.value,
          action: 'stop_impersonation',
          metadata: {
            timestamp: new Date().toISOString()
          }
        })
      } catch (auditError) {
        console.error('Error logging stop impersonation:', auditError)
        // Continue anyway - don't block the user from stopping impersonation
      }
    }

    // Clear impersonation cookies
    cookieStore.delete('impersonation-admin-id')
    cookieStore.delete('impersonation-active')

    return NextResponse.json({
      success: true,
      message: 'Impersonation stopped. Redirecting to admin page.'
    })
  } catch (error) {
    console.error('Error stopping impersonation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
