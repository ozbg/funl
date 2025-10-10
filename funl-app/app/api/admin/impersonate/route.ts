import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/admin'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Verify admin access
    const adminUser = await requireAdmin()

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Create admin client with service role
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

    // Verify target user exists in auth.users
    const { data: { user: targetAuthUser }, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authUserError || !targetAuthUser) {
      return NextResponse.json(
        { error: 'User not found in auth system' },
        { status: 404 }
      )
    }

    // Get business details
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('businesses')
      .select('id, email, name')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      )
    }

    // Prevent self-impersonation
    if (userId === adminUser.user.id) {
      return NextResponse.json(
        { error: 'Cannot impersonate yourself' },
        { status: 400 }
      )
    }

    // Get request headers for audit logging
    const headersList = request.headers
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Log impersonation action for audit trail
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_user_id: adminUser.user.id,
      action: 'impersonate_user',
      target_user_id: userId,
      metadata: {
        admin_email: adminUser.user.email,
        target_email: targetUser.email,
        target_name: targetUser.name,
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent
    })

    // Generate a magic link for the target user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.email!
    })

    if (linkError || !linkData) {
      console.error('Failed to generate magic link:', linkError)
      return NextResponse.json(
        { error: 'Failed to generate impersonation link' },
        { status: 500 }
      )
    }

    // The newer Supabase SDK returns hashed_token directly
    const hashedToken = linkData.properties?.hashed_token
    const actionLink = linkData.properties?.action_link

    // Try to get hash from hashed_token first, then from action_link
    let impersonationHash: string | undefined = hashedToken

    if (!impersonationHash && actionLink) {
      const hashMatch = actionLink.match(/#(.+)$/)
      impersonationHash = hashMatch?.[1]
    }

    if (!impersonationHash) {
      console.error('Failed to extract hash from magic link. Link data:', linkData)
      return NextResponse.json(
        { error: 'Failed to create impersonation session' },
        { status: 500 }
      )
    }

    // Store impersonation state in cookie
    const cookieStore = await cookies()
    cookieStore.set('impersonation-active', 'true', {
      httpOnly: false, // Allow client-side access for UI banner
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600
    })
    cookieStore.set('impersonation-admin-id', adminUser.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600
    })

    return NextResponse.json({
      success: true,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name
      },
      impersonationHash: impersonationHash,
      message: 'Impersonation link created successfully.'
    })
  } catch (error) {
    console.error('Error in impersonate endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
