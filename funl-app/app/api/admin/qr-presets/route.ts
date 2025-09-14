import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    await requireAdmin()
    
    const supabase = await createClient()
    
    const { data: qrPresets, error } = await supabase
      .from('qr_code_presets')
      .select(`
        *,
        category_qr_presets!inner(
          business_categories(*)
        )
      `)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching QR presets:', error)
      return NextResponse.json({ error: 'Failed to fetch QR presets' }, { status: 500 })
    }
    
    return NextResponse.json({ qrPresets })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { name, slug, description, style_config, is_active, sort_order, category_ids } = body
    
    if (!name || !slug || !style_config) {
      return NextResponse.json({ error: 'Name, slug, and style_config are required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Create QR preset
    const { data: qrPreset, error: createError } = await supabase
      .from('qr_code_presets')
      .insert({
        name,
        slug,
        description,
        style_config,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0
      })
      .select()
      .single()
    
    if (createError) {
      console.error('Error creating QR preset:', createError)
      return NextResponse.json({ error: 'Failed to create QR preset' }, { status: 500 })
    }
    
    // Associate with categories if provided
    if (category_ids && category_ids.length > 0) {
      const categoryAssociations = category_ids.map((categoryId: string) => ({
        business_category_id: categoryId,
        qr_code_preset_id: qrPreset.id
      }))
      
      const { error: associationError } = await supabase
        .from('category_qr_presets')
        .insert(categoryAssociations)
      
      if (associationError) {
        console.error('Error creating category associations:', associationError)
      }
    }
    
    return NextResponse.json({ qrPreset }, { status: 201 })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}