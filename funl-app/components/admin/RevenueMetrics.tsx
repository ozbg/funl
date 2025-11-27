'use client'

import { Box, Grid, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface RevenueData {
  mrr: number
  arr: number
  total_revenue: number
  monthly_revenue: number
  weekly_recurring_revenue: number
  mrr_growth_percent?: number
  active_subscriptions: number
  period_days: number
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

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A'
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
          {data.mrr_growth_percent !== undefined && (
            <p className={css({
              fontSize: 'sm',
              color: data.mrr_growth_percent >= 0 ? 'accent.default' : 'fg.default',
              mt: 1
            })}>
              {formatPercent(data.mrr_growth_percent)} vs {data.period_days}d ago
            </p>
          )}
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
            Total Revenue
          </p>
          <p className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default' })}>
            {formatCurrency(data.total_revenue)}
          </p>
        </Box>

        {/* Monthly Revenue */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            This Month
          </p>
          <p className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default' })}>
            {formatCurrency(data.monthly_revenue)}
          </p>
        </Box>

        {/* Active Subscriptions */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            Active Subscriptions
          </p>
          <p className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default' })}>
            {data.active_subscriptions}
          </p>
        </Box>

        {/* Weekly Revenue */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            Weekly Recurring
          </p>
          <p className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default' })}>
            {formatCurrency(data.weekly_recurring_revenue)}
          </p>
        </Box>
      </Grid>
    </Box>
  )
}
