import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const formData = await request.formData()
    const funnelId = formData.get('funnelId') as string
    const currentStatus = formData.get('currentStatus') as string

    if (!funnelId || !currentStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Toggle the status
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'

    const { error } = await supabase
      .from('funnels')
      .update({ status: newStatus })
      .eq('id', funnelId)
      .eq('business_id', user.id) // Ensure user owns the funnel

    if (error) {
      console.error('Error updating funnel status:', error)
      return NextResponse.json({ error: 'Failed to update funnel status' }, { status: 500 })
    }

    // Redirect back to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Toggle funnel status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}