'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { BusinessAutocomplete } from './BusinessAutocomplete'
import { BillingPeriodToggle } from './BillingPeriodToggle'

interface Plan {
  id: string
  name: string
  funnel_limit: number
  price_monthly: number
  price_weekly: number
  trial_period_days: number
}

interface AssignSubscriptionDialogProps {
  plans: Plan[]
}

interface Business {
  id: string
  name: string
  email: string
}

export function AssignSubscriptionDialog({ plans }: AssignSubscriptionDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly'>('monthly')
  const [skipTrial, setSkipTrial] = useState(false)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  const handleSearchBusinesses = async (query: string): Promise<Business[]> => {
    const response = await fetch(`/api/admin/businesses/search?q=${encodeURIComponent(query)}`)
    const { businesses } = await response.json()
    return businesses
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedBusiness || !selectedPlanId || !reason || reason.length < 10) {
      setError('Please fill in all required fields (reason must be at least 10 characters)')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/subscriptions/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: selectedBusiness.id,
          plan_id: selectedPlanId,
          billing_period: billingPeriod,
          skip_trial: skipTrial,
          reason,
          notes: notes || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign subscription')
      }

      // Success - close dialog and refresh
      setIsOpen(false)
      resetForm()
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedBusiness(null)
    setSelectedPlanId('')
    setBillingPeriod('monthly')
    setSkipTrial(false)
    setReason('')
    setNotes('')
    setError('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={css({
          px: 4,
          py: 2,
          bg: 'accent.default',
          color: 'white',
          fontSize: 'sm',
          fontWeight: 'medium',
          rounded: 'md',
          cursor: 'pointer',
          _hover: {
            bg: 'accent.emphasized'
          }
        })}
      >
        Assign Subscription
      </button>
    )
  }

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
        onClick={() => setIsOpen(false)}
      />

      {/* Dialog */}
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
        maxW="2xl"
        maxH="90vh"
        overflowY="auto"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <Flex justify="space-between" align="center" p={6} borderBottomWidth="1px" borderColor="border.default">
            <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
              Assign Subscription
            </h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={css({
                color: 'fg.muted',
                cursor: 'pointer',
                _hover: { color: 'fg.default' }
              })}
            >
              ✕
            </button>
          </Flex>

          {/* Body */}
          <Box p={6}>
            {error && (
              <Box mb={4} p={3} bg="red.50" borderWidth="1px" borderColor="red.200" rounded="md">
                <p className={css({ fontSize: 'sm', color: 'red.700' })}>{error}</p>
              </Box>
            )}

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Business *
              </label>
              <BusinessAutocomplete
                value={selectedBusiness}
                onChange={setSelectedBusiness}
                onSearch={handleSearchBusinesses}
                placeholder="Search for a business..."
              />
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Plan *
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
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
                  cursor: 'pointer',
                  _focus: {
                    borderColor: 'accent.default',
                    ring: '2px',
                    ringColor: 'accent.default',
                    ringOffset: "0"
                  }
                })}
              >
                <option value="">Select a plan...</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {plan.funnel_limit} funnels
                  </option>
                ))}
              </select>
            </Box>

            {selectedPlan && (
              <Box mb={4}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                  Billing Period *
                </label>
                <BillingPeriodToggle value={billingPeriod} onChange={setBillingPeriod} />
                <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 2 })}>
                  Price: ${billingPeriod === 'monthly' ? (selectedPlan.price_monthly / 100).toFixed(2) : (selectedPlan.price_weekly / 100).toFixed(2)} / {billingPeriod === 'monthly' ? 'month' : 'week'}
                </p>
              </Box>
            )}

            {selectedPlan && selectedPlan.trial_period_days > 0 && (
              <Box mb={4}>
                <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
                  <input
                    type="checkbox"
                    checked={skipTrial}
                    onChange={(e) => setSkipTrial(e.target.checked)}
                    className={css({ cursor: 'pointer' })}
                  />
                  <span className={css({ fontSize: 'sm', color: 'fg.default' })}>
                    Skip trial period ({selectedPlan.trial_period_days} days)
                  </span>
                </label>
              </Box>
            )}

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Reason * (min 10 characters)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for this assignment..."
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

          {/* Footer */}
          <Flex justify="flex-end" gap={3} p={6} borderTopWidth="1px" borderColor="border.default">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className={css({
                px: 4,
                py: 2,
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'fg.default',
                bg: 'bg.muted',
                rounded: 'md',
                cursor: 'pointer',
                _hover: { bg: 'bg.default' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' }
              })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedBusiness || !selectedPlanId || reason.length < 10}
              className={css({
                px: 4,
                py: 2,
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'white',
                bg: 'accent.default',
                rounded: 'md',
                cursor: 'pointer',
                _hover: { bg: 'accent.emphasized' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' }
              })}
            >
              {isSubmitting ? 'Assigning...' : 'Assign Subscription'}
            </button>
          </Flex>
        </form>
      </Box>
    </>
  )
}
