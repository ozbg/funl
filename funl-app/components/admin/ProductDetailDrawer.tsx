'use client'

import { useEffect, useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { ProductStatusBadge } from './ProductStatusBadge'
import { ProductTypeBadge } from './ProductTypeBadge'
import { StockBadge } from './StockBadge'
import { PriceDisplay } from './PriceDisplay'
import { ProductInventoryPanel } from './ProductInventoryPanel'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  product_type: string
  is_active: boolean
  featured: boolean
  pricing_tiers: Array<{ min_quantity: number; unit_price: number }>
  tracks_inventory: boolean
  current_stock: number | null
  low_stock_threshold: number | null
  thumbnail_url: string | null
}

interface ProductDetailDrawerProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

export function ProductDetailDrawer({
  product,
  isOpen,
  onClose,
  onRefresh: _onRefresh
}: ProductDetailDrawerProps) {
  const [inventoryData, setInventoryData] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && product.tracks_inventory) {
      setIsLoading(true)
      fetch(`/api/admin/products/${product.id}`)
        .then(res => res.json())
        .then(data => {
          setInventoryData(data.inventory)
        })
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, product.id, product.tracks_inventory])

  if (!isOpen) return null

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
        onClick={onClose}
      />

      {/* Drawer */}
      <Box
        position="fixed"
        top="0"
        right="0"
        bottom="0"
        w="full"
        maxW="2xl"
        bg="bg.default"
        boxShadow="xl"
        zIndex="50"
        overflowY="auto"
      >
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          p={6}
          borderBottomWidth="1px"
          borderColor="border.default"
          position="sticky"
          top="0"
          bg="bg.default"
          zIndex="10"
        >
          <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'fg.default' })}>
            Product Details
          </h2>
          <button
            onClick={onClose}
            className={css({
              color: 'fg.muted',
              cursor: 'pointer',
              fontSize: 'xl',
              _hover: { color: 'fg.default' }
            })}
          >
            ✕
          </button>
        </Flex>

        {/* Content */}
        <Box p={6}>
          {/* Product Info */}
          <Box mb={6}>
            {product.thumbnail_url && (
              <img
                src={product.thumbnail_url}
                alt={product.name}
                className={css({ w: 'full', h: '48', objectFit: 'cover', rounded: 'lg', mb: 4 })}
              />
            )}
            <h3 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'fg.default', mb: 2 })}>
              {product.name}
            </h3>
            <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 4 })}>
              Slug: {product.slug}
            </p>
            {product.description && (
              <p className={css({ fontSize: 'sm', color: 'fg.default', mb: 4 })}>
                {product.description}
              </p>
            )}
          </Box>

          {/* Badges */}
          <Flex gap={2} mb={6} flexWrap="wrap">
            <ProductStatusBadge isActive={product.is_active} />
            <ProductTypeBadge productType={product.product_type as never} />
            {product.featured && (
              <span className={css({
                px: 2.5,
                py: 1,
                fontSize: 'sm',
                fontWeight: 'medium',
                rounded: 'md',
                color: 'accent.default',
                bg: 'bg.muted'
              })}>
                ⭐ Featured
              </span>
            )}
          </Flex>

          {/* Pricing */}
          <Box mb={6} p={4} bg="bg.muted" rounded="lg">
            <h4 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.muted', mb: 3, textTransform: 'uppercase' })}>
              Pricing Tiers
            </h4>
            {product.pricing_tiers.map((tier, index) => (
              <Flex key={index} justify="space-between" mb={2}>
                <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                  {tier.min_quantity}+ units
                </span>
                <PriceDisplay cents={tier.unit_price} size="sm" />
              </Flex>
            ))}
          </Box>

          {/* Stock Status */}
          {product.tracks_inventory && (
            <Box mb={6}>
              <h4 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.muted', mb: 3, textTransform: 'uppercase' })}>
                Stock Status
              </h4>
              <StockBadge
                current={product.current_stock}
                lowThreshold={product.low_stock_threshold}
                tracksInventory={product.tracks_inventory}
                size="md"
              />
              {product.low_stock_threshold !== null && (
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 2 })}>
                  Low stock threshold: {product.low_stock_threshold}
                </p>
              )}
            </Box>
          )}

          {/* Inventory Details */}
          {product.tracks_inventory && Array.isArray(inventoryData) && !isLoading && (
            <Box>
              <h4 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.muted', mb: 3, textTransform: 'uppercase' })}>
                Linked Batches
              </h4>
              <ProductInventoryPanel productId={product.id} inventory={inventoryData} />
            </Box>
          )}

          {isLoading && (
            <Box p={4} textAlign="center">
              <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Loading inventory...</p>
            </Box>
          )}
        </Box>
      </Box>
    </>
  )
}
