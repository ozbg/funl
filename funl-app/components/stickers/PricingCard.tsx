'use client'

import { useState } from 'react'
import { Box, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { StickerPreview } from './StickerPreview'
import { useCartStore } from '@/store/cartStore'

interface PricingTier {
  min_quantity: number
  max_quantity: number | null
  unit_price: number
}

interface StickerStyle {
  id: string
  name: string
  template: string
  preview_url?: string
}

interface PricingCardProps {
  batch_id: string
  batch_name: string
  size: 'small' | 'medium' | 'large'
  available_quantity: number
  pricing_tiers: PricingTier[]
  styles: StickerStyle[]
  sample_qr_url: string
}

export function PricingCard({
  batch_id,
  batch_name,
  size,
  available_quantity,
  pricing_tiers,
  styles,
  sample_qr_url
}: PricingCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedStyle, setSelectedStyle] = useState<StickerStyle>(styles[0])
  const addItem = useCartStore((state) => state.addItem)

  // Get current price based on quantity
  const getCurrentPrice = () => {
    const tier = pricing_tiers.find(
      (t) =>
        quantity >= t.min_quantity &&
        (t.max_quantity === null || quantity <= t.max_quantity)
    )
    return tier?.unit_price || pricing_tiers[0].unit_price
  }

  const unitPrice = getCurrentPrice()
  const totalPrice = quantity * unitPrice

  const handleAddToCart = () => {
    addItem({
      batch_id,
      batch_name,
      size,
      style: selectedStyle,
      quantity,
      unit_price: unitPrice
    })

    // Reset quantity
    setQuantity(1)

    // Show success feedback (you can enhance this with a toast)
    alert(`Added ${quantity} ${size} sticker(s) to cart`)
  }

  return (
    <Box
      p={6}
      bg="bg.default"
      borderWidth="1px"
      borderColor="border.default"
      rounded="lg"
      boxShadow="sm"
    >
      {/* Header */}
      <Flex justify="space-between" align="start" mb={4}>
        <Box>
          <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>
            {size.charAt(0).toUpperCase() + size.slice(1)} Stickers
          </h3>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
            {available_quantity} available
          </p>
        </Box>
        <StickerPreview
          qrCodeUrl={sample_qr_url}
          style={selectedStyle}
          size={size}
          showSize={false}
        />
      </Flex>

      {/* Style Selection */}
      <Box mb={4}>
        <label className={css({ fontSize: 'sm', fontWeight: 'medium', display: 'block', mb: 2 })}>
          Style
        </label>
        <Flex gap={2} flexWrap="wrap">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style)}
              className={css({
                px: 3,
                py: 2,
                borderWidth: '2px',
                borderColor: selectedStyle.id === style.id ? 'accent.default' : 'border.default',
                bg: selectedStyle.id === style.id ? 'accent.subtle' : 'bg.subtle',
                color: selectedStyle.id === style.id ? 'accent.text' : 'fg.default',
                rounded: 'md',
                fontSize: 'sm',
                fontWeight: 'medium',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  borderColor: 'accent.default',
                  bg: 'accent.subtle'
                }
              })}
            >
              {style.name}
            </button>
          ))}
        </Flex>
      </Box>

      {/* Quantity Selection */}
      <Box mb={4}>
        <label className={css({ fontSize: 'sm', fontWeight: 'medium', display: 'block', mb: 2 })}>
          Quantity
        </label>
        <Flex gap={2} align="center">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className={css({
              w: 10,
              h: 10,
              bg: 'bg.subtle',
              borderWidth: '1px',
              borderColor: 'border.default',
              rounded: 'md',
              fontSize: 'lg',
              fontWeight: 'semibold',
              cursor: 'pointer',
              _hover: { bg: 'bg.muted' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' }
            })}
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={available_quantity}
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1
              setQuantity(Math.min(available_quantity, Math.max(1, val)))
            }}
            className={css({
              w: 20,
              h: 10,
              textAlign: 'center',
              borderWidth: '1px',
              borderColor: 'border.default',
              rounded: 'md',
              fontSize: 'md',
              fontWeight: 'medium'
            })}
          />
          <button
            onClick={() => setQuantity(Math.min(available_quantity, quantity + 1))}
            disabled={quantity >= available_quantity}
            className={css({
              w: 10,
              h: 10,
              bg: 'bg.subtle',
              borderWidth: '1px',
              borderColor: 'border.default',
              rounded: 'md',
              fontSize: 'lg',
              fontWeight: 'semibold',
              cursor: 'pointer',
              _hover: { bg: 'bg.muted' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' }
            })}
          >
            +
          </button>
        </Flex>
      </Box>

      {/* Pricing Tiers Info */}
      <Box mb={4} p={3} bg="bg.subtle" rounded="md">
        <p className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.muted', mb: 2 })}>
          VOLUME PRICING
        </p>
        {pricing_tiers.map((tier, idx) => (
          <Flex key={idx} justify="space-between" fontSize="xs" color="fg.muted" mb={1}>
            <span>
              {tier.min_quantity}
              {tier.max_quantity ? `-${tier.max_quantity}` : '+'} stickers
            </span>
            <span className={css({ fontWeight: 'semibold' })}>
              ${tier.unit_price.toFixed(2)} each
            </span>
          </Flex>
        ))}
      </Box>

      {/* Total Price */}
      <Box mb={4}>
        <Flex justify="space-between" align="baseline">
          <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Unit Price:</span>
          <span className={css({ fontSize: 'md', fontWeight: 'medium' })}>
            ${unitPrice.toFixed(2)}
          </span>
        </Flex>
        <Flex justify="space-between" align="baseline" mt={2}>
          <span className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>Total:</span>
          <span className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'accent.default' })}>
            ${totalPrice.toFixed(2)}
          </span>
        </Flex>
      </Box>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        className={css({
          w: 'full',
          px: 6,
          py: 3,
          bg: 'accent.default',
          color: 'white',
          rounded: 'md',
          fontSize: 'md',
          fontWeight: 'semibold',
          cursor: 'pointer',
          transition: 'all 0.2s',
          _hover: {
            bg: 'accent.emphasized'
          }
        })}
      >
        Add to Cart
      </button>
    </Box>
  )
}
