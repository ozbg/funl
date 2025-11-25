import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { email, password, businessName, phone, businessCategoryId } = body

    // Validate input
    if (!email || !password || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/email-confirmed`,
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      )
    }

    // Use service key to bypass RLS for user creation
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    // Create business profile using admin client
    const { error: profileError } = await supabaseAdmin
      .from('businesses')
      .insert({
        id: authData.user.id,
        email,
        name: businessName,
        phone: phone || null,
        business_category_id: businessCategoryId || null,
        vcard_data: {
          firstName: businessName.split(' ')[0] || '',
          lastName: businessName.split(' ').slice(1).join(' ') || '',
          organization: businessName,
          phone: phone || '',
          email,
        },
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't expose internal error, but log it
      return NextResponse.json(
        { error: 'Failed to create business profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}