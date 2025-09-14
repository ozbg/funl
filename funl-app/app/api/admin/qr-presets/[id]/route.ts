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
    const { data: qrPreset, error } = await supabase
      .from('qr_code_presets')
      .select(`
        *,
        category_qr_presets(
          business_categories(*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching QR preset:', error)
      return NextResponse.json({ error: 'QR preset not found' }, { status: 404 })
    }
    
    return NextResponse.json({ qrPreset })
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
    const { name, slug, description, style_config, is_active, sort_order, category_ids } = body
    
    const supabase = await createClient()
    
    const { id } = await params
    // Update QR preset
    const { data: qrPreset, error: updateError } = await supabase
      .from('qr_code_presets')
      .update({
        name,
        slug,
        description,
        style_config,
        is_active,
        sort_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating QR preset:', updateError)
      return NextResponse.json({ error: 'Failed to update QR preset' }, { status: 500 })
    }
    
    // Update category associations if provided
    if (category_ids !== undefined) {
      // Delete existing associations
      await supabase
        .from('category_qr_presets')
        .delete()
        .eq('qr_code_preset_id', id)

      // Create new associations
      if (category_ids.length > 0) {
        const categoryAssociations = category_ids.map((categoryId: string) => ({
          business_category_id: categoryId,
          qr_code_preset_id: id
        }))
        
        const { error: associationError } = await supabase
          .from('category_qr_presets')
          .insert(categoryAssociations)
        
        if (associationError) {
          console.error('Error updating category associations:', associationError)
        }
      }
    }
    
    return NextResponse.json({ qrPreset })
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
      .from('category_qr_presets')
      .delete()
      .eq('qr_code_preset_id', id)
    
    // Delete QR preset
    const { error } = await supabase
      .from('qr_code_presets')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting QR preset:', error)
      return NextResponse.json({ error: 'Failed to delete QR preset' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'QR preset deleted successfully' })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}