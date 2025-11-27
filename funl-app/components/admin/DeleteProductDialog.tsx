'use client'

import { useState } from 'react'
import { Box, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { Button } from '@/components/ui/button'

interface DeleteProductDialogProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  onSuccess?: () => void
}

export function DeleteProductDialog({
  isOpen,
  onClose,
  productId,
  productName,
  onSuccess,
}: DeleteProductDialogProps) {
  const [reason, setReason] = useState<string>('')
  const [customReason, setCustomReason] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checks, setChecks] = useState<{
    hasOrders: boolean
    orderCount: number
    hasLinkedBatches: boolean
    linkedBatchCount: number
    currentStock: number
  } | null>(null)

  const reasonOptions = [
    { value: 'discontinued', label: 'Product discontinued' },
    { value: 'duplicate', label: 'Duplicate product' },
    { value: 'test', label: 'Test product - no longer needed' },
    { value: 'mistake', label: 'Created by mistake' },
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
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: finalReason,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete product')
      }

      // Show check results
      if (data.checks) {
        setChecks(data.checks)
      }

      // Success
      onSuccess?.()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setCustomReason('')
    setNotes('')
    setError(null)
    setChecks(null)
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
          Delete Product
        </h2>
        <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 4 })}>
          This will soft delete the product &quot;{productName}&quot;. The product will be hidden from
          customers but can be restored later if needed.
        </p>
          {/* Warning Box */}
          <Box mb={4} p={4} bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md">
            <p className={css({ fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
              ⚠️ Important Information
            </p>
            <ul className={css({ fontSize: 'sm', color: 'fg.muted', pl: 4 })}>
              <li>Product will be hidden from customers immediately</li>
              <li>Existing orders and QR codes will continue to work</li>
              <li>Product can be restored from the Deleted Products archive</li>
              <li>All historical data will be preserved</li>
            </ul>
          </Box>

          {/* Reason */}
          <Box mb={4}>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
              Reason for deletion *
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
                placeholder="Enter reason for deletion..."
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

          {/* Check Results (shown after successful deletion) */}
          {checks && (
            <Box mb={4} p={4} bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md">
              <p className={css({ fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                Product Impact Summary:
              </p>
              <ul className={css({ fontSize: 'sm', color: 'fg.muted', pl: 4 })}>
                <li>Orders: {checks.orderCount} {checks.hasOrders ? '(will remain accessible)' : ''}</li>
                <li>Linked Batches: {checks.linkedBatchCount}</li>
                <li>Current Stock: {checks.currentStock}</li>
              </ul>
            </Box>
          )}

        {/* Actions */}
        <Flex gap={3} justify="flex-end">
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant="solid"
            size="sm"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Product'}
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}
