import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { funnel_id, action, session_id } = body

    if (!funnel_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Skip database insertion for preview funnels
    if (funnel_id === 'preview-funnel') {
      return NextResponse.json({
        success: true,
        session_id: session_id || nanoid(12),
        preview: true
      })
    }

    // Generate session ID if not provided
    const sessionId = session_id || nanoid(12)

    // Get client info
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Simple device detection
    const deviceType = userAgent.toLowerCase().includes('mobile') ? 'mobile' : 'desktop'

    // Insert tracking event
    const { error } = await supabase.from('click_events').insert({
      funnel_id,
      session_id: sessionId,
      action,
      metadata: {
        user_agent: userAgent,
        ip_country: 'AU', // Default for now - could integrate with geolocation API
        device_type: deviceType,
        referrer: request.headers.get('referer') || undefined,
      },
    })

    if (error) {
      console.error('Tracking error:', error)
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      session_id: sessionId 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}