import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/stickers/available - Returns available pre-printed stickers
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch available reserved codes with batch info
    const { data: stickers, error } = await supabase
      .from('reserved_codes')
      .select(`
        id,
        code,
        batch_id,
        base_qr_svg,
        generation_settings,
        qr_code_batches (
          name,
          size,
          style_preset_id
        )
      `)
      .eq('status', 'available')
      .limit(20)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch available stickers' }, { status: 500 })
    }

    return NextResponse.json({ stickers: stickers || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}