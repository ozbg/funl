'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface Subscription {
  id: string
  current_period_end: string
  business: {
    name: string
  }
}

interface CancelSubscriptionDialogProps {
  subscription: Subscription
  onSuccess: () => void
}

export function CancelSubscriptionDialog({ subscription, onSuccess }: CancelSubscriptionDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [cancelImmediately, setCancelImmediately] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const periodEnd = new Date(subscription.current_period_end)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!reason || reason.length < 10) {
      setError('Please provide a reason (minimum 10 characters)')
      return
    }

    if (refundAmount && isNaN(parseFloat(refundAmount))) {
      setError('Refund amount must be a valid number')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/subscriptions/${subscription.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancel_immediately: cancelImmediately,
          refund_amount: refundAmount ? parseFloat(refundAmount) * 100 : undefined, // Convert to cents
          reason,
          notes: notes || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel subscription')
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
    setCancelImmediately(false)
    setRefundAmount('')
    setReason('')
    setNotes('')
    setError('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={css({
          px: 3,
          py: 1,
          fontSize: 'xs',
          fontWeight: 'medium',
          color: 'red.600',
          cursor: 'pointer',
          _hover: { textDecoration: 'underline' }
        })}
      >
        Cancel
      </button>
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
              Cancel Subscription
            </h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={css({ color: 'fg.muted', cursor: 'pointer', _hover: { color: 'fg.default' } })}
            >
              ✕
            </button>
          </Flex>

          <Box p={6}>
            {error && (
              <Box mb={4} p={3} bg="red.50" borderWidth="1px" borderColor="red.200" rounded="md">
                <p className={css({ fontSize: 'sm', color: 'red.700' })}>{error}</p>
              </Box>
            )}

            <Box mb={4} p={3} bg="orange.50" borderWidth="1px" borderColor="orange.200" rounded="md">
              <p className={css({ fontSize: 'sm', color: 'orange.700', fontWeight: 'semibold', mb: 1 })}>
                Warning: This will cancel the subscription for {subscription.business.name}
              </p>
              <p className={css({ fontSize: 'xs', color: 'orange.600' })}>
                {cancelImmediately
                  ? 'Access will be revoked immediately'
                  : `Access will continue until ${periodEnd.toLocaleDateString()}`}
              </p>
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
                <input
                  type="checkbox"
                  checked={cancelImmediately}
                  onChange={(e) => setCancelImmediately(e.target.checked)}
                  className={css({ cursor: 'pointer' })}
                />
                <span className={css({ fontSize: 'sm', color: 'fg.default' })}>
                  Cancel immediately (don&apos;t wait for period end)
                </span>
              </label>
            </Box>

            {cancelImmediately && (
              <Box mb={4}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                  Refund Amount (optional)
                </label>
                <div className={css({ position: 'relative' })}>
                  <span className={css({ position: 'absolute', left: 3, top: 2, fontSize: 'sm', color: 'fg.muted' })}>
                    $
                  </span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={css({
                      w: 'full',
                      pl: 6,
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
                  Leave empty for no refund
                </p>
              </Box>
            )}

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Reason * (min 10 characters)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for canceling this subscription..."
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
              disabled={isSubmitting || reason.length < 10}
              className={css({
                px: 4,
                py: 2,
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'white',
                bg: 'red.600',
                rounded: 'md',
                cursor: 'pointer',
                _hover: { bg: 'red.700' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' }
              })}
            >
              {isSubmitting ? 'Canceling...' : 'Cancel Subscription'}
            </button>
          </Flex>
        </form>
      </Box>
    </>
  )
}
