import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

interface PageProps {
  params: Promise<{ userId: string }>
}

export default async function ImpersonatePage({ params }: PageProps) {
  const { userId } = await params

  try {
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

    // Verify the impersonation cookie is set (security check)
    const cookieStore = await cookies()
    const impersonationActive = cookieStore.get('impersonation-active')

    if (!impersonationActive || impersonationActive.value !== 'true') {
      console.error('Impersonation not properly initiated')
      redirect('/admin/users?error=impersonation_not_initiated')
    }

    // Get target user from auth
    const { data: { user: targetUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !targetUser) {
      console.error('Target user not found:', userError)
      redirect('/admin/users?error=user_not_found')
    }

    // Generate a session for the target user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.email!
    })

    if (sessionError || !sessionData) {
      console.error('Failed to generate session:', sessionError)
      redirect('/admin/users?error=session_generation_failed')
    }

    // The generateLink returns properties with hashed_token and other auth data
    // We need to extract the access and refresh tokens to set them properly

    // For now, redirect with the magic link hash which will auto-sign them in
    // Extract the hash from the action_link
    const actionLink = sessionData.properties.action_link
    const hashMatch = actionLink?.match(/#(.+)$/)

    if (hashMatch && hashMatch[1]) {
      // Redirect to auth callback with the hash
      redirect(`/auth/callback#${hashMatch[1]}&impersonating=true`)
    }

    // Fallback: redirect to dashboard
    redirect('/dashboard')
  } catch (error) {
    console.error('Impersonation error:', error)
    redirect('/admin/users?error=impersonation_failed')
  }
}
