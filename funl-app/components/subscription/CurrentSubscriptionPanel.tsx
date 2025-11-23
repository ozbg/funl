'use client'

import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'

interface CurrentSubscriptionPanelProps {
  subscription: {
    subscription_plan: {
      name: string
      funnel_limit: number
    }
    status: string
    billing_period: string
    current_period_end: string
    trial_end?: string
  } | null
  funnelUsage: {
    current: number
    limit: number
    plan_limit: number
    addon_limit: number
  }
}

export function CurrentSubscriptionPanel({
  subscription,
  funnelUsage,
}: CurrentSubscriptionPanelProps) {
  if (!subscription) {
    return (
      <Box
        bg="orange.50"
        borderWidth="1px"
        borderColor="orange.200"
        rounded="lg"
        p={6}
      >
        <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'orange.900', mb: 2 })}>
          No Active Subscription
        </h3>
        <p className={css({ color: 'orange.800', fontSize: 'sm' })}>
          Choose a plan below to get started and create your first funnel.
        </p>
      </Box>
    )
  }

  const isTrialing = subscription.status === 'trialing'
  const trialEndsAt = subscription.trial_end
    ? new Date(subscription.trial_end).toLocaleDateString()
    : null
  const periodEndsAt = new Date(subscription.current_period_end).toLocaleDateString()

  const usagePercentage = (funnelUsage.current / funnelUsage.limit) * 100
  const isNearLimit = usagePercentage >= 80
  const isAtLimit = funnelUsage.current >= funnelUsage.limit

  return (
    <Box
      bg="bg.default"
      rounded="lg"
      boxShadow="sm"
      borderWidth="1px"
      borderColor="border.default"
      p={6}
    >
      <Flex justify="space-between" align="start" mb={4}>
        <Box>
          <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default' })}>
            {subscription.subscription_plan.name} Plan
          </h2>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
            Billed {subscription.billing_period}
          </p>
        </Box>

        <Box
          px={3}
          py={1}
          rounded="md"
          fontSize="sm"
          fontWeight="medium"
          bg={isTrialing ? 'purple.100' : 'green.100'}
          color={isTrialing ? 'purple.800' : 'green.800'}
        >
          {isTrialing ? 'Trial' : 'Active'}
        </Box>
      </Flex>

      {/* Trial Alert */}
      {isTrialing && trialEndsAt && (
        <Box bg="purple.50" borderWidth="1px" borderColor="purple.200" rounded="md" p={3} mb={4}>
          <p className={css({ fontSize: 'sm', color: 'purple.800' })}>
            Trial ends on {trialEndsAt}. You won&apos;t be charged until then.
          </p>
        </Box>
      )}

      {/* Funnel Usage */}
      <Box mb={4}>
        <Flex justify="space-between" align="baseline" mb={2}>
          <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default' })}>
            Funnel Usage
          </h3>
          <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            {funnelUsage.current} of {funnelUsage.limit} used
          </p>
        </Flex>

        {/* Progress Bar */}
        <Box bg="gray.200" rounded="full" height="8px" overflow="hidden">
          <Box
            bg={isAtLimit ? 'red.500' : isNearLimit ? 'orange.500' : 'blue.600'}
            height="100%"
            width={`${Math.min(usagePercentage, 100)}%`}
            transition="width 0.3s"
          />
        </Box>

        {/* Breakdown */}
        <Grid columns={2} gap={4} mt={3}>
          <Box>
            <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>
              Plan Funnels
            </p>
            <p className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
              {funnelUsage.plan_limit}
            </p>
          </Box>
          {funnelUsage.addon_limit > 0 && (
            <Box>
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>
                Addon Funnels
              </p>
              <p className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'blue.600' })}>
                +{funnelUsage.addon_limit}
              </p>
            </Box>
          )}
        </Grid>

        {/* At Limit Warning */}
        {isAtLimit && (
          <Box bg="red.50" borderWidth="1px" borderColor="red.200" rounded="md" p={3} mt={3}>
            <p className={css({ fontSize: 'sm', color: 'red.800', fontWeight: 'medium' })}>
              You&apos;ve reached your funnel limit. Upgrade your plan or purchase additional funnels
              to create more.
            </p>
          </Box>
        )}

        {/* Near Limit Warning */}
        {isNearLimit && !isAtLimit && (
          <Box bg="orange.50" borderWidth="1px" borderColor="orange.200" rounded="md" p={3} mt={3}>
            <p className={css({ fontSize: 'sm', color: 'orange.800' })}>
              You&apos;re approaching your funnel limit. Consider upgrading or purchasing additional
              funnels.
            </p>
          </Box>
        )}
      </Box>

      {/* Next Billing Date */}
      <Box
        pt={4}
        borderTopWidth="1px"
        borderColor="border.default"
      >
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
          Next billing date: <span className={css({ fontWeight: 'medium', color: 'fg.default' })}>{periodEndsAt}</span>
        </p>
      </Box>
    </Box>
  )
}
