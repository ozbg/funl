'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge'
import { PlanBadge } from './PlanBadge'
import { FunnelUsageBar } from './FunnelUsageBar'
import { ChangePlanDialog } from './ChangePlanDialog'
import { ExtendTrialDialog } from './ExtendTrialDialog'
import { CancelSubscriptionDialog } from './CancelSubscriptionDialog'
import { AddAddonFunnelsDialog } from './AddAddonFunnelsDialog'
import { SubscriptionDetailDrawer } from './SubscriptionDetailDrawer'

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
    price_monthly: number
    price_weekly: number
  }
  total_funnel_limit: number
  current_funnel_usage: number
}

interface SubscriptionsTableProps {
  initialSubscriptions: Subscription[]
  plans: Array<{
    id: string
    name: string
    funnel_limit: number
    price_monthly: number
    price_weekly: number
  }>
}

export function SubscriptionsTable({ initialSubscriptions, plans }: SubscriptionsTableProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
    const matchesSearch = !searchQuery ||
      sub.business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.business.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleRefresh = async () => {
    const response = await fetch('/api/admin/subscriptions')
    const { subscriptions: updatedSubs } = await response.json()
    setSubscriptions(updatedSubs)
  }

  const handleViewDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setIsDetailDrawerOpen(true)
  }

  return (
    <Box>
      {/* Filters */}
      <Flex gap={4} p={4} borderBottomWidth="1px" borderColor="border.default">
        <input
          type="text"
          placeholder="Search by business name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={css({
            flex: 1,
            px: 3,
            py: 2,
            fontSize: 'sm',
            bg: 'bg.muted',
            borderWidth: '1px',
            borderColor: 'border.default',
            rounded: 'md',
            outline: 'none',
            _focus: {
              borderColor: 'accent.default',
              ring: '2px',
              ringColor: 'accent.default',
              ringOffset: "0"
            }
          })}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={css({
            px: 3,
            py: 2,
            fontSize: 'sm',
            bg: 'bg.muted',
            borderWidth: '1px',
            borderColor: 'border.default',
            rounded: 'md',
            outline: 'none',
            cursor: 'pointer',
            _focus: {
              borderColor: 'accent.default',
              ring: '2px',
              ringColor: 'accent.default',
              ringOffset: "0"
            }
          })}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="canceled">Canceled</option>
          <option value="past_due">Past Due</option>
        </select>
        <button
          onClick={handleRefresh}
          className={css({
            px: 4,
            py: 2,
            fontSize: 'sm',
            fontWeight: 'medium',
            bg: 'bg.muted',
            borderWidth: '1px',
            borderColor: 'border.default',
            rounded: 'md',
            cursor: 'pointer',
            _hover: {
              bg: 'bg.default'
            }
          })}
        >
          Refresh
        </button>
      </Flex>

      {/* Table */}
      <Box overflowX="auto">
        <table className={css({ w: 'full', fontSize: 'sm' })}>
          <thead className={css({ bg: 'bg.muted', borderBottomWidth: '1px', borderColor: 'border.default' })}>
            <tr>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Business
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Plan
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Status
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Funnel Usage
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Period End
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'right', fontWeight: 'semibold', color: 'fg.default' })}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.map((subscription) => (
              <tr
                key={subscription.id}
                className={css({
                  borderBottomWidth: '1px',
                  borderColor: 'border.default',
                  _hover: { bg: 'bg.muted' }
                })}
              >
                <td className={css({ px: 4, py: 3 })}>
                  <p className={css({ fontWeight: 'medium', color: 'fg.default' })}>
                    {subscription.business.name}
                  </p>
                  <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                    {subscription.business.email}
                  </p>
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <PlanBadge
                    planName={subscription.subscription_plan.name}
                    billingPeriod={subscription.billing_period}
                    size="sm"
                  />
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <SubscriptionStatusBadge status={subscription.status} size="sm" />
                  {subscription.cancel_at_period_end && (
                    <p className={css({ fontSize: 'xs', color: 'orange.600', mt: 1 })}>
                      Cancels at period end
                    </p>
                  )}
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <Box w="40">
                    <FunnelUsageBar
                      current={subscription.current_funnel_usage}
                      limit={subscription.total_funnel_limit}
                      size="sm"
                      showLabel={false}
                    />
                    <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                      {subscription.current_funnel_usage} / {subscription.total_funnel_limit}
                    </p>
                  </Box>
                </td>
                <td className={css({ px: 4, py: 3, color: 'fg.muted' })}>
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <Flex gap={2} justify="flex-end">
                    <button
                      onClick={() => handleViewDetails(subscription)}
                      className={css({
                        px: 3,
                        py: 1,
                        fontSize: 'xs',
                        fontWeight: 'medium',
                        color: 'accent.default',
                        cursor: 'pointer',
                        _hover: { textDecoration: 'underline' }
                      })}
                    >
                      Details
                    </button>
                    <ChangePlanDialog subscription={subscription} plans={plans} onSuccess={handleRefresh} />
                    {subscription.status === 'trialing' && (
                      <ExtendTrialDialog subscription={subscription} onSuccess={handleRefresh} />
                    )}
                    <AddAddonFunnelsDialog subscription={subscription} onSuccess={handleRefresh} />
                    {subscription.status !== 'canceled' && (
                      <CancelSubscriptionDialog subscription={subscription} onSuccess={handleRefresh} />
                    )}
                  </Flex>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSubscriptions.length === 0 && (
          <Box p={8} textAlign="center">
            <p className={css({ color: 'fg.muted' })}>No subscriptions found</p>
          </Box>
        )}
      </Box>

      {/* Detail Drawer */}
      {selectedSubscription && (
        <SubscriptionDetailDrawer
          subscription={selectedSubscription}
          isOpen={isDetailDrawerOpen}
          onClose={() => setIsDetailDrawerOpen(false)}
          onRefresh={handleRefresh}
        />
      )}
    </Box>
  )
}
