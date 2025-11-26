import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    // Create admin client with service role for bypassing RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    const { id } = await params

    // Update the user's email_confirmed_at timestamp
    const { data: user, error } = await supabaseAdmin
      .from('businesses')
      .update({
        email_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, email, email_confirmed_at')
      .single()

    if (error) {
      console.error('Error validating user email:', error)
      return NextResponse.json({ error: 'Failed to validate user email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
