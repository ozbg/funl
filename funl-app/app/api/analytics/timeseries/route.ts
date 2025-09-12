import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 24h, 7d, 30d
    const funnelId = searchParams.get('funnelId')
    const metric = searchParams.get('metric') || 'scans' // scans, visitors, conversions

    // Get user's funnels
    const { data: userFunnels } = await supabase
      .from('funnels')
      .select('id')
      .eq('business_id', user.id)

    const funnelIds = userFunnels?.map(f => f.id) || []
    if (funnelIds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const funnelFilter = funnelId ? [funnelId] : funnelIds

    // Calculate date range and interval
    const now = new Date()
    let startDate: Date
    let intervalHours: number

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        intervalHours = 1 // hourly buckets
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        intervalHours = 24 // daily buckets
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        intervalHours = 24 // daily buckets
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        intervalHours = 24
    }

    // Query based on metric type
    let query = supabase
      .from('click_events')
      .select('created_at, session_id, action')
      .in('funnel_id', funnelFilter)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Apply action filter for conversions
    if (metric === 'conversions') {
      query = query.in('action', ['callback_request', 'vcard_download'])
    }

    const { data: events } = await query

    if (!events || events.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Group events by time intervals
    const buckets: { [key: string]: Set<string> | number } = {}

    // Initialize buckets
    let current = new Date(startDate)
    while (current <= now) {
      const bucketKey = current.toISOString().slice(0, intervalHours === 1 ? 13 : 10) + (intervalHours === 1 ? ':00:00.000Z' : 'T00:00:00.000Z')
      buckets[bucketKey] = metric === 'visitors' ? new Set() : 0
      current = new Date(current.getTime() + intervalHours * 60 * 60 * 1000)
    }

    // Fill buckets with data
    events.forEach(event => {
      const eventDate = new Date(event.created_at)
      const bucketKey = eventDate.toISOString().slice(0, intervalHours === 1 ? 13 : 10) + (intervalHours === 1 ? ':00:00.000Z' : 'T00:00:00.000Z')
      
      if (buckets[bucketKey] !== undefined) {
        if (metric === 'visitors') {
          (buckets[bucketKey] as Set<string>).add(event.session_id)
        } else {
          buckets[bucketKey] = (buckets[bucketKey] as number) + 1
        }
      }
    })

    // Convert to chart data format
    const chartData = Object.entries(buckets).map(([timestamp, value]) => ({
      timestamp,
      value: metric === 'visitors' ? (value as Set<string>).size : value as number,
      label: formatTimestamp(timestamp, intervalHours)
    }))

    return NextResponse.json({ data: chartData })

  } catch (error) {
    console.error('Timeseries API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatTimestamp(timestamp: string, intervalHours: number): string {
  const date = new Date(timestamp)
  if (intervalHours === 1) {
    // Hourly format
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  } else {
    // Daily format
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }
}