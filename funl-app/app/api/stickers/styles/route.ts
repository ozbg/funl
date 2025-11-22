import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Fetch available styles from qr_presets
    const { data: styles, error } = await supabase
      .from('qr_presets')
      .select('id, name, template, preview_url')
      .order('name')

    if (error) {
      console.error('Error fetching styles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch styles' },
        { status: 500 }
      )
    }

    return NextResponse.json({ styles: styles || [] })

  } catch (error) {
    console.error('Error in styles API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
