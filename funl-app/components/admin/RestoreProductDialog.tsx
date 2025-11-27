'use client'

import { useState } from 'react'
import { Box, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { Button } from '@/components/ui/button'

interface RestoreProductDialogProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  wasActive: boolean
  onSuccess?: () => void
}

export function RestoreProductDialog({
  isOpen,
  onClose,
  productId,
  productName,
  wasActive,
  onSuccess,
}: RestoreProductDialogProps) {
  const [reason, setReason] = useState<string>('')
  const [customReason, setCustomReason] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [reactivate, setReactivate] = useState(wasActive)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reasonOptions = [
    { value: 'mistake', label: 'Deleted by mistake' },
    { value: 'back_in_stock', label: 'Product back in stock' },
    { value: 'customer_demand', label: 'Customer demand' },
    { value: 'seasonal', label: 'Seasonal return' },
    { value: 'other', label: 'Other (specify below)' },
  ]

  const handleSubmit = async () => {
    setError(null)

    // Validation
    if (!reason) {
      setError('Please select a reason')
      return
    }

    if (reason === 'other' && !customReason.trim()) {
      setError('Please specify a custom reason')
      return
    }

    const finalReason = reason === 'other' ? customReason : reason

    if (finalReason.length < 10) {
      setError('Reason must be at least 10 characters')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/products/${productId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: finalReason,
          notes: notes.trim() || undefined,
          reactivate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to restore product')
      }

      // Success
      onSuccess?.()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setCustomReason('')
    setNotes('')
    setError(null)
    setReactivate(wasActive)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0, 0, 0, 0.5)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex="1000"
    >
      <Box
        bg="bg.default"
        p={6}
        rounded="lg"
        boxShadow="lg"
        maxWidth="600px"
        width="100%"
        maxHeight="90vh"
        overflowY="auto"
      >
        <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 2 })}>
          Restore Product
        </h2>
        <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 4 })}>
          Restore &quot;{productName}&quot; from the deleted products archive.
        </p>
          {/* Info Box */}
          <Box mb={4} p={4} bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md">
            <p className={css({ fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
              ℹ️ Restore Details
            </p>
            <ul className={css({ fontSize: 'sm', color: 'fg.muted', pl: 4 })}>
              <li>Product will be undeleted and moved back to active products</li>
              <li>All historical data, inventory, and orders are preserved</li>
              <li>Choose whether to reactivate for customer visibility</li>
            </ul>
          </Box>

          {/* Reactivate Option */}
          <Box mb={4}>
            <label className={css({ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' })}>
              <input
                type="checkbox"
                checked={reactivate}
                onChange={(e) => setReactivate(e.target.checked)}
                className={css({ cursor: 'pointer' })}
              />
              <Box>
                <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                  Reactivate product for customers
                </span>
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                  If unchecked, product will be restored but remain inactive (hidden from customers)
                </p>
              </Box>
            </label>
          </Box>

          {/* Status Preview */}
          <Box mb={4} p={3} bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md">
            <p className={css({ fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
              After Restore:
            </p>
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              Status: {reactivate ? (
                <span className={css({ color: 'accent.default', fontWeight: 'medium' })}>Active (visible to customers)</span>
              ) : (
                <span className={css({ color: 'fg.muted', fontWeight: 'medium' })}>Inactive (hidden from customers)</span>
              )}
            </p>
          </Box>

          {/* Reason */}
          <Box mb={4}>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
              Reason for restoration *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={css({
                width: '100%',
                px: 3,
                py: 2,
                border: '1px solid',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm',
              })}
            >
              <option value="">Select a reason...</option>
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Box>

          {/* Custom Reason */}
          {reason === 'other' && (
            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                Specify Reason * (min 10 characters)
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter reason for restoration..."
                className={css({
                  width: '100%',
                  px: 3,
                  py: 2,
                  border: '1px solid',
                  borderColor: 'border.default',
                  rounded: 'md',
                  fontSize: 'sm',
                })}
              />
            </Box>
          )}

          {/* Notes */}
          <Box mb={4}>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
              Additional Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional context..."
              className={css({
                width: '100%',
                px: 3,
                py: 2,
                border: '1px solid',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm',
                resize: 'vertical',
              })}
            />
          </Box>

          {/* Error */}
          {error && (
            <Box mb={4} p={3} bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md">
              <p className={css({ fontSize: 'sm', color: 'fg.default' })}>{error}</p>
            </Box>
          )}

        {/* Actions */}
        <Flex gap={3} justify="flex-end">
          <Button
            onClick={handleClose}
            variant="outline"
            size="sm"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant="solid"
            size="sm"
          >
            {isSubmitting ? 'Restoring...' : 'Restore Product'}
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}
