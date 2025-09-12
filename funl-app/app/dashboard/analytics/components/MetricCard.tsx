'use client'

import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    positive: boolean
  }
  loading?: boolean
}

export default function MetricCard({ title, value, subtitle, trend, loading = false }: MetricCardProps) {
  return (
    <Box bg="bg.default" p={6} boxShadow="sm">
      <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 2 })}>
        {title}
      </h3>
      
      <div className={css({ display: 'flex', alignItems: 'baseline', gap: 2 })}>
        <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
          {loading ? (
            <span className={css({ color: 'fg.muted' })}>Loading...</span>
          ) : (
            value
          )}
        </p>
        
        {trend && !loading && (
          <span className={css({
            fontSize: 'xs',
            fontWeight: 'medium',
            color: trend.positive ? 'green.600' : 'red.600',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          })}>
            <span>{trend.positive ? '↗' : '↘'}</span>
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      
      {subtitle && (
        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
          {subtitle}
        </p>
      )}
    </Box>
  )
}