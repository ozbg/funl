'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'
import { BillingPeriodToggle } from './BillingPeriodToggle'

interface Plan {
  id: string
  name: string
  funnel_limit: number
  price_monthly: number
  price_weekly: number
}

interface Subscription {
  id: string
  subscription_plan: {
    id: string
    name: string
    price_monthly: number
    price_weekly: number
  }
  billing_period: 'weekly' | 'monthly'
  current_period_start: string
  current_period_end: string
}

interface ChangePlanDialogProps {
  subscription: Subscription
  plans: Plan[]
  onSuccess: () => void
}

export function ChangePlanDialog({ subscription, plans, onSuccess }: ChangePlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(subscription.subscription_plan.id)
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly'>(subscription.billing_period)
  const [effectiveDate, setEffectiveDate] = useState<'immediate' | 'next_period'>('next_period')
  const [prorate, setProrate] = useState(true)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  // Calculate proration
  const calculateProration = () => {
    if (!selectedPlan || effectiveDate !== 'immediate' || !prorate) {
      return null
    }

    const now = new Date()
    const periodStart = new Date(subscription.current_period_start)
    const periodEnd = new Date(subscription.current_period_end)

    const totalMs = periodEnd.getTime() - periodStart.getTime()
    const usedMs = now.getTime() - periodStart.getTime()
    const remainingMs = totalMs - usedMs

    const totalDays = totalMs / (1000 * 60 * 60 * 24)
    const daysRemaining = remainingMs / (1000 * 60 * 60 * 24)

    // Get current and new prices (in cents)
    const currentPrice = subscription.billing_period === 'weekly'
      ? subscription.subscription_plan.price_weekly
      : subscription.subscription_plan.price_monthly

    const newPrice = billingPeriod === 'weekly'
      ? selectedPlan.price_weekly
      : selectedPlan.price_monthly

    // Calculate refund for unused portion of current plan
    const unusedAmount = (daysRemaining / totalDays) * currentPrice

    // Calculate charge for new plan (prorated for remaining period)
    const newAmount = (daysRemaining / totalDays) * newPrice

    const proratedAmount = newAmount - unusedAmount

    return {
      currentPrice,
      newPrice,
      daysRemaining: Math.ceil(daysRemaining),
      unusedAmount,
      newAmount,
      proratedAmount,
      isCredit: proratedAmount < 0,
      isCharge: proratedAmount > 0,
    }
  }

  const proration = calculateProration()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedPlanId || !reason || reason.length < 10) {
      setError('Please fill in all required fields (reason must be at least 10 characters)')
      return
    }

    if (selectedPlanId === subscription.subscription_plan.id) {
      setError('Please select a different plan')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/subscriptions/${subscription.id}/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_plan_id: selectedPlanId,
          new_billing_period: billingPeriod,
          prorate: effectiveDate === 'immediate' ? prorate : false,
          effective_date: effectiveDate,
          reason,
          notes: notes || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change plan')
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
    setSelectedPlanId(subscription.subscription_plan.id)
    setBillingPeriod(subscription.billing_period)
    setEffectiveDate('next_period')
    setProrate(true)
    setReason('')
    setNotes('')
    setError('')
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className={css({
          color: 'accent.default',
          _hover: { textDecoration: 'underline' }
        })}
      >
        Change Plan
      </Button>
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
          <Flex justify="space-between" align="center" p={6} borderBottomWidth="1px" borderColor="border.default">
            <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
              Change Subscription Plan
            </h2>
            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
            >
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
                Current plan: <strong>{subscription.subscription_plan.name}</strong> ({subscription.billing_period})
              </p>
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                New Plan *
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

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Effective Date *
              </label>
              <select
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value as 'immediate' | 'next_period')}
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
                <option value="next_period">At next billing period</option>
                <option value="immediate">Immediately</option>
              </select>
            </Box>

            {effectiveDate === 'immediate' && (
              <>
                <Box mb={4}>
                  <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
                    <input
                      type="checkbox"
                      checked={prorate}
                      onChange={(e) => setProrate(e.target.checked)}
                      className={css({ cursor: 'pointer' })}
                    />
                    <span className={css({ fontSize: 'sm', color: 'fg.default' })}>
                      Apply proration
                    </span>
                  </label>
                  <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1, ml: 6 })}>
                    Credit/charge the difference for the remaining billing period
                  </p>
                </Box>

                {/* Proration Calculation Display */}
                {proration && (
                  <Box mb={4} p={4} bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md">
                    <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 3 })}>
                      Proration Calculation
                    </h3>
                    <Box fontSize="xs" color="fg.default">
                      <Flex justify="space-between" mb={1}>
                        <span>Days remaining in period:</span>
                        <span className={css({ fontWeight: 'medium' })}>{proration.daysRemaining} days</span>
                      </Flex>
                      <Flex justify="space-between" mb={1}>
                        <span>Current plan (unused):</span>
                        <span className={css({ fontWeight: 'medium' })}>
                          -${(proration.unusedAmount / 100).toFixed(2)}
                        </span>
                      </Flex>
                      <Flex justify="space-between" mb={1}>
                        <span>New plan (prorated):</span>
                        <span className={css({ fontWeight: 'medium' })}>
                          +${(proration.newAmount / 100).toFixed(2)}
                        </span>
                      </Flex>
                      <Box mt={2} pt={2} borderTopWidth="1px" borderColor="border.default">
                        <Flex justify="space-between">
                          <span className={css({ fontWeight: 'semibold' })}>
                            {proration.isCredit ? 'Credit:' : proration.isCharge ? 'Charge:' : 'No change:'}
                          </span>
                          <span className={css({
                            fontWeight: 'bold',
                            fontSize: 'sm',
                            color: proration.isCredit ? 'accent.default' : 'fg.default'
                          })}>
                            {proration.proratedAmount >= 0 ? '+' : ''}${(proration.proratedAmount / 100).toFixed(2)}
                          </span>
                        </Flex>
                      </Box>
                    </Box>
                  </Box>
                )}
              </>
            )}

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Reason * (min 10 characters)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for this plan change..."
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
            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedPlanId || reason.length < 10}
              variant="solid"
              size="sm"
            >
              {isSubmitting ? 'Changing Plan...' : 'Change Plan'}
            </Button>
          </Flex>
        </form>
      </Box>
    </>
  )
}
