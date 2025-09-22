import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    codeId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { codeId } = await params
  try {
    // Require admin authentication
    await requireAdmin()

    // Create admin client with service role for bypassing RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // First get the code details
    const { data: code, error: codeError } = await supabase
      .from('reserved_codes')
      .select('id, code, status')
      .eq('id', codeId)
      .single()

    if (codeError || !code) {
      return NextResponse.json(
        { error: 'Code not found' },
        { status: 404 }
      )
    }

    // Get the code history using the database function
    const { data: historyData, error: historyError } = await supabase.rpc(
      'get_code_history',
      { p_code_id: codeId }
    )

    if (historyError) {
      console.error('Error fetching code history:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch code history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      code,
      history: historyData || []
    })

  } catch (error) {
    console.error('Error in code history API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}