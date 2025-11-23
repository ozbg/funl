'use client'

import { Box, Grid, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface SubscriptionData {
  total_subscriptions: number
  active_subscriptions: number
  trialing_subscriptions: number
  canceled_subscriptions: number
  expired_subscriptions: number
  churn_rate: number
  trial_conversion_rate: number
  plan_distribution: Array<{
    plan_name: string
    count: number
    percentage: number
  }>
  new_subscriptions: number
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

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

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
            {data.active_subscriptions}
          </p>
        </Box>

        {/* Trialing */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            In Trial
          </p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'blue.600' })}>
            {data.trialing_subscriptions}
          </p>
        </Box>

        {/* New Subscriptions */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            New (30d)
          </p>
          <p className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default' })}>
            {data.new_subscriptions}
          </p>
        </Box>

        {/* Canceled */}
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
            Canceled (30d)
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
              color: data.churn_rate > 5 ? 'red.600' : data.churn_rate > 2 ? 'yellow.600' : 'green.600'
            })}>
              {formatPercent(data.churn_rate)}
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
            color: data.trial_conversion_rate > 50 ? 'green.600' : data.trial_conversion_rate > 30 ? 'yellow.600' : 'red.600'
          })}>
            {formatPercent(data.trial_conversion_rate)}
          </p>
        </Box>
      </Grid>

      {/* Plan Distribution */}
      {data.plan_distribution && data.plan_distribution.length > 0 && (
        <Box mt={6} pt={6} borderTopWidth="1px" borderColor="border.default">
          <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 3 })}>
            Plan Distribution
          </p>
          <Box>
            {data.plan_distribution.map((plan) => (
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
