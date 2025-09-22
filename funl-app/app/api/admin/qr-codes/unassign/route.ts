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
    const { codeId, reason } = body

    if (!codeId) {
      return NextResponse.json(
        { error: 'Code ID is required' },
        { status: 400 }
      )
    }

    // Use the atomic unassignment function
    const { data: result, error } = await supabase.rpc(
      'release_code_from_funnel',
      {
        p_code_id: codeId,
        p_admin_id: admin.id,
        p_reason: reason || 'Admin unassignment'
      }
    )

    if (error) {
      console.error('Unassignment function error:', error)
      return NextResponse.json(
        { error: 'Database error during unassignment' },
        { status: 500 }
      )
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Unassignment failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Code unassigned successfully'
    })

  } catch (error) {
    console.error('Error in unassign API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}