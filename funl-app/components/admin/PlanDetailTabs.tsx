'use client'

import { useState, useEffect } from 'react'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface Plan {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_weekly: number
  billing_period: 'monthly' | 'weekly'
  funnel_limit: number
  trial_period_days: number
  description: string | null
  features: string[]
}

interface PlanDetailTabsProps {
  plan: Plan
}

export function PlanDetailTabs({ plan }: PlanDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'customers' | 'history'>('details')
  const [customers, setCustomers] = useState<Array<{
    business_id: string
    business_name: string
    email: string
    subscription_status: string
    billing_period: string
    started_at: string
  }>>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)

  const tabs = [
    { id: 'details' as const, label: 'Details' },
    { id: 'customers' as const, label: 'Customers' },
    { id: 'history' as const, label: 'History' },
  ]

  // Load customers when tab is selected
  useEffect(() => {
    if (activeTab === 'customers') {
      loadCustomers()
    }
  }, [activeTab])

  const loadCustomers = async () => {
    setIsLoadingCustomers(true)
    try {
      const response = await fetch(`/api/admin/plans/${plan.id}/customers`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount)
  }

  return (
    <Box>
      {/* Tab Navigation */}
      <Flex
        borderBottomWidth="1px"
        borderColor="border.default"
        mb={6}
        gap={1}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={css({
              px: 4,
              py: 3,
              fontSize: 'sm',
              fontWeight: 'medium',
              color: activeTab === tab.id ? 'accent.default' : 'fg.muted',
              borderBottomWidth: '2px',
              borderColor: activeTab === tab.id ? 'accent.default' : 'transparent',
              cursor: 'pointer',
              _hover: {
                color: activeTab === tab.id ? 'accent.default' : 'fg.default',
              },
            })}
          >
            {tab.label}
          </button>
        ))}
      </Flex>

      {/* Tab Content */}
      <Box>
        {activeTab === 'details' && (
          <Box maxWidth="800px">
            <Grid columns={2} gap={6} mb={6}>
              {/* Basic Info */}
              <Box>
                <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 2 })}>
                  Plan Name
                </h3>
                <p className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>{plan.name}</p>
              </Box>

              <Box>
                <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 2 })}>
                  Slug
                </h3>
                <p className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>{plan.slug}</p>
              </Box>

              {/* Pricing */}
              <Box>
                <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 2 })}>
                  Monthly Price
                </h3>
                <p className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>
                  {formatCurrency(plan.price_monthly)}
                </p>
              </Box>

              <Box>
                <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 2 })}>
                  Weekly Price
                </h3>
                <p className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>
                  {formatCurrency(plan.price_weekly)}
                </p>
              </Box>

              {/* Billing Period */}
              <Box>
                <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 2 })}>
                  Default Billing Period
                </h3>
                <p className={css({ fontSize: 'lg', fontWeight: 'semibold', textTransform: 'capitalize' })}>
                  {plan.billing_period}
                </p>
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                  Customers can choose at checkout
                </p>
              </Box>

              {/* Features */}
              <Box>
                <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 2 })}>
                  Funnel Limit
                </h3>
                <p className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>{plan.funnel_limit}</p>
              </Box>

              <Box>
                <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 2 })}>
                  Trial Period
                </h3>
                <p className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>{plan.trial_period_days} days</p>
              </Box>
            </Grid>

            {/* Description */}
            <Box mb={6}>
              <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 2 })}>
                Description
              </h3>
              <p className={css({ fontSize: 'sm' })}>{plan.description || 'No description'}</p>
            </Box>

            {/* Features List */}
            {plan.features && plan.features.length > 0 && (
              <Box mb={6}>
                <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted', mb: 2 })}>
                  Features
                </h3>
                <ul className={css({ listStylePosition: 'inside', listStyleType: 'disc' })}>
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} className={css({ fontSize: 'sm', mb: 1 })}>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Box>
            )}

          </Box>
        )}

        {activeTab === 'customers' && (
          <Box>
            {isLoadingCustomers ? (
              <p className={css({ textAlign: 'center', py: 8, color: 'fg.muted' })}>
                Loading customers...
              </p>
            ) : customers.length === 0 ? (
              <p className={css({ textAlign: 'center', py: 8, color: 'fg.muted' })}>
                No customers on this plan yet.
              </p>
            ) : (
              <Box overflowX="auto">
                <table className={css({ width: '100%', borderCollapse: 'collapse' })}>
                  <thead>
                    <tr className={css({ borderBottomWidth: '1px', borderColor: 'border.default' })}>
                      <th className={css({ textAlign: 'left', py: 3, px: 4, fontSize: 'sm', fontWeight: 'medium' })}>
                        Business
                      </th>
                      <th className={css({ textAlign: 'left', py: 3, px: 4, fontSize: 'sm', fontWeight: 'medium' })}>
                        Email
                      </th>
                      <th className={css({ textAlign: 'left', py: 3, px: 4, fontSize: 'sm', fontWeight: 'medium' })}>
                        Status
                      </th>
                      <th className={css({ textAlign: 'left', py: 3, px: 4, fontSize: 'sm', fontWeight: 'medium' })}>
                        Billing Period
                      </th>
                      <th className={css({ textAlign: 'left', py: 3, px: 4, fontSize: 'sm', fontWeight: 'medium' })}>
                        Started
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.business_id}
                        className={css({ borderBottomWidth: '1px', borderColor: 'border.default' })}
                      >
                        <td className={css({ py: 3, px: 4, fontSize: 'sm' })}>
                          {customer.business_name}
                        </td>
                        <td className={css({ py: 3, px: 4, fontSize: 'sm', color: 'fg.muted' })}>
                          {customer.email}
                        </td>
                        <td className={css({ py: 3, px: 4, fontSize: 'sm' })}>
                          <span className={css({
                            px: 2,
                            py: 1,
                            bg: 'bg.muted',
                            color: customer.subscription_status === 'active' ? 'accent.default' : 'fg.muted',
                            rounded: 'md',
                            fontSize: 'xs',
                            fontWeight: 'medium'
                          })}>
                            {customer.subscription_status}
                          </span>
                        </td>
                        <td className={css({ py: 3, px: 4, fontSize: 'sm' })}>
                          {customer.billing_period}
                        </td>
                        <td className={css({ py: 3, px: 4, fontSize: 'sm', color: 'fg.muted' })}>
                          {new Date(customer.started_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 'history' && (
          <Box>
            <p className={css({ textAlign: 'center', py: 8, color: 'fg.muted' })}>
              Plan change history coming soon
            </p>
          </Box>
        )}
      </Box>
    </Box>
  )
}
