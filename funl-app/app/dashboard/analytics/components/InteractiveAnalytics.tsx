'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Grid, Flex } from '@/styled-system/jsx'
import MetricCard from './MetricCard'
import TimeSeriesChart from './TimeSeriesChart'
import DeviceBreakdown from './DeviceBreakdown'
import PeriodSelector from './PeriodSelector'

interface InteractiveAnalyticsProps {
  initialData: {
    totalScans: number
    uniqueVisitors: number
    conversionRate: number
    activeFunnels: number
    deviceBreakdown: { [key: string]: number }
  }
}

export default function InteractiveAnalytics({ initialData }: InteractiveAnalyticsProps) {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('30d')
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (period !== '30d') { // Initial data is for 30d
      fetchAnalytics()
    }
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?period=${period}`)
      const result = await response.json()
      setData({
        totalScans: result.totalScans,
        uniqueVisitors: result.uniqueVisitors,
        conversionRate: result.conversionRate,
        activeFunnels: result.activeFunnels,
        deviceBreakdown: result.deviceBreakdown
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch(`/api/analytics?period=${period}&export=csv`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '24h': return 'Last 24 hours'
      case '7d': return 'Last 7 days'
      case '30d': return 'Last 30 days'
      case 'all': return 'All time'
      default: return 'Last 30 days'
    }
  }

  return (
    <Box>
      {/* Controls */}
      <Flex justify="space-between" align="center" mb={6}>
        <PeriodSelector selected={period} onChange={setPeriod} />
        
        <button
          onClick={exportData}
          className={css({
            colorPalette: 'mint',
            px: 4,
            py: 2,
            fontSize: 'sm',
            fontWeight: 'medium',
            color: 'colorPalette.text',
            bg: 'colorPalette.subtle',
            borderWidth: '1px',
            borderColor: 'colorPalette.muted',
            cursor: 'pointer',
            _hover: { bg: 'colorPalette.emphasized' }
          })}
        >
          Export Data
        </button>
      </Flex>

      {/* Metrics Cards */}
      <Grid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
        <MetricCard
          title="Total Scans"
          value={data.totalScans}
          subtitle={getPeriodLabel(period)}
          loading={loading}
        />
        <MetricCard
          title="Unique Visitors"
          value={data.uniqueVisitors}
          subtitle={getPeriodLabel(period)}
          loading={loading}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${data.conversionRate}%`}
          subtitle={getPeriodLabel(period)}
          loading={loading}
        />
        <MetricCard
          title="Active Funnels"
          value={data.activeFunnels}
          subtitle="Total created"
          loading={false}
        />
      </Grid>

      {/* Charts */}
      <Grid columns={{ base: 1, lg: 2 }} gap={6}>
        <TimeSeriesChart
          title="Scans Over Time"
          period={period}
          metric="scans"
        />
        <DeviceBreakdown 
          data={data.deviceBreakdown} 
          loading={loading}
        />
      </Grid>
    </Box>
  )
}