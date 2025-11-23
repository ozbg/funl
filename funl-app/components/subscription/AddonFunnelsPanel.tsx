'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { useRouter } from 'next/navigation'

interface AddonFunnel {
  id: string
  quantity: number
  price_per_funnel: number
  billing_period: string
  is_active: boolean
  cancel_at_period_end: boolean
  current_period_end: string
}

interface AddonFunnelsPanelProps {
  addonFunnels: AddonFunnel[]
  currentPlan: {
    addon_funnel_price_monthly: number
    addon_funnel_price_weekly: number
  }
}

export function AddonFunnelsPanel({ addonFunnels, currentPlan }: AddonFunnelsPanelProps) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly'>('monthly')

  const activeAddons = addonFunnels.filter((addon) => addon.is_active && !addon.cancel_at_period_end)
  const totalAddonFunnels = activeAddons.reduce((sum, addon) => sum + addon.quantity, 0)

  const handleAddFunnels = async () => {
    setIsAdding(true)

    try {
      const response = await fetch('/api/subscriptions/addon-funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, billing_period: billingPeriod }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add funnels')
      }

      setQuantity(1)
      router.refresh()
    } catch (error) {
      console.error('Error adding funnels:', error)
      alert(error instanceof Error ? error.message : 'Failed to add funnels')
    } finally {
      setIsAdding(false)
    }
  }

  const handleCancelAddon = async (addonId: string) => {
    if (!confirm('Are you sure you want to cancel this addon? It will remain active until the end of the current billing period.')) {
      return
    }

    try {
      const response = await fetch(`/api/subscriptions/addon-funnels/${addonId}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel addon')
      }

      router.refresh()
    } catch (error) {
      console.error('Error canceling addon:', error)
      alert(error instanceof Error ? error.message : 'Failed to cancel addon')
    }
  }

  const pricePerFunnel =
    billingPeriod === 'weekly'
      ? currentPlan.addon_funnel_price_weekly
      : currentPlan.addon_funnel_price_monthly

  return (
    <Box
      bg="bg.default"
      rounded="lg"
      boxShadow="sm"
      borderWidth="1px"
      borderColor="border.default"
      p={6}
    >
      <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 4 })}>
        Additional Funnels
      </h3>

      {/* Current Addons */}
      {activeAddons.length > 0 && (
        <Box mb={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 3 })}>
            Active addon funnels: {totalAddonFunnels}
          </p>
          <Grid columns={1} gap={3}>
            {addonFunnels.map((addon) => (
              <Box
                key={addon.id}
                bg={addon.cancel_at_period_end ? 'red.50' : 'blue.50'}
                borderWidth="1px"
                borderColor={addon.cancel_at_period_end ? 'red.200' : 'blue.200'}
                rounded="md"
                p={4}
              >
                <Flex justify="space-between" align="start">
                  <Box>
                    <p className={css({ fontWeight: 'medium', color: 'fg.default' })}>
                      {addon.quantity} funnel{addon.quantity > 1 ? 's' : ''}
                    </p>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
                      ${addon.price_per_funnel.toFixed(2)} per funnel /{' '}
                      {addon.billing_period === 'weekly' ? 'week' : 'month'}
                    </p>
                    {addon.cancel_at_period_end && (
                      <p className={css({ fontSize: 'sm', color: 'red.600', fontWeight: 'medium', mt: 1 })}>
                        Cancels on {new Date(addon.current_period_end).toLocaleDateString()}
                      </p>
                    )}
                  </Box>

                  {!addon.cancel_at_period_end && (
                    <button
                      onClick={() => handleCancelAddon(addon.id)}
                      className={css({
                        px: 3,
                        py: 1,
                        fontSize: 'sm',
                        color: 'red.600',
                        borderWidth: '1px',
                        borderColor: 'red.300',
                        rounded: 'md',
                        _hover: { bg: 'red.100' },
                      })}
                    >
                      Cancel
                    </button>
                  )}
                </Flex>
              </Box>
            ))}
          </Grid>
        </Box>
      )}

      {/* Add Addon Form */}
      <Box
        bg="gray.50"
        rounded="md"
        p={4}
        borderWidth="1px"
        borderColor="border.default"
      >
        <h4 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 3 })}>
          Purchase Additional Funnels
        </h4>

        <Grid columns={{ base: 1, md: 2 }} gap={4} mb={4}>
          <Box>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
              Quantity
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className={css({
                width: '100%',
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'md',
              })}
            />
          </Box>

          <Box>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
              Billing Period
            </label>
            <select
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value as 'weekly' | 'monthly')}
              className={css({
                width: '100%',
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'md',
              })}
            >
              <option value="monthly">Monthly (${currentPlan.addon_funnel_price_monthly}/funnel)</option>
              <option value="weekly">Weekly (${currentPlan.addon_funnel_price_weekly}/funnel)</option>
            </select>
          </Box>
        </Grid>

        {/* Pricing Summary */}
        <Box mb={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            Total: <span className={css({ fontWeight: 'semibold', fontSize: 'lg', color: 'fg.default' })}>
              ${(pricePerFunnel * quantity).toFixed(2)}
            </span>
            /{billingPeriod === 'weekly' ? 'week' : 'month'}
          </p>
          <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
            You can cancel anytime. The funnels will remain active until the end of the billing period.
          </p>
        </Box>

        <button
          onClick={handleAddFunnels}
          disabled={isAdding || quantity < 1}
          className={css({
            width: '100%',
            px: 4,
            py: 2,
            bg: 'blue.600',
            color: 'white',
            rounded: 'md',
            fontWeight: 'medium',
            _hover: { bg: 'blue.700' },
            _disabled: { opacity: 0.5, cursor: 'not-allowed' },
          })}
        >
          {isAdding ? 'Processing...' : `Add ${quantity} Funnel${quantity > 1 ? 's' : ''}`}
        </button>
      </Box>
    </Box>
  )
}
