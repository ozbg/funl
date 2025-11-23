'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { useRouter } from 'next/navigation'

interface Plan {
  id: string
  name: string
  slug: string
  description: string
  price_monthly: number
  price_weekly: number
  billing_period: string
  trial_period_days: number
  funnel_limit: number
  features: string[]
  tagline?: string
  cta_text?: string
  featured: boolean
}

interface SubscriptionPlanCardProps {
  plan: Plan
  isCurrentPlan: boolean
  currentBillingPeriod?: string
}

export function SubscriptionPlanCard({
  plan,
  isCurrentPlan,
  currentBillingPeriod,
}: SubscriptionPlanCardProps) {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly'>(
    (currentBillingPeriod as 'weekly' | 'monthly') || 'monthly'
  )
  const [isUpgrading, setIsUpgrading] = useState(false)

  const price = billingPeriod === 'weekly' ? plan.price_weekly : plan.price_monthly

  const handleUpgrade = async () => {
    setIsUpgrading(true)

    try {
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_period: billingPeriod,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upgrade')
      }

      router.refresh()
    } catch (error) {
      console.error('Error upgrading:', error)
      alert(error instanceof Error ? error.message : 'Failed to upgrade')
    } finally {
      setIsUpgrading(false)
    }
  }

  return (
    <Box
      bg="bg.default"
      rounded="lg"
      boxShadow={plan.featured ? 'lg' : 'sm'}
      borderWidth={plan.featured ? '2px' : '1px'}
      borderColor={plan.featured ? 'blue.500' : 'border.default'}
      p={6}
      position="relative"
    >
      {/* Featured Badge */}
      {plan.featured && (
        <Box
          position="absolute"
          top={-3}
          right={6}
          bg="blue.600"
          color="white"
          px={3}
          py={1}
          rounded="full"
          fontSize="xs"
          fontWeight="semibold"
        >
          Most Popular
        </Box>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <Box
          mb={3}
          px={3}
          py={1}
          bg="green.100"
          color="green.800"
          rounded="md"
          fontSize="sm"
          fontWeight="medium"
          display="inline-block"
        >
          Current Plan
        </Box>
      )}

      {/* Plan Name */}
      <h3 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'fg.default', mb: 1 })}>
        {plan.name}
      </h3>

      {/* Tagline */}
      {plan.tagline && (
        <p className={css({ fontSize: 'sm', color: 'blue.600', fontWeight: 'medium', mb: 3 })}>
          {plan.tagline}
        </p>
      )}

      {/* Description */}
      <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 4 })}>{plan.description}</p>

      {/* Billing Toggle */}
      <Flex gap={2} mb={4} p={1} bg="gray.100" rounded="md">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={css({
            flex: 1,
            py: 2,
            px: 3,
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'medium',
            bg: billingPeriod === 'monthly' ? 'white' : 'transparent',
            color: billingPeriod === 'monthly' ? 'blue.600' : 'gray.600',
            boxShadow: billingPeriod === 'monthly' ? 'sm' : 'none',
            cursor: 'pointer',
          })}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingPeriod('weekly')}
          className={css({
            flex: 1,
            py: 2,
            px: 3,
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'medium',
            bg: billingPeriod === 'weekly' ? 'white' : 'transparent',
            color: billingPeriod === 'weekly' ? 'blue.600' : 'gray.600',
            boxShadow: billingPeriod === 'weekly' ? 'sm' : 'none',
            cursor: 'pointer',
          })}
        >
          Weekly
        </button>
      </Flex>

      {/* Price */}
      <Box mb={4}>
        <Flex align="baseline" gap={1}>
          <span className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'fg.default' })}>
            ${price.toFixed(2)}
          </span>
          <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            /{billingPeriod === 'weekly' ? 'week' : 'month'}
          </span>
        </Flex>
        {plan.trial_period_days > 0 && !isCurrentPlan && (
          <p className={css({ fontSize: 'sm', color: 'green.600', mt: 1 })}>
            {plan.trial_period_days} day free trial
          </p>
        )}
      </Box>

      {/* Funnel Limit */}
      <Box
        mb={4}
        p={3}
        bg="blue.50"
        rounded="md"
        borderWidth="1px"
        borderColor="blue.200"
      >
        <p className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'blue.900' })}>
          {plan.funnel_limit} Active Funnels
        </p>
      </Box>

      {/* Features */}
      <Box mb={6}>
        {plan.features?.map((feature, index) => (
          <Flex key={index} gap={2} align="start" mb={2}>
            <Box color="green.600" mt={0.5}>✓</Box>
            <p className={css({ fontSize: 'sm', color: 'fg.default' })}>{feature}</p>
          </Flex>
        ))}
      </Box>

      {/* CTA Button */}
      <button
        onClick={handleUpgrade}
        disabled={isCurrentPlan || isUpgrading}
        className={css({
          width: '100%',
          py: 3,
          px: 4,
          bg: plan.featured ? 'blue.600' : 'gray.800',
          color: 'white',
          rounded: 'md',
          fontWeight: 'semibold',
          cursor: 'pointer',
          _hover: { bg: plan.featured ? 'blue.700' : 'gray.900' },
          _disabled: { opacity: 0.5, cursor: 'not-allowed' },
        })}
      >
        {isUpgrading
          ? 'Processing...'
          : isCurrentPlan
          ? 'Current Plan'
          : plan.cta_text || 'Get Started'}
      </button>
    </Box>
  )
}
