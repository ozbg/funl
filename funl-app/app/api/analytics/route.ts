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
    const period = searchParams.get('period') || '30d' // 24h, 7d, 30d, all
    const funnelId = searchParams.get('funnelId') // optional - for specific funnel
    const exportType = searchParams.get('export') // csv, json

    // Calculate date filter based on period
    let dateFilter = ''
    const now = new Date()
    switch (period) {
      case '24h':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        break
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      default:
        dateFilter = '1970-01-01' // all time
    }

    // Get user's funnels for filtering
    const { data: userFunnels } = await supabase
      .from('funnels')
      .select('id')
      .eq('business_id', user.id)

    const funnelIds = userFunnels?.map(f => f.id) || []

    if (funnelIds.length === 0) {
      return NextResponse.json({
        totalScans: 0,
        uniqueVisitors: 0,
        conversionRate: 0,
        activeFunnels: 0,
        recentActivity: [],
        deviceBreakdown: {},
        topFunnels: []
      })
    }

    // Build funnel filter
    const funnelFilter = funnelId ? [funnelId] : funnelIds

    // Get total scans
    const { count: totalScans } = await supabase
      .from('click_events')
      .select('*', { count: 'exact', head: true })
      .in('funnel_id', funnelFilter)
      .gte('created_at', dateFilter)

    // Get unique visitors
    const { data: uniqueVisitorData } = await supabase
      .from('click_events')
      .select('session_id')
      .in('funnel_id', funnelFilter)
      .gte('created_at', dateFilter)

    const uniqueVisitors = new Set(uniqueVisitorData?.map(v => v.session_id) || []).size

    // Get conversions (callback requests)
    const { count: conversions } = await supabase
      .from('click_events')
      .select('*', { count: 'exact', head: true })
      .in('funnel_id', funnelFilter)
      .eq('action', 'callback_request')
      .gte('created_at', dateFilter)

    // Calculate conversion rate
    const conversionRate = totalScans ? ((conversions || 0) / totalScans * 100).toFixed(1) : '0.0'

    // Get device breakdown
    const { data: deviceData } = await supabase
      .from('click_events')
      .select('metadata')
      .in('funnel_id', funnelFilter)
      .gte('created_at', dateFilter)

    const deviceBreakdown = deviceData?.reduce((acc: Record<string, number>, event) => {
      const deviceType = event.metadata?.device_type || 'unknown'
      acc[deviceType] = (acc[deviceType] || 0) + 1
      return acc
    }, {}) || {}

    // Get recent activity (last 10 events)
    const { data: recentActivity } = await supabase
      .from('click_events')
      .select(`
        action,
        created_at,
        metadata,
        funnels!inner(name)
      `)
      .in('funnel_id', funnelFilter)
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get top performing funnels
    const { data: topFunnelsData } = await supabase
      .from('click_events')
      .select(`
        funnel_id,
        funnels!inner(name)
      `)
      .in('funnel_id', funnelFilter)
      .gte('created_at', dateFilter)

    const funnelStats = topFunnelsData?.reduce((acc: Record<string, { name: string; scans: number }>, event) => {
      const funnelId = event.funnel_id
      const funnelName = Array.isArray(event.funnels) ? event.funnels[0]?.name : (event.funnels as { name: string } | null)?.name || 'Unknown'
      if (!acc[funnelId]) {
        acc[funnelId] = { name: funnelName, scans: 0 }
      }
      acc[funnelId].scans++
      return acc
    }, {}) || {}

    const topFunnels = Object.entries(funnelStats)
      .map(([id, stats]: [string, { name: string; scans: number }]) => ({ id, ...stats }))
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 5)

    const analyticsData = {
      totalScans: totalScans || 0,
      uniqueVisitors,
      conversionRate: parseFloat(conversionRate),
      activeFunnels: funnelIds.length,
      recentActivity: recentActivity?.map(activity => ({
        action: activity.action,
        timestamp: activity.created_at,
        funnelName: Array.isArray(activity.funnels) ? activity.funnels[0]?.name : (activity.funnels as { name: string } | null)?.name || 'Unknown',
        deviceType: activity.metadata?.device_type
      })) || [],
      deviceBreakdown,
      topFunnels
    }

    // Handle export requests
    if (exportType === 'csv') {
      const csvData = [
        ['Metric', 'Value'],
        ['Total Scans', analyticsData.totalScans],
        ['Unique Visitors', analyticsData.uniqueVisitors],
        ['Conversion Rate', `${analyticsData.conversionRate}%`],
        ['Active Funnels', analyticsData.activeFunnels],
        ['Period', period],
        ['Generated', new Date().toISOString()]
      ]
      
      const csvContent = csvData.map(row => row.join(',')).join('\n')
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${period}.csv"`
        }
      })
    }

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}