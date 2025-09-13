import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    await requireAdmin()
    
    const supabase = await createClient()
    
    const { data: funnelTypes, error } = await supabase
      .from('funnel_types')
      .select(`
        *,
        category_funnel_types!inner(
          business_categories(*)
        )
      `)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching funnel types:', error)
      return NextResponse.json({ error: 'Failed to fetch funnel types' }, { status: 500 })
    }
    
    return NextResponse.json({ funnelTypes })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { name, slug, description, template_config, is_active, sort_order, category_ids } = body
    
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Create funnel type
    const { data: funnelType, error: createError } = await supabase
      .from('funnel_types')
      .insert({
        name,
        slug,
        description,
        template_config: template_config || {},
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0
      })
      .select()
      .single()
    
    if (createError) {
      console.error('Error creating funnel type:', createError)
      return NextResponse.json({ error: 'Failed to create funnel type' }, { status: 500 })
    }
    
    // Associate with categories if provided
    if (category_ids && category_ids.length > 0) {
      const categoryAssociations = category_ids.map((categoryId: string) => ({
        business_category_id: categoryId,
        funnel_type_id: funnelType.id
      }))
      
      const { error: associationError } = await supabase
        .from('category_funnel_types')
        .insert(categoryAssociations)
      
      if (associationError) {
        console.error('Error creating category associations:', associationError)
      }
    }
    
    return NextResponse.json({ funnelType }, { status: 201 })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}