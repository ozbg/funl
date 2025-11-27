'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

export function CreateProductDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [productType, setProductType] = useState('qr_stickers')
  const [tracksInventory, setTracksInventory] = useState(true)
  const [priceTiers, setPriceTiers] = useState([{ min_quantity: 1, unit_price: 0 }])
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-generate slug
    const autoSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setSlug(autoSlug)
  }

  const handleAddTier = () => {
    setPriceTiers([...priceTiers, { min_quantity: 1, unit_price: 0 }])
  }

  const handleRemoveTier = (index: number) => {
    if (priceTiers.length > 1) {
      setPriceTiers(priceTiers.filter((_, i) => i !== index))
    }
  }

  const handleTierChange = (index: number, field: 'min_quantity' | 'unit_price', value: number) => {
    const updated = [...priceTiers]
    updated[index][field] = value
    setPriceTiers(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !slug || !reason || reason.length < 10) {
      setError('Please fill in all required fields (reason must be at least 10 characters)')
      return
    }

    if (priceTiers.length === 0 || priceTiers.some(t => t.unit_price <= 0)) {
      setError('At least one pricing tier is required with a positive price')
      return
    }

    setIsSubmitting(true)

    try {
      // Convert prices from dollars to cents
      const pricingTiersInCents = priceTiers.map(tier => ({
        min_quantity: tier.min_quantity,
        unit_price: Math.round(tier.unit_price * 100)
      }))

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          product_type: productType,
          pricing_tiers: pricingTiersInCents,
          tracks_inventory: tracksInventory,
          reason,
          notes: notes || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create product')
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
    setName('')
    setSlug('')
    setDescription('')
    setProductType('qr_stickers')
    setTracksInventory(true)
    setPriceTiers([{ min_quantity: 1, unit_price: 0 }])
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
        Create Product
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
        maxW="3xl"
        maxH="90vh"
        overflowY="auto"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <Flex justify="space-between" align="center" p={6} borderBottomWidth="1px" borderColor="border.default">
            <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
              Create New Product
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
              <Box mb={4} p={3} bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md">
                <p className={css({ fontSize: 'sm', color: 'fg.default' })}>{error}</p>
              </Box>
            )}

            <Flex gap={4} mb={4}>
              <Box flex={1}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., QR Code Stickers - Premium"
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
              </Box>

              <Box flex={1}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                  Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="qr-code-stickers-premium"
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
              </Box>
            </Flex>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product description..."
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
            </Box>

            <Flex gap={4} mb={4}>
              <Box flex={1}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                  Product Type *
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
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
                  <option value="qr_stickers">QR Stickers</option>
                  <option value="physical_product">Physical Product</option>
                  <option value="digital_product">Digital Product</option>
                  <option value="service">Service</option>
                </select>
              </Box>

              <Box flex={1}>
                <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', mt: 8 })}>
                  <input
                    type="checkbox"
                    checked={tracksInventory}
                    onChange={(e) => setTracksInventory(e.target.checked)}
                    className={css({ cursor: 'pointer' })}
                  />
                  <span className={css({ fontSize: 'sm', color: 'fg.default' })}>
                    Track inventory
                  </span>
                </label>
              </Box>
            </Flex>

            {/* Pricing Tiers */}
            <Box mb={4}>
              <Flex justify="space-between" align="center" mb={2}>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  Pricing Tiers *
                </label>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className={css({
                    px: 3,
                    py: 1,
                    fontSize: 'xs',
                    fontWeight: 'medium',
                    color: 'accent.default',
                    cursor: 'pointer',
                    _hover: { textDecoration: 'underline' }
                  })}
                >
                  + Add Tier
                </button>
              </Flex>

              {priceTiers.map((tier, index) => (
                <Flex key={index} gap={3} mb={2} align="center">
                  <Box flex={1}>
                    <input
                      type="number"
                      value={tier.min_quantity}
                      onChange={(e) => handleTierChange(index, 'min_quantity', parseInt(e.target.value) || 1)}
                      placeholder="Min Qty"
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
                  </Box>
                  <Box flex={1}>
                    <input
                      type="number"
                      value={tier.unit_price}
                      onChange={(e) => handleTierChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      placeholder="Price ($)"
                      step="0.01"
                      min="0"
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
                  </Box>
                  {priceTiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(index)}
                      className={css({
                        px: 2,
                        py: 1,
                        fontSize: 'xs',
                        color: 'fg.default',
                        cursor: 'pointer',
                        _hover: { textDecoration: 'underline' }
                      })}
                    >
                      Remove
                    </button>
                  )}
                </Flex>
              ))}
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Reason * (min 10 characters)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for creating this product..."
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
              disabled={isSubmitting || !name || !slug || reason.length < 10}
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
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </button>
          </Flex>
        </form>
      </Box>
    </>
  )
}
