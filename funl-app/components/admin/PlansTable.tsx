'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { PriceDisplay } from './PriceDisplay'
import { EditPlanDialog } from './EditPlanDialog'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price_monthly: number
  billing_period: string
  funnel_limit: number
  trial_period_days: number
  is_active: boolean
  is_default: boolean
  featured: boolean
  subscriber_count: number
}

interface PlansTableProps {
  initialPlans: Plan[]
}

export function PlansTable({ initialPlans }: PlansTableProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredPlans = plans.filter(plan => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'active') return plan.is_active
    if (statusFilter === 'inactive') return !plan.is_active
    return true
  })

  const handleRefresh = async () => {
    const response = await fetch('/api/admin/plans')
    const { plans: updatedPlans } = await response.json()
    setPlans(updatedPlans)
  }

  return (
    <Box>
      {/* Filters */}
      <Flex gap={4} p={4} borderBottomWidth="1px" borderColor="border.default">
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
              ringOffset: '0'
            }
          })}
        >
          <option value="all">All Plans</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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
            _hover: { bg: 'bg.default' }
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
                Plan Name
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Price
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Funnel Limit
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Trial
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Subscribers
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Status
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'right', fontWeight: 'semibold', color: 'fg.default' })}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPlans.map((plan) => (
              <tr
                key={plan.id}
                className={css({
                  borderBottomWidth: '1px',
                  borderColor: 'border.default',
                  _hover: { bg: 'bg.muted' }
                })}
              >
                <td className={css({ px: 4, py: 3 })}>
                  <p className={css({ fontWeight: 'medium', color: 'fg.default' })}>
                    {plan.name}
                  </p>
                  {plan.description && (
                    <p className={css({ fontSize: 'xs', color: 'fg.muted', lineClamp: 1 })}>
                      {plan.description}
                    </p>
                  )}
                  <Flex gap={2} mt={1}>
                    {plan.is_default && (
                      <span className={css({ fontSize: 'xs', px: 2, py: 0.5, bg: 'blue.100', color: 'blue.700', rounded: 'md' })}>
                        Default
                      </span>
                    )}
                    {plan.featured && (
                      <span className={css({ fontSize: 'xs', px: 2, py: 0.5, bg: 'yellow.100', color: 'yellow.700', rounded: 'md' })}>
                        Featured
                      </span>
                    )}
                  </Flex>
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <PriceDisplay cents={plan.price_monthly} size="sm" />
                  <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>/ {plan.billing_period}</p>
                </td>
                <td className={css({ px: 4, py: 3, color: 'fg.default' })}>
                  {plan.funnel_limit} funnels
                </td>
                <td className={css({ px: 4, py: 3, color: 'fg.muted' })}>
                  {plan.trial_period_days > 0 ? `${plan.trial_period_days} days` : 'None'}
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <span className={css({ fontWeight: 'medium', color: 'fg.default' })}>
                    {plan.subscriber_count}
                  </span>
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <span className={css({
                    px: 2.5,
                    py: 1,
                    fontSize: 'xs',
                    fontWeight: 'medium',
                    rounded: 'full',
                    color: plan.is_active ? 'green.700' : 'gray.700',
                    bg: plan.is_active ? 'green.100' : 'gray.100'
                  })}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <Flex gap={2} justify="flex-end">
                    <EditPlanDialog plan={plan} onSuccess={handleRefresh} />
                  </Flex>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPlans.length === 0 && (
          <Box p={8} textAlign="center">
            <p className={css({ color: 'fg.muted' })}>No plans found</p>
          </Box>
        )}
      </Box>
    </Box>
  )
}
