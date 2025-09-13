import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    await requireAdmin()
    
    const supabase = await createClient()
    
    const { data: categories, error } = await supabase
      .from('business_categories')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching business categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
    
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { name, slug, description, is_active, sort_order } = body
    
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    const { data: category, error } = await supabase
      .from('business_categories')
      .insert({
        name,
        slug,
        description,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating business category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
    
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}