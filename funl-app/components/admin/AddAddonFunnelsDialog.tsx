'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'
import { BillingPeriodToggle } from './BillingPeriodToggle'

interface Subscription {
  id: string
  business_id: string
  business: {
    name: string
  }
}

interface AddAddonFunnelsDialogProps {
  subscription: Subscription
  onSuccess: () => void
}

export function AddAddonFunnelsDialog({ subscription, onSuccess }: AddAddonFunnelsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [quantity, setQuantity] = useState('1')
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly'>('monthly')
  const [priceOverride, setPriceOverride] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const qty = parseInt(quantity)
    if (!quantity || isNaN(qty) || qty < 1) {
      setError('Quantity must be at least 1')
      return
    }

    if (!reason || reason.length < 10) {
      setError('Please provide a reason (minimum 10 characters)')
      return
    }

    if (priceOverride && isNaN(parseFloat(priceOverride))) {
      setError('Price override must be a valid number')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/addon-funnels/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: subscription.business_id,
          quantity: qty,
          billing_period: billingPeriod,
          price_override: priceOverride ? parseFloat(priceOverride) * 100 : undefined, // Convert to cents
          reason,
          notes: notes || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add addon funnels')
      }

      setIsOpen(false)
      resetForm()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setQuantity('1')
    setBillingPeriod('monthly')
    setPriceOverride('')
    setReason('')
    setNotes('')
    setError('')
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="ghost" size="sm">
        Add Funnels
      </Button>
    )
  }

  return (
    <>
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="rgba(0, 0, 0, 0.5)"
        zIndex="40"
        onClick={() => setIsOpen(false)}
      />

      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        bg="bg.default"
        rounded="lg"
        boxShadow="xl"
        zIndex="50"
        w="full"
        maxW="lg"
        maxH="90vh"
        overflowY="auto"
      >
        <form onSubmit={handleSubmit}>
          <Flex justify="space-between" align="center" p={6} borderBottomWidth="1px" borderColor="border.default">
            <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
              Add Addon Funnels
            </h2>
            <Button type="button" onClick={() => setIsOpen(false)} variant="ghost" size="sm">
              ✕
            </Button>
          </Flex>

          <Box p={6}>
            {error && (
              <Box mb={4} p={3} bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md">
                <p className={css({ fontSize: 'sm', color: 'fg.default' })}>{error}</p>
              </Box>
            )}

            <Box mb={4} p={3} bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md">
              <p className={css({ fontSize: 'sm', color: 'fg.default' })}>
                Adding addon funnels for: <strong>{subscription.business.name}</strong>
              </p>
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  fontSize: 'sm',
                  bg: 'bg.default',
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
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Number of additional funnels to add
              </p>
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Billing Period *
              </label>
              <BillingPeriodToggle value={billingPeriod} onChange={setBillingPeriod} />
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Price Override (optional)
              </label>
              <div className={css({ position: 'relative' })}>
                <span className={css({ position: 'absolute', left: 3, top: 2, fontSize: 'sm', color: 'fg.muted' })}>
                  $ per funnel /
                </span>
                <input
                  type="number"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                  placeholder="Default from plan"
                  step="0.01"
                  min="0"
                  className={css({
                    w: 'full',
                    pl: 24,
                    pr: 3,
                    py: 2,
                    fontSize: 'sm',
                    bg: 'bg.default',
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
              </div>
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Leave empty to use the default price from the plan
              </p>
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Reason * (min 10 characters)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for adding these addon funnels..."
                rows={3}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  fontSize: 'sm',
                  bg: 'bg.default',
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  outline: 'none',
                  resize: 'vertical',
                  _focus: {
                    borderColor: 'accent.default',
                    ring: '2px',
                    ringColor: 'accent.default',
                    ringOffset: "0"
                  }
                })}
              />
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                {reason.length} / 10 characters minimum
              </p>
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional additional notes..."
                rows={2}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  fontSize: 'sm',
                  bg: 'bg.default',
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  outline: 'none',
                  resize: 'vertical',
                  _focus: {
                    borderColor: 'accent.default',
                    ring: '2px',
                    ringColor: 'accent.default',
                    ringOffset: "0"
                  }
                })}
              />
            </Box>
          </Box>

          <Flex justify="flex-end" gap={3} p={6} borderTopWidth="1px" borderColor="border.default">
            <Button type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting} variant="outline" size="sm">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !quantity || reason.length < 10} variant="solid" size="sm">
              {isSubmitting ? 'Adding...' : 'Add Addon Funnels'}
            </Button>
          </Flex>
        </form>
      </Box>
    </>
  )
}
