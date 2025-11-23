'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface Product {
  id: string
  name: string
}

interface Batch {
  id: string
  batch_name: string
  quantity_remaining: number
}

interface TransferInventoryDialogProps {
  fromProductId: string
  fromProductName: string
  onSuccess: () => void
}

export function TransferInventoryDialog({
  fromProductId,
  fromProductName,
  onSuccess
}: TransferInventoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [toProductId, setToProductId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, fromProductId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load all products except current one
      const productsRes = await fetch('/api/admin/products')
      const productsData = await productsRes.json()
      const filteredProducts = (productsData.products || []).filter(
        (p: Product) => p.id !== fromProductId
      )
      setProducts(filteredProducts)

      // Load batches linked to current product
      const productRes = await fetch(`/api/admin/products/${fromProductId}`)
      const productData = await productRes.json()
      setBatches(productData.inventory || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const qty = parseInt(quantity)
    if (!toProductId || !batchId || !quantity || isNaN(qty) || qty < 1) {
      setError('Please fill in all required fields with valid values')
      return
    }

    if (!reason || reason.length < 10) {
      setError('Please provide a reason (minimum 10 characters)')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/products/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_product_id: fromProductId,
          to_product_id: toProductId,
          batch_id: batchId,
          quantity: qty,
          reason,
          notes: notes || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to transfer inventory')
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
    setToProductId('')
    setBatchId('')
    setQuantity('')
    setReason('')
    setNotes('')
    setError('')
  }

  const selectedBatch = batches.find(b => b.id === batchId)

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
        Transfer
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
              Transfer Inventory
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

            <Box mb={4} p={3} bg="blue.50" borderWidth="1px" borderColor="blue.200" rounded="md">
              <p className={css({ fontSize: 'sm', color: 'blue.700' })}>
                Transferring from: <strong>{fromProductName}</strong>
              </p>
            </Box>

            {isLoading ? (
              <Box p={4} textAlign="center">
                <p className={css({ color: 'fg.muted' })}>Loading...</p>
              </Box>
            ) : (
              <>
                <Box mb={4}>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                    Select Batch *
                  </label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
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
                        ringOffset: '0'
                      }
                    })}
                  >
                    <option value="">Select a batch...</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batch_name} ({batch.quantity_remaining} available)
                      </option>
                    ))}
                  </select>
                </Box>

                <Box mb={4}>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                    Transfer To *
                  </label>
                  <select
                    value={toProductId}
                    onChange={(e) => setToProductId(e.target.value)}
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
                        ringOffset: '0'
                      }
                    })}
                  >
                    <option value="">Select a product...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </Box>

                <Box mb={4}>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g., 50"
                    min="1"
                    max={selectedBatch?.quantity_remaining || undefined}
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
                  {selectedBatch && (
                    <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                      Maximum: {selectedBatch.quantity_remaining}
                    </p>
                  )}
                </Box>

                <Box mb={4}>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                    Reason * (min 10 characters)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter the reason for this transfer..."
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
              </>
            )}
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
              disabled={isSubmitting || !toProductId || !batchId || !quantity || reason.length < 10 || isLoading}
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
              {isSubmitting ? 'Transferring...' : 'Transfer Inventory'}
            </button>
          </Flex>
        </form>
      </Box>
    </>
  )
}
