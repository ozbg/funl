'use client'

import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge'
import { PlanBadge } from './PlanBadge'
import { FunnelUsageBar } from './FunnelUsageBar'
import { SubscriptionHistoryPanel } from './SubscriptionHistoryPanel'

interface Subscription {
  id: string
  business_id: string
  status: 'active' | 'trialing' | 'canceled' | 'past_due'
  billing_period: 'weekly' | 'monthly'
  current_period_start: string
  current_period_end: string
  trial_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  business: {
    id: string
    name: string
    email: string
  }
  subscription_plan: {
    id: string
    name: string
    funnel_limit: number
  }
  total_funnel_limit: number
  current_funnel_usage: number
}

interface SubscriptionDetailDrawerProps {
  subscription: Subscription
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

export function SubscriptionDetailDrawer({
  subscription,
  isOpen,
  onClose,
  onRefresh: _onRefresh
}: SubscriptionDetailDrawerProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="rgba(0, 0, 0, 0.5)"
        zIndex="40"
        onClick={onClose}
      />

      {/* Drawer */}
      <Box
        position="fixed"
        top="0"
        right="0"
        bottom="0"
        w="full"
        maxW="2xl"
        bg="bg.default"
        boxShadow="xl"
        zIndex="50"
        overflowY="auto"
      >
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          p={6}
          borderBottomWidth="1px"
          borderColor="border.default"
          position="sticky"
          top="0"
          bg="bg.default"
          zIndex="10"
        >
          <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'fg.default' })}>
            Subscription Details
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className={css({
              fontSize: 'xl'
            })}
          >
            ✕
          </Button>
        </Flex>

        {/* Content */}
        <Box p={6}>
          {/* Business Info */}
          <Box mb={6}>
            <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.muted', mb: 2, textTransform: 'uppercase' })}>
              Business
            </h3>
            <p className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'fg.default' })}>
              {subscription.business.name}
            </p>
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              {subscription.business.email}
            </p>
          </Box>

          {/* Subscription Info */}
          <Box mb={6} p={4} bg="bg.muted" rounded="lg">
            <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.muted', mb: 3, textTransform: 'uppercase' })}>
              Subscription
            </h3>

            <Flex justify="space-between" align="center" mb={3}>
              <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Status</span>
              <SubscriptionStatusBadge status={subscription.status} />
            </Flex>

            <Flex justify="space-between" align="center" mb={3}>
              <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Plan</span>
              <PlanBadge
                planName={subscription.subscription_plan.name}
                billingPeriod={subscription.billing_period}
              />
            </Flex>

            <Flex justify="space-between" align="center" mb={3}>
              <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Created</span>
              <span className={css({ fontSize: 'sm', color: 'fg.default' })}>
                {new Date(subscription.created_at).toLocaleDateString()}
              </span>
            </Flex>

            <Flex justify="space-between" align="center" mb={3}>
              <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Period Start</span>
              <span className={css({ fontSize: 'sm', color: 'fg.default' })}>
                {new Date(subscription.current_period_start).toLocaleDateString()}
              </span>
            </Flex>

            <Flex justify="space-between" align="center" mb={3}>
              <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Period End</span>
              <span className={css({ fontSize: 'sm', color: 'fg.default' })}>
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </Flex>

            {subscription.trial_end && (
              <Flex justify="space-between" align="center" mb={3}>
                <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Trial Ends</span>
                <span className={css({ fontSize: 'sm', color: 'fg.default', fontWeight: 'medium' })}>
                  {new Date(subscription.trial_end).toLocaleDateString()}
                </span>
              </Flex>
            )}

            {subscription.cancel_at_period_end && (
              <Flex justify="space-between" align="center" mb={3}>
                <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Cancels At</span>
                <span className={css({ fontSize: 'sm', color: 'fg.default', fontWeight: 'medium' })}>
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              </Flex>
            )}

            {subscription.canceled_at && (
              <Flex justify="space-between" align="center" mb={3}>
                <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Canceled On</span>
                <span className={css({ fontSize: 'sm', color: 'fg.muted', fontWeight: 'medium' })}>
                  {new Date(subscription.canceled_at).toLocaleDateString()}
                </span>
              </Flex>
            )}
          </Box>

          {/* Funnel Usage */}
          <Box mb={6}>
            <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.muted', mb: 3, textTransform: 'uppercase' })}>
              Funnel Usage
            </h3>
            <FunnelUsageBar
              current={subscription.current_funnel_usage}
              limit={subscription.total_funnel_limit}
              size="lg"
            />
            <Flex justify="space-between" mt={2}>
              <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                Base limit: {subscription.subscription_plan.funnel_limit}
              </span>
              <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                Addon funnels: {subscription.total_funnel_limit - subscription.subscription_plan.funnel_limit}
              </span>
            </Flex>
          </Box>

          {/* History */}
          <Box>
            <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.muted', mb: 3, textTransform: 'uppercase' })}>
              History
            </h3>
            <SubscriptionHistoryPanel businessId={subscription.business_id} />
          </Box>
        </Box>
      </Box>
    </>
  )
}
