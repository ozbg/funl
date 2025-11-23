'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface Subscription {
  id: string
  trial_end: string | null
}

interface ExtendTrialDialogProps {
  subscription: Subscription
  onSuccess: () => void
}

export function ExtendTrialDialog({ subscription, onSuccess }: ExtendTrialDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newTrialEnd, setNewTrialEnd] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const currentTrialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null
  const minDate = currentTrialEnd ? new Date(currentTrialEnd.getTime() + 24 * 60 * 60 * 1000) : new Date()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newTrialEnd || !reason || reason.length < 10) {
      setError('Please fill in all required fields (reason must be at least 10 characters)')
      return
    }

    const selectedDate = new Date(newTrialEnd)
    if (currentTrialEnd && selectedDate <= currentTrialEnd) {
      setError('New trial end date must be after the current trial end date')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extend_trial',
          new_trial_end: newTrialEnd,
          reason,
          notes: notes || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to extend trial')
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
    setNewTrialEnd('')
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
          color: 'purple.600',
          cursor: 'pointer',
          _hover: { textDecoration: 'underline' }
        })}
      >
        Extend Trial
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
              Extend Trial Period
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

            {currentTrialEnd && (
              <Box mb={4} p={3} bg="blue.50" borderWidth="1px" borderColor="blue.200" rounded="md">
                <p className={css({ fontSize: 'sm', color: 'blue.700' })}>
                  Current trial ends: <strong>{currentTrialEnd.toLocaleDateString()}</strong>
                </p>
              </Box>
            )}

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                New Trial End Date *
              </label>
              <input
                type="date"
                value={newTrialEnd}
                onChange={(e) => setNewTrialEnd(e.target.value)}
                min={minDate.toISOString().split('T')[0]}
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
              />
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Reason * (min 10 characters)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for extending the trial..."
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
              disabled={isSubmitting || !newTrialEnd || reason.length < 10}
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
              {isSubmitting ? 'Extending...' : 'Extend Trial'}
            </button>
          </Flex>
        </form>
      </Box>
    </>
  )
}
