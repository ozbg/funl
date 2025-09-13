import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { is_admin, business_category_id } = body
    
    // Create admin client with service role for bypassing RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    const { id } = await params
    const updateData: Record<string, string | boolean> = { updated_at: new Date().toISOString() }
    
    if (is_admin !== undefined) {
      updateData.is_admin = is_admin
    }
    
    if (business_category_id !== undefined) {
      updateData.business_category_id = business_category_id
    }
    
    const { data: user, error } = await supabaseAdmin
      .from('businesses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
    
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}