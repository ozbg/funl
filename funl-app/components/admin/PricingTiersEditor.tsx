'use client'

import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface PricingTier {
  min_quantity: number
  max_quantity: number | null
  unit_price: number
}

interface PricingTiersEditorProps {
  tiers: PricingTier[]
  onChange: (tiers: PricingTier[]) => void
}

export function PricingTiersEditor({ tiers, onChange }: PricingTiersEditorProps) {
  const updateTier = (index: number, field: keyof PricingTier, value: number | null) => {
    const newTiers = [...tiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    onChange(newTiers)
  }

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1]
    const newMin = lastTier?.max_quantity ? lastTier.max_quantity + 1 : 1
    onChange([
      ...tiers,
      { min_quantity: newMin, max_quantity: null, unit_price: 3.00 }
    ])
  }

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      onChange(tiers.filter((_, i) => i !== index))
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

  return (
    <Box>
      {tiers.map((tier, index) => (
        <Grid key={index} gridTemplateColumns="1fr 1fr 1fr auto" gap={2} mb={2}>
          <Box>
            <label className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1, display: 'block' })}>
              Min Qty
            </label>
            <input
              type="number"
              min="1"
              value={tier.min_quantity}
              onChange={(e) => updateTier(index, 'min_quantity', parseInt(e.target.value) || 1)}
              className={inputStyles}
            />
          </Box>
          <Box>
            <label className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1, display: 'block' })}>
              Max Qty
            </label>
            <input
              type="number"
              min="1"
              value={tier.max_quantity || ''}
              onChange={(e) => updateTier(index, 'max_quantity', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="∞"
              className={inputStyles}
            />
          </Box>
          <Box>
            <label className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1, display: 'block' })}>
              Price (AUD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={tier.unit_price}
              onChange={(e) => updateTier(index, 'unit_price', parseFloat(e.target.value) || 0)}
              className={inputStyles}
            />
          </Box>
          <Box>
            <label className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1, display: 'block' })}>
              &nbsp;
            </label>
            {tiers.length > 1 && (
              <button
                type="button"
                onClick={() => removeTier(index)}
                className={css({
                  px: 3,
                  py: 2,
                  bg: 'red.subtle',
                  color: 'red.text',
                  rounded: 'md',
                  fontSize: 'sm',
                  fontWeight: 'medium',
                  _hover: { bg: 'red.emphasized' }
                })}
              >
                Remove
              </button>
            )}
          </Box>
        </Grid>
      ))}

      <button
        type="button"
        onClick={addTier}
        className={css({
          px: 4,
          py: 2,
          bg: 'accent.subtle',
          color: 'accent.text',
          rounded: 'md',
          fontSize: 'sm',
          fontWeight: 'medium',
          mt: 2,
          _hover: { bg: 'accent.emphasized' }
        })}
      >
        + Add Tier
      </button>

      {/* Preview */}
      <Box mt={4} p={3} bg="bg.subtle" rounded="md" borderWidth="1px" borderColor="border.default">
        <p className={css({ fontSize: 'xs', fontWeight: 'semibold', mb: 2, color: 'fg.muted' })}>
          Preview:
        </p>
        {tiers.map((tier, index) => (
          <p key={index} className={css({ fontSize: 'xs', color: 'fg.default', mb: 1 })}>
            {tier.min_quantity}-{tier.max_quantity || '∞'} units: ${tier.unit_price.toFixed(2)} each
          </p>
        ))}
      </Box>
    </Box>
  )
}
