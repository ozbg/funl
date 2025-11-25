'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import Link from 'next/link'

interface SubscriptionData {
  status: string
  trial_end: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  billing_period?: string
  subscription_plan?: { name: string; billing_period: string; funnel_limit?: number }
  plan?: { name: string; funnel_limit?: number }
  plans: { name: string; funnel_limit?: number }
}

interface PaymentData {
  id: string
  amount: number
  created: number
  receipt_url: string
  description?: string
  currency?: string
  status?: string
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load subscription
      const subResponse = await fetch('/api/subscriptions/current')
      const subData = await subResponse.json()
      setSubscription(subData.subscription)

      // Load payment history
      const paymentResponse = await fetch('/api/subscriptions/payment-history')
      const paymentData = await paymentResponse.json()
      setPayments(paymentData.payments || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async (immediately: boolean) => {
    if (!confirm(immediately
      ? 'Are you sure you want to cancel your subscription immediately? You will lose access right away.'
      : 'Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.'
    )) {
      return
    }

    setCanceling(true)
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediately }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      alert('Subscription canceled successfully')
      loadData()
    } catch (error) {
      console.error('Error canceling subscription:', error)
      alert('Failed to cancel subscription. Please try again.')
    } finally {
      setCanceling(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'aud') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <Box p={6}>
        <p className={css({ color: 'fg.muted' })}>Loading...</p>
      </Box>
    )
  }

  return (
    <Box p={6} maxW="6xl" mx="auto">
      <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default', mb: 6 })}>
        Subscription Management
      </h1>

      {!subscription ? (
        <Box
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border.default"
          rounded="lg"
          p={8}
          textAlign="center"
        >
          <p className={css({ fontSize: 'md', color: 'fg.muted', mb: 4 })}>
            You don&apos;t have an active subscription
          </p>
          <Link
            href="/select-plan"
            className={css({
              display: 'inline-block',
              px: 6,
              py: 3,
              bg: 'accent.default',
              color: 'white',
              fontSize: 'sm',
              fontWeight: 'medium',
              rounded: 'md',
              _hover: { bg: 'accent.emphasized' },
            })}
          >
            Choose a plan
          </Link>
        </Box>
      ) : (
        <>
          {/* Current Plan */}
          <Box
            bg="bg.default"
            borderWidth="1px"
            borderColor="border.default"
            rounded="lg"
            p={6}
            mb={6}
          >
            <Flex justify="space-between" align="start" mb={4}>
              <Box>
                <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                  Current Plan
                </h2>
                <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'accent.default' })}>
                  {subscription.subscription_plan?.name || subscription.plan?.name}
                </p>
              </Box>
              {subscription.status === 'trialing' && (
                <Box
                  bg="green.100"
                  color="green.700"
                  px={3}
                  py={1}
                  rounded="md"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  Trial
                </Box>
              )}
            </Flex>

            <Grid columns={{ base: 1, md: 3 }} gap={6} mb={6}>
              <Box>
                <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Status</p>
                <p className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default', textTransform: 'capitalize' })}>
                  {subscription.status}
                </p>
              </Box>
              <Box>
                <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Billing Period</p>
                <p className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default', textTransform: 'capitalize' })}>
                  {subscription.billing_period}
                </p>
              </Box>
              <Box>
                <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Funnel Limit</p>
                <p className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default' })}>
                  {subscription.subscription_plan?.funnel_limit || subscription.plan?.funnel_limit} funnels
                </p>
              </Box>
            </Grid>

            {subscription.trial_end && subscription.status === 'trialing' && (
              <Box bg="bg.subtle" p={4} rounded="md" mb={4}>
                <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                  Your trial ends on <strong>{formatDate(new Date(subscription.trial_end).getTime())}</strong>
                </p>
              </Box>
            )}

            {subscription.current_period_end && subscription.status === 'active' && (
              <Box bg="bg.subtle" p={4} rounded="md" mb={4}>
                <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                  Next billing date: <strong>{formatDate(new Date(subscription.current_period_end).getTime())}</strong>
                </p>
              </Box>
            )}

            <Flex gap={3} flexWrap="wrap">
              <Link
                href="/select-plan"
                className={css({
                  px: 4,
                  py: 2,
                  bg: 'accent.default',
                  color: 'white',
                  fontSize: 'sm',
                  fontWeight: 'medium',
                  rounded: 'md',
                  _hover: { bg: 'accent.emphasized' },
                })}
              >
                Change Plan
              </Link>

              {!subscription.cancel_at_period_end && (
                <button
                  onClick={() => handleCancelSubscription(false)}
                  disabled={canceling}
                  className={css({
                    px: 4,
                    py: 2,
                    bg: 'bg.subtle',
                    color: 'fg.default',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    rounded: 'md',
                    borderWidth: '1px',
                    borderColor: 'border.default',
                    cursor: 'pointer',
                    _hover: { bg: 'bg.muted' },
                    _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                  })}
                >
                  Cancel Subscription
                </button>
              )}

              {subscription.cancel_at_period_end && (
                <Box
                  bg="red.100"
                  color="red.700"
                  px={4}
                  py={2}
                  rounded="md"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  Subscription will cancel at period end
                </Box>
              )}
            </Flex>
          </Box>

          {/* Payment History */}
          <Box
            bg="bg.default"
            borderWidth="1px"
            borderColor="border.default"
            rounded="lg"
            p={6}
          >
            <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 4 })}>
              Payment History
            </h2>

            {payments.length === 0 ? (
              <p className={css({ fontSize: 'sm', color: 'fg.muted', textAlign: 'center', py: 8 })}>
                No payment history yet
              </p>
            ) : (
              <Box overflowX="auto">
                <table className={css({ w: 'full', fontSize: 'sm' })}>
                  <thead>
                    <tr className={css({ borderBottomWidth: '1px', borderColor: 'border.default' })}>
                      <th className={css({ textAlign: 'left', py: 3, px: 2, fontWeight: 'medium', color: 'fg.muted' })}>
                        Date
                      </th>
                      <th className={css({ textAlign: 'left', py: 3, px: 2, fontWeight: 'medium', color: 'fg.muted' })}>
                        Description
                      </th>
                      <th className={css({ textAlign: 'left', py: 3, px: 2, fontWeight: 'medium', color: 'fg.muted' })}>
                        Amount
                      </th>
                      <th className={css({ textAlign: 'left', py: 3, px: 2, fontWeight: 'medium', color: 'fg.muted' })}>
                        Status
                      </th>
                      <th className={css({ textAlign: 'right', py: 3, px: 2, fontWeight: 'medium', color: 'fg.muted' })}>
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className={css({ borderBottomWidth: '1px', borderColor: 'border.default' })}
                      >
                        <td className={css({ py: 3, px: 2, color: 'fg.default' })}>
                          {formatDate(payment.created)}
                        </td>
                        <td className={css({ py: 3, px: 2, color: 'fg.muted' })}>
                          {payment.description || 'Subscription payment'}
                        </td>
                        <td className={css({ py: 3, px: 2, color: 'fg.default', fontWeight: 'medium' })}>
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className={css({ py: 3, px: 2 })}>
                          <span className={css({
                            px: 2,
                            py: 1,
                            rounded: 'md',
                            fontSize: 'xs',
                            fontWeight: 'medium',
                            bg: payment.status === 'succeeded' ? 'green.100' : 'red.100',
                            color: payment.status === 'succeeded' ? 'green.700' : 'red.700',
                            textTransform: 'capitalize',
                          })}>
                            {payment.status}
                          </span>
                        </td>
                        <td className={css({ py: 3, px: 2, textAlign: 'right' })}>
                          {payment.receipt_url && (
                            <a
                              href={payment.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={css({
                                color: 'accent.default',
                                fontSize: 'sm',
                                _hover: { textDecoration: 'underline' },
                              })}
                            >
                              View
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  )
}
