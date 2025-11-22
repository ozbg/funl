'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { PricingTiersEditor } from './PricingTiersEditor'

interface PricingTier {
  min_quantity: number
  max_quantity: number | null
  unit_price: number
}

interface BatchPricingEditorProps {
  batchId: string
  currentPricing: {
    pricing_tiers: PricingTier[]
    size_pricing: Record<string, number>
    is_available_for_purchase: boolean
    featured: boolean
    min_purchase_quantity: number
    max_purchase_quantity?: number | null
  }
}

export function BatchPricingEditor({ batchId, currentPricing }: BatchPricingEditorProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState(currentPricing)

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/batches/${batchId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricing_tiers: formData.pricing_tiers,
          size_pricing: formData.size_pricing,
          is_available_for_purchase: formData.is_available_for_purchase,
          featured: formData.featured,
          min_purchase_quantity: formData.min_purchase_quantity,
          max_purchase_quantity: formData.max_purchase_quantity,
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update pricing')
      }

      setEditing(false)
      router.refresh()
    } catch (err) {
      console.error('Error updating pricing:', err)
      setError(err instanceof Error ? err.message : 'Failed to update pricing')
    } finally {
      setSaving(false)
    }
  }

  const inputStyles = css({
    w: 'full',
    px: 3,
    py: 2,
    borderWidth: '1px',
    borderColor: 'border.default',
    rounded: 'md',
    fontSize: 'sm',
    _focus: {
      outline: 'none',
      borderColor: 'accent.default',
      ring: '2px',
      ringColor: 'accent.subtle'
    }
  })

  if (!editing) {
    return (
      <Box p={6} bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <Flex justify="space-between" align="center" mb={4}>
          <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>
            Pricing & Availability
          </h3>
          <button
            onClick={() => setEditing(true)}
            className={css({
              px: 4,
              py: 2,
              bg: 'accent.default',
              color: 'white',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'semibold',
              _hover: { bg: 'accent.emphasized' }
            })}
          >
            Edit Pricing
          </button>
        </Flex>

        {/* Current Pricing Display */}
        <Box p={4} bg="bg.subtle" rounded="md" borderWidth="1px" borderColor="border.default">
          <p className={css({ fontSize: 'sm', fontWeight: 'semibold', mb: 2 })}>
            Volume Pricing:
          </p>
          {currentPricing.pricing_tiers.map((tier, index) => (
            <p key={index} className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
              {tier.min_quantity}-{tier.max_quantity || '∞'} units: ${tier.unit_price.toFixed(2)} each
            </p>
          ))}

          <p className={css({ fontSize: 'sm', fontWeight: 'semibold', mt: 4, mb: 2 })}>
            Size Multipliers:
          </p>
          {Object.entries(currentPricing.size_pricing).map(([size, multiplier]) => (
            <p key={size} className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>
              {size}: {multiplier}x
            </p>
          ))}

          <p className={css({ fontSize: 'sm', fontWeight: 'semibold', mt: 4, mb: 2 })}>
            Availability:
          </p>
          <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            {currentPricing.is_available_for_purchase ? '✅ Available for purchase' : '❌ Not available'}
          </p>
          {currentPricing.featured && (
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              ⭐ Featured batch
            </p>
          )}

          <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 2 })}>
            Min purchase: {currentPricing.min_purchase_quantity} units
          </p>
          {currentPricing.max_purchase_quantity && (
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              Max purchase: {currentPricing.max_purchase_quantity} units
            </p>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <Box p={6} bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
      <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 4 })}>
        Edit Pricing & Availability
      </h3>

      {error && (
        <Box mb={4} p={3} bg="red.subtle" borderWidth="1px" borderColor="red.default" rounded="md">
          <p className={css({ fontSize: 'sm', color: 'red.text' })}>{error}</p>
        </Box>
      )}

      <Box mb={4}>
        <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
          Volume Pricing Tiers
        </label>
        <PricingTiersEditor
          tiers={formData.pricing_tiers}
          onChange={(tiers) => setFormData({ ...formData, pricing_tiers: tiers })}
        />
      </Box>

      <Box mb={4}>
        <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
          Size Pricing Multipliers
        </label>
        <Grid gridTemplateColumns="repeat(3, 1fr)" gap={3}>
          {['50mm', '75mm', '100mm'].map((size) => (
            <Box key={size}>
              <label className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                {size}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.size_pricing[size] || 1.0}
                onChange={(e) => setFormData({
                  ...formData,
                  size_pricing: { ...formData.size_pricing, [size]: parseFloat(e.target.value) || 1.0 }
                })}
                className={inputStyles}
              />
            </Box>
          ))}
        </Grid>
        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 2 })}>
          1.0 = base price, 1.5 = 50% more, 2.0 = double
        </p>
      </Box>

      <Box mb={4}>
        <Flex align="center" gap={2}>
          <input
            type="checkbox"
            id="available"
            checked={formData.is_available_for_purchase}
            onChange={(e) => setFormData({ ...formData, is_available_for_purchase: e.target.checked })}
            className={css({ cursor: 'pointer' })}
          />
          <label htmlFor="available" className={css({ fontSize: 'sm', cursor: 'pointer' })}>
            Available for purchase
          </label>
        </Flex>
      </Box>

      <Box mb={4}>
        <Flex align="center" gap={2}>
          <input
            type="checkbox"
            id="featured-edit"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            className={css({ cursor: 'pointer' })}
          />
          <label htmlFor="featured-edit" className={css({ fontSize: 'sm', cursor: 'pointer' })}>
            Featured batch (show at top of buy page)
          </label>
        </Flex>
      </Box>

      <Grid gridTemplateColumns="repeat(2, 1fr)" gap={3} mb={6}>
        <Box>
          <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
            Minimum Purchase Quantity
          </label>
          <input
            type="number"
            min="1"
            value={formData.min_purchase_quantity}
            onChange={(e) => setFormData({ ...formData, min_purchase_quantity: parseInt(e.target.value) || 1 })}
            className={inputStyles}
          />
        </Box>
        <Box>
          <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
            Maximum Purchase Quantity
          </label>
          <input
            type="number"
            min="1"
            value={formData.max_purchase_quantity || ''}
            onChange={(e) => setFormData({ ...formData, max_purchase_quantity: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="No limit"
            className={inputStyles}
          />
        </Box>
      </Grid>

      <Flex gap={3}>
        <button
          onClick={handleSave}
          disabled={saving}
          className={css({
            px: 6,
            py: 2,
            bg: 'accent.default',
            color: 'white',
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'semibold',
            _hover: { bg: 'accent.emphasized' },
            _disabled: { opacity: 0.5, cursor: 'not-allowed' }
          })}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={() => {
            setFormData(currentPricing)
            setEditing(false)
            setError(null)
          }}
          disabled={saving}
          className={css({
            px: 6,
            py: 2,
            bg: 'bg.subtle',
            color: 'fg.default',
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'semibold',
            _hover: { bg: 'bg.muted' },
            _disabled: { opacity: 0.5, cursor: 'not-allowed' }
          })}
        >
          Cancel
        </button>
      </Flex>
    </Box>
  )
}
