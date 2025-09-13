import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    
    const supabase = await createClient()
    
    const { id } = await params
    const { data: category, error } = await supabase
      .from('business_categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching business category:', error)
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    
    return NextResponse.json({ category })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { name, slug, description, is_active, sort_order } = body
    
    const supabase = await createClient()
    
    const { id } = await params
    const { data: category, error } = await supabase
      .from('business_categories')
      .update({
        name,
        slug,
        description,
        is_active,
        sort_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating business category:', error)
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }
    
    return NextResponse.json({ category })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    
    const supabase = await createClient()
    
    const { id } = await params
    const { error } = await supabase
      .from('business_categories')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting business category:', error)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}