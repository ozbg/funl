import { createClient } from '@/lib/supabase/server'
import { css } from '@/styled-system/css'
import { Box, Grid } from '@/styled-system/jsx'
import { notFound } from 'next/navigation'
import RecentActivity from './components/RecentActivity'
import InteractiveAnalytics from './components/InteractiveAnalytics'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  // Get user's funnels for analytics
  const { data: funnels } = await supabase
    .from('funnels')
    .select('id, name, created_at')
    .eq('business_id', user.id)
    .order('created_at', { ascending: false })

  // Get analytics data
  const funnelIds = funnels?.map(f => f.id) || []
  let analyticsData: {
    totalScans: number;
    uniqueVisitors: number;
    conversionRate: number;
    recentActivity: Array<{
      action: string;
      timestamp: string;
      funnelName: string;
      deviceType: string;
    }>;
    deviceBreakdown: Record<string, number>;
  } = {
    totalScans: 0,
    uniqueVisitors: 0,
    conversionRate: 0,
    recentActivity: [],
    deviceBreakdown: {}
  }

  if (funnelIds.length > 0) {
    // Get total scans
    const { count: totalScans } = await supabase
      .from('click_events')
      .select('*', { count: 'exact', head: true })
      .in('funnel_id', funnelIds)

    // Get unique visitors (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: uniqueVisitorData } = await supabase
      .from('click_events')
      .select('session_id')
      .in('funnel_id', funnelIds)
      .gte('created_at', thirtyDaysAgo)

    const uniqueVisitors = new Set(uniqueVisitorData?.map(v => v.session_id) || []).size

    // Get conversions
    const { count: conversions } = await supabase
      .from('click_events')
      .select('*', { count: 'exact', head: true })
      .in('funnel_id', funnelIds)
      .in('action', ['callback_request', 'vcard_download'])
      .gte('created_at', thirtyDaysAgo)

    const conversionRate = totalScans ? ((conversions || 0) / totalScans * 100) : 0

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('click_events')
      .select(`
        action,
        created_at,
        metadata,
        funnels!inner(name)
      `)
      .in('funnel_id', funnelIds)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get device breakdown
    const { data: deviceData } = await supabase
      .from('click_events')
      .select('metadata')
      .in('funnel_id', funnelIds)
      .gte('created_at', thirtyDaysAgo)

    const deviceBreakdown = deviceData?.reduce((acc: Record<string, number>, event) => {
      const deviceType = event.metadata?.device_type || 'unknown'
      acc[deviceType] = (acc[deviceType] || 0) + 1
      return acc
    }, {}) || {}

    analyticsData = {
      totalScans: totalScans || 0,
      uniqueVisitors,
      conversionRate: Math.round(conversionRate * 10) / 10,
      recentActivity: (recentActivity || []).map((activity: Record<string, unknown>) => ({
        action: activity.action as string,
        timestamp: activity.created_at as string,
        funnelName: (Array.isArray(activity.funnels) ? activity.funnels[0]?.name : (activity.funnels as { name: string } | null)?.name || 'Unknown') as string,
        deviceType: (activity.metadata as { device_type?: string } | null)?.device_type || 'unknown'
      })),
      deviceBreakdown
    }
  }

  return (
    <Box>
      <Box mb={8}>
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
          Analytics Dashboard
        </h1>
        <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
          Track your funnel performance and engagement metrics
        </p>
      </Box>

      <InteractiveAnalytics
        initialData={{
          totalScans: analyticsData.totalScans,
          uniqueVisitors: analyticsData.uniqueVisitors,
          conversionRate: analyticsData.conversionRate,
          activeFunnels: funnels?.length || 0,
          deviceBreakdown: analyticsData.deviceBreakdown
        }}
      />

      <Box mt={8}>
        <RecentActivity events={analyticsData.recentActivity} />
      </Box>

      <Box bg="bg.default" p={6} boxShadow="sm">
        <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'fg.default', mb: 4 })}>
          Your Funnels
        </h2>
        {funnels && funnels.length > 0 ? (
          <Grid columns={{ base: 1, md: 2 }} gap={4}>
            {funnels.map((funnel) => (
              <Box key={funnel.id} p={4} border="1px solid" borderColor="border.default">
                <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  {funnel.name}
                </h3>
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                  Created {new Date(funnel.created_at).toISOString().split('T')[0]}
                </p>
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 2 })}>
                  Individual analytics coming in Phase 2
                </p>
              </Box>
            ))}
          </Grid>
        ) : (
          <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            No funnels found. Create your first funnel to start tracking analytics.
          </p>
        )}
      </Box>
    </Box>
  )
}