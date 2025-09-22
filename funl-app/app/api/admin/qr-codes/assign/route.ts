import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const { admin } = await requireAdmin()

    // Create admin client with service role for bypassing RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    const body = await request.json()
    const { codeId, funnelId } = body

    if (!codeId || !funnelId) {
      return NextResponse.json(
        { error: 'Code ID and Funnel ID are required' },
        { status: 400 }
      )
    }

    // Use the atomic assignment function
    const { data: result, error } = await supabase.rpc(
      'assign_code_to_funnel',
      {
        p_code_id: codeId,
        p_funnel_id: funnelId,
        p_admin_id: admin.id
      }
    )

    if (error) {
      console.error('Assignment function error:', error)
      return NextResponse.json(
        { error: 'Database error during assignment' },
        { status: 500 }
      )
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Assignment failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Code assigned successfully',
      code: result.code
    })

  } catch (error) {
    console.error('Error in assign API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}