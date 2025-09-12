'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface ChartDataPoint {
  timestamp: string
  value: number
  label: string
}

interface TimeSeriesChartProps {
  title: string
  period: '24h' | '7d' | '30d'
  metric: 'scans' | 'visitors' | 'conversions'
  funnelId?: string
}

export default function TimeSeriesChart({ title, period, metric, funnelId }: TimeSeriesChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [period, metric, funnelId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period,
        metric,
        ...(funnelId && { funnelId })
      })
      
      const response = await fetch(`/api/analytics/timeseries?${params}`)
      const result = await response.json()
      setData(result.data || [])
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)

  if (loading) {
    return (
      <Box bg="bg.default" p={6} boxShadow="sm">
        <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'fg.default', mb: 4 })}>
          {title}
        </h2>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Loading chart...</p>
      </Box>
    )
  }

  return (
    <Box bg="bg.default" p={6} boxShadow="sm">
      <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'fg.default', mb: 4 })}>
        {title}
      </h2>
      
      {data.length > 0 ? (
        <Box>
          {/* Simple bar chart using CSS */}
          <div className={css({ display: 'flex', alignItems: 'end', gap: 1, height: '200px', mb: 4 })}>
            {data.map((point, index) => (
              <div
                key={index}
                className={css({
                  flex: '1',
                  colorPalette: 'mint',
                  bg: 'colorPalette.default',
                  minHeight: '4px',
                  transition: 'all 0.3s ease',
                  _hover: { bg: 'colorPalette.emphasized' },
                  position: 'relative',
                  cursor: 'pointer'
                })}
                style={{
                  height: `${Math.max((point.value / maxValue) * 180, 4)}px`
                }}
                title={`${point.label}: ${point.value} ${metric}`}
              />
            ))}
          </div>
          
          {/* X-axis labels */}
          <div className={css({ display: 'flex', justifyContent: 'space-between' })}>
            {data.filter((_, index) => {
              const step = Math.ceil(data.length / 6) // Show max 6 labels
              return index % step === 0
            }).map((point, index) => (
              <span key={index} className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                {point.label}
              </span>
            ))}
          </div>
        </Box>
      ) : (
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
          No data available for the selected period
        </p>
      )}
    </Box>
  )
}