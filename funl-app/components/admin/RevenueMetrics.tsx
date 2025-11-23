'use client'

import { Box, Grid, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface RevenueData {
  mrr: number
  arr: number
  total_revenue: number
  revenue_by_period: Array<{
    date: string
    revenue: number
  }>
  growth_rate: number
  average_revenue_per_user: number
}

interface RevenueMetricsProps {
  data: RevenueData | null
}

export function RevenueMetrics({ data }: RevenueMetricsProps) {
  if (!data) {
    return (
      <Box bg="bg.default" p={6} rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default', mb: 4 })}>
          Revenue Metrics
        </h2>
        <p className={css({ color: 'fg.muted', textAlign: 'center', py: 8 })}>
          Unable to load revenue data
        </p>
      </Box>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <Box bg="bg.default" p={6} rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
      <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default', mb: 6 })}>
        Revenue Metrics
      </h2>

      <Grid columns={2} gap={4}>
        {/* MRR */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            Monthly Recurring Revenue
          </p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'accent.default' })}>
            {formatCurrency(data.mrr)}
          </p>
        </Box>

        {/* ARR */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            Annual Recurring Revenue
          </p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'accent.default' })}>
            {formatCurrency(data.arr)}
          </p>
        </Box>

        {/* Total Revenue */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            Total Revenue (30d)
          </p>
          <p className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default' })}>
            {formatCurrency(data.total_revenue)}
          </p>
        </Box>

        {/* Growth Rate */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            Growth Rate
          </p>
          <Flex align="center" gap={2}>
            <p className={css({
              fontSize: 'xl',
              fontWeight: 'semibold',
              color: data.growth_rate >= 0 ? 'green.600' : 'red.600'
            })}>
              {formatPercent(data.growth_rate)}
            </p>
          </Flex>
        </Box>

        {/* ARPU */}
        <Box gridColumn="span 2">
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            Average Revenue Per User
          </p>
          <p className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default' })}>
            {formatCurrency(data.average_revenue_per_user)}
          </p>
        </Box>
      </Grid>

      {/* Revenue Chart Placeholder */}
      {data.revenue_by_period && data.revenue_by_period.length > 0 && (
        <Box mt={6} pt={6} borderTopWidth="1px" borderColor="border.default">
          <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 3 })}>
            Revenue Trend (Last 30 Days)
          </p>
          <Box
            h="120px"
            bg="bg.muted"
            rounded="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              Chart visualization (implement with charting library)
            </p>
          </Box>
        </Box>
      )}
    </Box>
  )
}
