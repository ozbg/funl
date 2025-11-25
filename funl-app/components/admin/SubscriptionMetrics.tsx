'use client'

import { Box, Grid, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface SubscriptionData {
  total_subscriptions: number
  status_breakdown: {
    active: number
    trialing: number
    canceled: number
    past_due: number
  }
  new_subscriptions: number
  canceled_subscriptions: number
  churn_rate_percent: number
  trial_conversion_rate_percent: number
  trials_started: number
  trials_converted: number
  plan_distribution: Record<string, { count: number; name: string }>
  period_days: number
}

interface SubscriptionMetricsProps {
  data: SubscriptionData | null
}

export function SubscriptionMetrics({ data }: SubscriptionMetricsProps) {
  if (!data) {
    return (
      <Box bg="bg.default" p={6} rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default', mb: 4 })}>
          Subscription Metrics
        </h2>
        <p className={css({ color: 'fg.muted', textAlign: 'center', py: 8 })}>
          Unable to load subscription data
        </p>
      </Box>
    )
  }

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A'
    return `${value.toFixed(1)}%`
  }

  // Convert plan_distribution object to array with percentages
  const planDistArray = Object.entries(data.plan_distribution).map(([id, info]) => ({
    plan_name: info.name,
    count: info.count,
    percentage: data.status_breakdown.active + data.status_breakdown.trialing > 0
      ? (info.count / (data.status_breakdown.active + data.status_breakdown.trialing)) * 100
      : 0
  }))

  return (
    <Box bg="bg.default" p={6} rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
      <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default', mb: 6 })}>
        Subscription Metrics
      </h2>

      <Grid columns={2} gap={4}>
        {/* Active Subscriptions */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            Active Subscriptions
          </p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'green.600' })}>
            {data.status_breakdown.active}
          </p>
        </Box>

        {/* Trialing */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            In Trial
          </p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'blue.600' })}>
            {data.status_breakdown.trialing}
          </p>
        </Box>

        {/* New Subscriptions */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            New ({data.period_days}d)
          </p>
          <p className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default' })}>
            {data.new_subscriptions}
          </p>
        </Box>

        {/* Canceled */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            Canceled ({data.period_days}d)
          </p>
          <p className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'red.600' })}>
            {data.canceled_subscriptions}
          </p>
        </Box>

        {/* Churn Rate */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            Churn Rate
          </p>
          <Flex align="center" gap={2}>
            <p className={css({
              fontSize: 'xl',
              fontWeight: 'semibold',
              color: data.churn_rate_percent > 5 ? 'red.600' : data.churn_rate_percent > 2 ? 'yellow.600' : 'green.600'
            })}>
              {formatPercent(data.churn_rate_percent)}
            </p>
          </Flex>
        </Box>

        {/* Trial Conversion */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            Trial Conversion
          </p>
          <p className={css({
            fontSize: 'xl',
            fontWeight: 'semibold',
            color: data.trial_conversion_rate_percent > 50 ? 'green.600' : data.trial_conversion_rate_percent > 30 ? 'yellow.600' : 'red.600'
          })}>
            {formatPercent(data.trial_conversion_rate_percent)}
          </p>
          <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
            {data.trials_converted} of {data.trials_started}
          </p>
        </Box>
      </Grid>

      {/* Plan Distribution */}
      {planDistArray.length > 0 && (
        <Box mt={6} pt={6} borderTopWidth="1px" borderColor="border.default">
          <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 3 })}>
            Plan Distribution
          </p>
          <Box>
            {planDistArray.map((plan) => (
              <Flex key={plan.plan_name} justify="space-between" align="center" mb={3}>
                <Box flex="1">
                  <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                    {plan.plan_name}
                  </p>
                  <Box
                    mt={1}
                    h="6px"
                    bg="bg.muted"
                    rounded="full"
                    overflow="hidden"
                  >
                    <Box
                      h="full"
                      bg="accent.default"
                      style={{ width: `${plan.percentage}%` }}
                    />
                  </Box>
                </Box>
                <Flex gap={3} ml={4} align="center">
                  <p className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default' })}>
                    {plan.count}
                  </p>
                  <p className={css({ fontSize: 'sm', color: 'fg.muted', minWidth: '45px', textAlign: 'right' })}>
                    {formatPercent(plan.percentage)}
                  </p>
                </Flex>
              </Flex>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
