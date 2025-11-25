import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Admin routes - require admin privileges
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user is a platform admin
    const { data: admin } = await supabase
      .from('admins')
      .select('is_active')
      .eq('email', user.email!)
      .eq('is_active', true)
      .single()

    if (!admin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/account')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user has confirmed email
    const { data: business } = await supabase
      .from('businesses')
      .select('email_confirmed_at, onboarding_completed')
      .eq('id', user.id)
      .single()

    // If email not confirmed, redirect to confirm-email page
    if (!business?.email_confirmed_at && request.nextUrl.pathname !== '/confirm-email') {
      return NextResponse.redirect(new URL('/confirm-email', request.url))
    }

    // If email confirmed but onboarding not completed, redirect to appropriate step
    if (business?.email_confirmed_at && !business?.onboarding_completed) {
      // Check if they have a subscription
      const { data: subscription } = await supabase
        .from('subscription_history')
        .select('id')
        .eq('business_id', user.id)
        .in('status', ['active', 'trialing'])
        .single()

      if (!subscription && !['/select-plan', '/onboarding'].includes(request.nextUrl.pathname)) {
        // No subscription, redirect to plan selection
        return NextResponse.redirect(new URL('/select-plan', request.url))
      } else if (subscription && request.nextUrl.pathname !== '/onboarding') {
        // Has subscription but onboarding not complete
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }
  }

  // Auth routes - redirect if already logged in
  if (['/login', '/signup'].includes(request.nextUrl.pathname)) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}