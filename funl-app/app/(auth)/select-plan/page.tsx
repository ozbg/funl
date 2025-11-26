'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price_monthly: number
  price_weekly: number
  billing_period: 'monthly' | 'weekly'
  funnel_limit: number
  trial_period_days: number
  features: string[]
  is_default: boolean
  featured: boolean
}

export default function SelectPlanPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<'monthly' | 'weekly'>('monthly')
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })

      if (error) throw error

      setPlans(data || [])
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (plan: Plan) => {
    setProcessingPlanId(plan.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // If plan has trial period, create trial subscription directly
      if (plan.trial_period_days > 0) {
        const response = await fetch('/api/subscriptions/create-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            billingPeriod: selectedBillingPeriod,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create trial subscription')
        }

        // Redirect to onboarding
        router.push('/onboarding')
      } else {
        // Redirect to Stripe Checkout for paid plans
        const response = await fetch('/api/subscriptions/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            billingPeriod: selectedBillingPeriod,
          }),
        })

        const { url } = await response.json()

        if (url) {
          window.location.href = url
        }
      }
    } catch (error) {
      console.error('Error selecting plan:', error)
      alert('Failed to process plan selection. Please try again.')
    } finally {
      setProcessingPlanId(null)
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(cents / 100)
  }

  const getPrice = (plan: Plan) => {
    return selectedBillingPeriod === 'monthly' ? plan.price_monthly : plan.price_weekly
  }

  if (loading) {
    return (
      <Box bg="bg.default" py={12} px={4} minH="100vh">
        <Box mx="auto" maxW="6xl" textAlign="center">
          <p className={css({ color: 'fg.muted' })}>Loading plans...</p>
        </Box>
      </Box>
    )
  }

  return (
    <Box bg="bg.default" py={{ base: 8, md: 12 }} px={4} minH="100vh">
      <Box mx="auto" maxW="7xl" w="full">
        <Box textAlign="center" mb={{ base: 8, md: 12 }}>
          <h1 className={css({ fontSize: { base: '3xl', md: '4xl', lg: '5xl' }, fontWeight: 'bold', color: 'fg.default', mb: 4 })}>
            Choose your plan
          </h1>
          <p className={css({ fontSize: { base: 'md', md: 'lg' }, color: 'fg.muted', mb: 6, maxW: '2xl', mx: 'auto' })}>
            Start with a free trial. No credit card required.
          </p>

          {/* Billing Period Toggle */}
          <Flex justify="center" gap={4} mb={8}>
            <button
              onClick={() => setSelectedBillingPeriod('monthly')}
              className={css({
                px: { base: 4, md: 6 },
                py: { base: 2, md: 3 },
                fontSize: { base: 'sm', md: 'md' },
                fontWeight: 'medium',
                rounded: 'lg',
                bg: selectedBillingPeriod === 'monthly' ? 'accent.default' : 'bg.subtle',
                color: selectedBillingPeriod === 'monthly' ? 'white' : 'fg.default',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: selectedBillingPeriod === 'monthly' ? 'accent.emphasized' : 'bg.muted',
                  transform: 'translateY(-1px)',
                },
              })}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setSelectedBillingPeriod('weekly')}
              className={css({
                px: { base: 4, md: 6 },
                py: { base: 2, md: 3 },
                fontSize: { base: 'sm', md: 'md' },
                fontWeight: 'medium',
                rounded: 'lg',
                bg: selectedBillingPeriod === 'weekly' ? 'accent.default' : 'bg.subtle',
                color: selectedBillingPeriod === 'weekly' ? 'white' : 'fg.default',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: selectedBillingPeriod === 'weekly' ? 'accent.emphasized' : 'bg.muted',
                  transform: 'translateY(-1px)',
                },
              })}
            >
              Weekly billing
            </button>
          </Flex>
        </Box>

        <Grid
          columns={{ base: 1, md: 2, lg: 3 }}
          gap={{ base: 6, md: 8 }}
          w="full"
          maxW="100%"
        >
          {plans.map((plan) => (
            <Box
              key={plan.id}
              bg="bg.default"
              borderWidth="2px"
              borderColor={plan.featured ? 'accent.default' : 'border.default'}
              rounded="xl"
              p={{ base: 6, md: 8 }}
              position="relative"
              transition="all 0.3s"
              boxShadow={plan.featured ? 'lg' : 'md'}
              w="full"
              className={css({
                _hover: {
                  borderColor: 'accent.default',
                  transform: 'translateY(-4px)',
                  boxShadow: 'xl',
                },
              })}
            >
              {plan.featured && (
                <Box
                  position="absolute"
                  top={{ base: '-3', md: '-4' }}
                  left="50%"
                  transform="translateX(-50%)"
                  bg="accent.default"
                  color="white"
                  px={{ base: 3, md: 4 }}
                  py={{ base: 1, md: 1.5 }}
                  rounded="full"
                  fontSize={{ base: 'xs', md: 'sm' }}
                  fontWeight="semibold"
                  boxShadow="md"
                >
                  Popular
                </Box>
              )}

              <Box mb={6}>
                <h3 className={css({ fontSize: { base: 'xl', md: '2xl' }, fontWeight: 'bold', color: 'fg.default', mb: 2 })}>
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className={css({ fontSize: { base: 'xs', md: 'sm' }, color: 'fg.muted', mb: 4, minH: '2.5rem' })}>
                    {plan.description}
                  </p>
                )}

                <Box mb={4}>
                  <Flex align="baseline" gap={1}>
                    <span className={css({ fontSize: { base: '3xl', md: '4xl', lg: '5xl' }, fontWeight: 'bold', color: 'fg.default' })}>
                      {formatPrice(getPrice(plan))}
                    </span>
                    <span className={css({ fontSize: { base: 'xs', md: 'sm' }, color: 'fg.muted' })}>
                      /{selectedBillingPeriod === 'monthly' ? 'month' : 'week'}
                    </span>
                  </Flex>
                  {plan.trial_period_days > 0 && (
                    <p className={css({ fontSize: { base: 'xs', md: 'sm' }, color: 'green.600', fontWeight: 'semibold', mt: 2 })}>
                      {plan.trial_period_days} day free trial
                    </p>
                  )}
                </Box>
              </Box>

              <Box mb={6}>
                <p className={css({ fontSize: { base: 'xs', md: 'sm' }, fontWeight: 'semibold', color: 'fg.default', mb: 3 })}>
                  Features:
                </p>
                <ul className={css({ fontSize: { base: 'xs', md: 'sm' }, color: 'fg.muted', lineHeight: '2' })}>
                  <li className={css({ display: 'flex', gap: 2, alignItems: 'flex-start' })}>
                    <span className={css({ color: 'green.600', fontWeight: 'bold', fontSize: 'lg' })}>✓</span>
                    <span>Up to {plan.funnel_limit} funnels</span>
                  </li>
                  {plan.features && plan.features.map((feature, idx) => (
                    <li key={idx} className={css({ display: 'flex', gap: 2, alignItems: 'flex-start' })}>
                      <span className={css({ color: 'green.600', fontWeight: 'bold', fontSize: 'lg' })}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </Box>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={processingPlanId === plan.id}
                className={css({
                  w: 'full',
                  py: { base: 3, md: 4 },
                  px: 4,
                  bg: plan.featured ? 'accent.default' : 'bg.subtle',
                  color: plan.featured ? 'white' : 'fg.default',
                  fontSize: { base: 'sm', md: 'md' },
                  fontWeight: 'semibold',
                  rounded: 'lg',
                  cursor: 'pointer',
                  borderWidth: '2px',
                  borderColor: plan.featured ? 'accent.default' : 'border.default',
                  transition: 'all 0.2s',
                  _hover: {
                    bg: plan.featured ? 'accent.emphasized' : 'bg.muted',
                    transform: 'translateY(-2px)',
                    boxShadow: 'md',
                  },
                  _disabled: {
                    opacity: 0.5,
                    cursor: 'not-allowed',
                  },
                })}
              >
                {processingPlanId === plan.id ? 'Processing...' : (plan.trial_period_days > 0 ? 'Start free trial' : 'Get started')}
              </button>
            </Box>
          ))}
        </Grid>

        <Box textAlign="center" mt={{ base: 8, md: 12 }}>
          <p className={css({ fontSize: { base: 'xs', md: 'sm' }, color: 'fg.muted' })}>
            All plans include unlimited QR codes and analytics
          </p>
        </Box>
      </Box>
    </Box>
  )
}
