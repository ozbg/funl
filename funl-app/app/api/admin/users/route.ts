import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await requireAdmin()
    
    // Create admin client with service role for bypassing RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    // Use service role to bypass RLS and get all businesses
    const { data: users, error } = await supabaseAdmin
      .from('businesses')
      .select(`
        *,
        business_categories(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}