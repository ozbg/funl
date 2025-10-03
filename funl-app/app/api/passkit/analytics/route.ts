/**
 * PassKit Analytics API
 *
 * GET /api/passkit/analytics - Get analytics data for wallet passes
 * POST /api/passkit/analytics - Log analytics events (for internal use)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Retrieve analytics data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const funnelId = searchParams.get('funnelId')
    const timeRange = searchParams.get('timeRange') || '30d' // 7d, 30d, 90d, 1y
    const eventType = searchParams.get('eventType') // optional filter

    // Calculate date range
    const now = new Date()
    const daysBack = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[timeRange] || 30

    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    // Build query
    let query = supabase
      .from('wallet_pass_analytics')
      .select(`
        *,
        funnel:funnels!inner(name, business_id)
      `)
      .gte('created_at', startDate.toISOString())
      .eq('funnel.business_id', user.id)

    if (funnelId) {
      query = query.eq('funnel_id', funnelId)
    }

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    const { data: analytics, error: analyticsError } = await query
      .order('created_at', { ascending: false })
      .limit(1000)

    if (analyticsError) {
      console.error('Analytics query error:', analyticsError)
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }

    // Aggregate data
    const eventCounts: Record<string, number> = {}
    const dailyStats: Record<string, Record<string, number>> = {}
    const deviceTypes: Record<string, number> = {}

    analytics.forEach(event => {
      // Event type counts
      eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1

      // Daily aggregation
      const date = new Date(event.created_at).toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = {}
      }
      dailyStats[date][event.event_type] = (dailyStats[date][event.event_type] || 0) + 1

      // Device types
      if (event.device_type) {
        deviceTypes[event.device_type] = (deviceTypes[event.device_type] || 0) + 1
      }
    })

    // Get pass instance summaries
    let passInstanceQuery = supabase
      .from('wallet_pass_instances')
      .select(`
        *,
        funnel:funnels!inner(name, business_id)
      `)
      .eq('funnel.business_id', user.id)

    if (funnelId) {
      passInstanceQuery = passInstanceQuery.eq('funnel_id', funnelId)
    }

    const { data: passInstances, error: passError } = await passInstanceQuery

    if (passError) {
      console.error('Pass instances query error:', passError)
    }

    const totalDownloads = passInstances?.reduce((sum, instance) => sum + instance.download_count, 0) || 0
    const activePassCount = passInstances?.filter(instance => instance.status === 'active').length || 0

    return NextResponse.json({
      timeRange,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary: {
        totalEvents: analytics.length,
        totalDownloads,
        activePassCount,
        uniqueFunnels: new Set(analytics.map(a => a.funnel_id)).size
      },
      eventCounts,
      dailyStats,
      deviceTypes,
      passInstances: passInstances?.map(instance => ({
        id: instance.id,
        funnelId: instance.funnel_id,
        funnelName: instance.funnel.name,
        serialNumber: instance.serial_number,
        downloadCount: instance.download_count,
        status: instance.status,
        createdAt: instance.created_at,
        firstDownloadedAt: instance.first_downloaded_at,
        lastDownloadedAt: instance.last_downloaded_at
      })) || [],
      recentEvents: analytics.slice(0, 50).map(event => ({
        id: event.id,
        funnelId: event.funnel_id,
        funnelName: event.funnel.name,
        eventType: event.event_type,
        deviceType: event.device_type,
        createdAt: event.created_at,
        userAgent: event.user_agent,
        metadata: event.metadata
      }))
    })

  } catch (error) {
    console.error('PassKit analytics error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Log analytics event (internal use)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      funnelId,
      passInstanceId,
      eventType,
      deviceType,
      iosVersion,
      latitude,
      longitude,
      sessionId,
      metadata
    } = body

    if (!funnelId || !eventType) {
      return NextResponse.json(
        { error: 'funnelId and eventType are required' },
        { status: 400 }
      )
    }

    // Validate event type
    const validEventTypes = [
      'download_requested',
      'download_completed',
      'add_to_wallet',
      'view_in_wallet',
      'remove_from_wallet',
      'registration',
      'unregistration'
    ]

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      )
    }

    // Log the analytics event
    const { error: insertError } = await supabase
      .from('wallet_pass_analytics')
      .insert({
        funnel_id: funnelId,
        pass_instance_id: passInstanceId,
        event_type: eventType,
        device_type: deviceType,
        ios_version: iosVersion,
        latitude,
        longitude,
        session_id: sessionId || crypto.randomUUID(),
        user_agent: request.headers.get('user-agent') || '',
        ip_address: (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'),
        referrer: request.headers.get('referer'),
        metadata
      })

    if (insertError) {
      console.error('Failed to log analytics event:', insertError)
      return NextResponse.json(
        { error: 'Failed to log analytics event' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics event logged successfully'
    })

  } catch (error) {
    console.error('PassKit analytics logging error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}