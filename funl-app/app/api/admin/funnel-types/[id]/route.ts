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
    const { data: funnelType, error } = await supabase
      .from('funnel_types')
      .select(`
        *,
        category_funnel_types(
          business_categories(*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching funnel type:', error)
      return NextResponse.json({ error: 'Funnel type not found' }, { status: 404 })
    }
    
    return NextResponse.json({ funnelType })
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
    const { name, slug, description, template_config, is_active, sort_order, category_ids } = body
    
    const supabase = await createClient()
    
    const { id } = await params
    // Update funnel type
    const { data: funnelType, error: updateError } = await supabase
      .from('funnel_types')
      .update({
        name,
        slug,
        description,
        template_config,
        is_active,
        sort_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating funnel type:', updateError)
      return NextResponse.json({ error: 'Failed to update funnel type' }, { status: 500 })
    }
    
    // Update category associations if provided
    if (category_ids !== undefined) {
      // Delete existing associations
      await supabase
        .from('category_funnel_types')
        .delete()
        .eq('funnel_type_id', id)
      
      // Create new associations
      if (category_ids.length > 0) {
        const categoryAssociations = category_ids.map((categoryId: string) => ({
          business_category_id: categoryId,
          funnel_type_id: id
        }))
        
        const { error: associationError } = await supabase
          .from('category_funnel_types')
          .insert(categoryAssociations)
        
        if (associationError) {
          console.error('Error updating category associations:', associationError)
        }
      }
    }
    
    return NextResponse.json({ funnelType })
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
    // Delete category associations first
    await supabase
      .from('category_funnel_types')
      .delete()
      .eq('funnel_type_id', id)
    
    // Delete funnel type
    const { error } = await supabase
      .from('funnel_types')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting funnel type:', error)
      return NextResponse.json({ error: 'Failed to delete funnel type' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Funnel type deleted successfully' })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}