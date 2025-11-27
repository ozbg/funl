'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { BatchSelector } from './BatchSelector'

interface LinkBatchDialogProps {
  productId: string
  productName: string
  onSuccess: () => void
}

export function LinkBatchDialog({ productId, productName, onSuccess }: LinkBatchDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [quantityAllocated, setQuantityAllocated] = useState('')
  const [priceOverride, setPriceOverride] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const qty = parseInt(quantityAllocated)
    if (!batchId || !quantityAllocated || isNaN(qty) || qty < 1) {
      setError('Please select a batch and enter a valid quantity')
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
      const response = await fetch(`/api/admin/products/${productId}/link-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId,
          quantity_allocated: qty,
          price_override_cents: priceOverride ? Math.round(parseFloat(priceOverride) * 100) : undefined,
          reason,
          notes: notes || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to link batch')
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
    setBatchId(null)
    setQuantityAllocated('')
    setPriceOverride('')
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
        Link Batch
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
        maxW="lg"
        maxH="90vh"
        overflowY="auto"
      >
        <form onSubmit={handleSubmit}>
          <Flex justify="space-between" align="center" p={6} borderBottomWidth="1px" borderColor="border.default">
            <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
              Link Batch to Product
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
              <Box mb={4} p={3} bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md">
                <p className={css({ fontSize: 'sm', color: 'fg.default' })}>{error}</p>
              </Box>
            )}

            <Box mb={4} p={3} bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md">
              <p className={css({ fontSize: 'sm', color: 'fg.default' })}>
                Linking batch to: <strong>{productName}</strong>
              </p>
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Select Batch *
              </label>
              <BatchSelector value={batchId} onChange={setBatchId} />
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Quantity to Allocate *
              </label>
              <input
                type="number"
                value={quantityAllocated}
                onChange={(e) => setQuantityAllocated(e.target.value)}
                placeholder="e.g., 100"
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
                    ringOffset: '0'
                  }
                })}
              />
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Number of QR codes from this batch to allocate to this product
              </p>
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Price Override (optional)
              </label>
              <div className={css({ position: 'relative' })}>
                <span className={css({ position: 'absolute', left: 3, top: 2, fontSize: 'sm', color: 'fg.muted' })}>
                  $
                </span>
                <input
                  type="number"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                  placeholder="Use product pricing"
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
                      ringOffset: '0'
                    }
                  })}
                />
              </div>
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Override the product price for this specific batch
              </p>
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Reason * (min 10 characters)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for linking this batch..."
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
                    ringOffset: '0'
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
                    ringOffset: '0'
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
              disabled={isSubmitting || !batchId || !quantityAllocated || reason.length < 10}
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
              {isSubmitting ? 'Linking...' : 'Link Batch'}
            </button>
          </Flex>
        </form>
      </Box>
    </>
  )
}
