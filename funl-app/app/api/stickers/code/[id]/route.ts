import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await context.params

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch code
    const { data: code, error: codeError } = await supabase
      .from('reserved_codes')
      .select(`
        id,
        code,
        status,
        business_id,
        assigned_at,
        funnel_id,
        funnels:funnel_id (
          id,
          name,
          funnel_type
        )
      `)
      .eq('id', id)
      .eq('business_id', user.id)
      .single()

    if (codeError || !code) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 })
    }

    return NextResponse.json(code)

  } catch (error) {
    console.error('Error fetching code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
