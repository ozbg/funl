'use client'

import { useState } from 'react'
import { Box, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface AdjustInventoryDialogProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  currentStock: number
  onSuccess?: () => void
}

export function AdjustInventoryDialog({
  isOpen,
  onClose,
  productId,
  productName,
  currentStock,
  onSuccess,
}: AdjustInventoryDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add')
  const [quantity, setQuantity] = useState<number>(0)
  const [reason, setReason] = useState<string>('')
  const [customReason, setCustomReason] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reasonOptions = [
    { value: 'received', label: 'Received from supplier' },
    { value: 'damaged', label: 'Damaged goods' },
    { value: 'lost', label: 'Lost in warehouse' },
    { value: 'found', label: 'Found in warehouse' },
    { value: 'correction', label: 'Inventory correction' },
    { value: 'other', label: 'Other (specify below)' },
  ]

  const calculateNewStock = (): number => {
    switch (adjustmentType) {
      case 'add':
        return currentStock + quantity
      case 'remove':
        return currentStock - quantity
      case 'set':
        return quantity
      default:
        return currentStock
    }
  }

  const newStock = calculateNewStock()
  const quantityChange = newStock - currentStock

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

    if (quantity <= 0) {
      setError('Quantity must be greater than 0')
      return
    }

    if (adjustmentType === 'remove' && quantity > currentStock) {
      setError('Cannot remove more than current stock')
      return
    }

    if (adjustmentType === 'set' && quantity < 0) {
      setError('Cannot set stock to negative value')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/products/${productId}/adjust-inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustment_type: adjustmentType,
          quantity,
          reason: reason === 'other' ? customReason : reason,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to adjust inventory')
      }

      // Success
      onSuccess?.()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust inventory')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAdjustmentType('add')
    setQuantity(0)
    setReason('')
    setCustomReason('')
    setNotes('')
    setError(null)
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
        maxWidth="500px"
        width="100%"
        maxHeight="90vh"
        overflowY="auto"
      >
        <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 4 })}>
          Adjust Inventory
        </h2>

        {/* Product Info */}
        <Box mb={4} p={4} bg="bg.muted" rounded="md">
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Product</p>
          <p className={css({ fontWeight: 'medium' })}>{productName}</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'accent.default', mt: 2 })}>
            Current Stock: {currentStock}
          </p>
        </Box>

        {/* Adjustment Type */}
        <Box mb={4}>
          <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
            Adjustment Type
          </label>
          <Flex gap={2}>
            <button
              onClick={() => setAdjustmentType('add')}
              className={css({
                flex: 1,
                py: 2,
                px: 3,
                rounded: 'md',
                fontSize: 'sm',
                fontWeight: 'medium',
                bg: adjustmentType === 'add' ? 'green.500' : 'bg.muted',
                color: adjustmentType === 'add' ? 'white' : 'fg.default',
                cursor: 'pointer',
                _hover: { opacity: 0.9 },
              })}
            >
              Add Stock
            </button>
            <button
              onClick={() => setAdjustmentType('remove')}
              className={css({
                flex: 1,
                py: 2,
                px: 3,
                rounded: 'md',
                fontSize: 'sm',
                fontWeight: 'medium',
                bg: adjustmentType === 'remove' ? 'red.500' : 'bg.muted',
                color: adjustmentType === 'remove' ? 'white' : 'fg.default',
                cursor: 'pointer',
                _hover: { opacity: 0.9 },
              })}
            >
              Remove Stock
            </button>
            <button
              onClick={() => setAdjustmentType('set')}
              className={css({
                flex: 1,
                py: 2,
                px: 3,
                rounded: 'md',
                fontSize: 'sm',
                fontWeight: 'medium',
                bg: adjustmentType === 'set' ? 'blue.500' : 'bg.muted',
                color: adjustmentType === 'set' ? 'white' : 'fg.default',
                cursor: 'pointer',
                _hover: { opacity: 0.9 },
              })}
            >
              Set Stock
            </button>
          </Flex>
        </Box>

        {/* Quantity */}
        <Box mb={4}>
          <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
            {adjustmentType === 'set' ? 'New Stock Level' : 'Quantity'}
          </label>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
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

        {/* Preview */}
        {quantity > 0 && (
          <Box mb={4} p={3} bg="blue.50" borderWidth="1px" borderColor="blue.200" rounded="md">
            <p className={css({ fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
              Preview:
            </p>
            <p className={css({ fontSize: 'sm' })}>
              Current: {currentStock} → New: {newStock}
              {quantityChange !== 0 && (
                <span className={css({ fontWeight: 'semibold', color: quantityChange > 0 ? 'green.600' : 'red.600', ml: 2 })}>
                  ({quantityChange > 0 ? '+' : ''}{quantityChange})
                </span>
              )}
            </p>
          </Box>
        )}

        {/* Warning for low or zero stock */}
        {newStock === 0 && (
          <Box mb={4} p={3} bg="red.50" borderWidth="1px" borderColor="red.200" rounded="md">
            <p className={css({ fontSize: 'sm', color: 'red.700', fontWeight: 'medium' })}>
              ⚠️ Warning: This will set stock to 0 (out of stock)
            </p>
          </Box>
        )}

        {/* Reason */}
        <Box mb={4}>
          <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
            Reason *
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
              Specify Reason *
            </label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter custom reason..."
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
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional notes..."
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
          <Box mb={4} p={3} bg="red.50" borderWidth="1px" borderColor="red.200" rounded="md">
            <p className={css({ fontSize: 'sm', color: 'red.700' })}>{error}</p>
          </Box>
        )}

        {/* Actions */}
        <Flex gap={3} justify="flex-end">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className={css({
              px: 4,
              py: 2,
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'medium',
              bg: 'bg.muted',
              color: 'fg.default',
              cursor: 'pointer',
              _hover: { bg: 'bg.subtle' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' },
            })}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={css({
              px: 4,
              py: 2,
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'medium',
              bg: 'accent.default',
              color: 'white',
              cursor: 'pointer',
              _hover: { opacity: 0.9 },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' },
            })}
          >
            {isSubmitting ? 'Adjusting...' : 'Adjust Inventory'}
          </button>
        </Flex>
      </Box>
    </Box>
  )
}
