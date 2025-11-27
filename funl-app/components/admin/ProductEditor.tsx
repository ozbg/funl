'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'

interface PricingTier {
  min_quantity: number
  max_quantity: number | null
  unit_price: number
}

interface SizePricing {
  [size: string]: number
}

interface ProductEditorProps {
  productId?: string
  initialData?: {
    name: string
    slug: string
    description: string
    product_type: string
    pricing_tiers: PricingTier[]
    available_sizes: string[]
    size_pricing: SizePricing
    is_active: boolean
    featured: boolean
    tracks_inventory: boolean
    current_stock: number
    low_stock_threshold: number
    min_purchase_quantity: number
    max_purchase_quantity: number | null
  }
  onSave?: () => void
}

export function ProductEditor({ productId, initialData, onSave }: ProductEditorProps) {
  const [isEditing, setIsEditing] = useState(!productId)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initialData?.name || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(
    initialData?.pricing_tiers || [{ min_quantity: 1, max_quantity: null, unit_price: 5.0 }]
  )
  const [availableSizes] = useState(initialData?.available_sizes || ['50mm', '75mm', '100mm'])
  const [sizePricing, setSizePricing] = useState<SizePricing>(
    initialData?.size_pricing || { '50mm': 1.0, '75mm': 1.5, '100mm': 2.0 }
  )
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [featured, setFeatured] = useState(initialData?.featured ?? false)
  const [tracksInventory] = useState(initialData?.tracks_inventory ?? true)
  const [currentStock, setCurrentStock] = useState(initialData?.current_stock || 0)
  const [lowStockThreshold, setLowStockThreshold] = useState(initialData?.low_stock_threshold || 50)
  const [minPurchaseQuantity, setMinPurchaseQuantity] = useState(initialData?.min_purchase_quantity || 1)
  const [maxPurchaseQuantity, setMaxPurchaseQuantity] = useState<number | null>(
    initialData?.max_purchase_quantity || null
  )

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const endpoint = productId ? `/api/admin/products/${productId}` : '/api/admin/products'
      const method = productId ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description,
          pricing_tiers: pricingTiers,
          available_sizes: availableSizes,
          size_pricing: sizePricing,
          is_active: isActive,
          featured,
          tracks_inventory: tracksInventory,
          current_stock: currentStock,
          low_stock_threshold: lowStockThreshold,
          min_purchase_quantity: minPurchaseQuantity,
          max_purchase_quantity: maxPurchaseQuantity,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save product')
      }

      setIsEditing(false)
      onSave?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Box>
      {error && (
        <Box bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md" p={4} mb={4}>
          <p className={css({ color: 'fg.default', fontSize: 'sm' })}>{error}</p>
        </Box>
      )}

      <Grid columns={{ base: 1, md: 2 }} gap={6}>
        {/* Basic Info */}
        <Box>
          <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
            Product Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isEditing}
            className={css({
              width: '100%',
              px: 3,
              py: 2,
              borderWidth: '1px',
              borderColor: 'border.default',
              rounded: 'md',
              _disabled: { bg: 'bg.muted', cursor: 'not-allowed' },
            })}
          />
        </Box>

        <Box>
          <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={!isEditing}
            className={css({
              width: '100%',
              px: 3,
              py: 2,
              borderWidth: '1px',
              borderColor: 'border.default',
              rounded: 'md',
              _disabled: { bg: 'bg.muted', cursor: 'not-allowed' },
            })}
          />
        </Box>
      </Grid>

      <Box mt={4}>
        <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isEditing}
          rows={3}
          className={css({
            width: '100%',
            px: 3,
            py: 2,
            borderWidth: '1px',
            borderColor: 'border.default',
            rounded: 'md',
            _disabled: { bg: 'gray.50', cursor: 'not-allowed' },
          })}
        />
      </Box>

      {/* Pricing Tiers */}
      <Box mt={6}>
        <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 3 })}>Pricing Tiers</h3>
        {pricingTiers.map((tier, index) => (
          <Grid key={index} columns={3} gap={4} mb={3}>
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                Min Qty
              </label>
              <input
                type="number"
                value={tier.min_quantity}
                onChange={(e) => {
                  const updated = [...pricingTiers]
                  updated[index].min_quantity = parseInt(e.target.value) || 0
                  setPricingTiers(updated)
                }}
                disabled={!isEditing}
                className={css({
                  width: '100%',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                })}
              />
            </Box>
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                Max Qty
              </label>
              <input
                type="number"
                value={tier.max_quantity || ''}
                onChange={(e) => {
                  const updated = [...pricingTiers]
                  updated[index].max_quantity = e.target.value ? parseInt(e.target.value) : null
                  setPricingTiers(updated)
                }}
                disabled={!isEditing}
                placeholder="Unlimited"
                className={css({
                  width: '100%',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                })}
              />
            </Box>
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                Unit Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={tier.unit_price}
                onChange={(e) => {
                  const updated = [...pricingTiers]
                  updated[index].unit_price = parseFloat(e.target.value) || 0
                  setPricingTiers(updated)
                }}
                disabled={!isEditing}
                className={css({
                  width: '100%',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                })}
              />
            </Box>
          </Grid>
        ))}
      </Box>

      {/* Size Pricing Multipliers */}
      <Box mt={6}>
        <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 3 })}>Size Multipliers</h3>
        <Grid columns={3} gap={4}>
          {availableSizes.map((size) => (
            <Box key={size}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                {size}
              </label>
              <input
                type="number"
                step="0.1"
                value={sizePricing[size] || 1.0}
                onChange={(e) => {
                  setSizePricing({ ...sizePricing, [size]: parseFloat(e.target.value) || 1.0 })
                }}
                disabled={!isEditing}
                className={css({
                  width: '100%',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                })}
              />
            </Box>
          ))}
        </Grid>
      </Box>

      {/* Inventory */}
      <Grid columns={{ base: 1, md: 2 }} gap={6} mt={6}>
        <Box>
          <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
            Current Stock
          </label>
          <input
            type="number"
            value={currentStock}
            onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
            disabled={!isEditing}
            className={css({
              width: '100%',
              px: 3,
              py: 2,
              borderWidth: '1px',
              borderColor: 'border.default',
              rounded: 'md',
            })}
          />
        </Box>
        <Box>
          <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
            Low Stock Threshold
          </label>
          <input
            type="number"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
            disabled={!isEditing}
            className={css({
              width: '100%',
              px: 3,
              py: 2,
              borderWidth: '1px',
              borderColor: 'border.default',
              rounded: 'md',
            })}
          />
        </Box>
      </Grid>

      {/* Toggles */}
      <Flex gap={6} mt={6}>
        <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={!isEditing}
          />
          <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>Active</span>
        </label>
        <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            disabled={!isEditing}
          />
          <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>Featured</span>
        </label>
      </Flex>

      {/* Actions */}
      <Flex gap={3} mt={6}>
        {isEditing ? (
          <>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="solid"
              size="sm"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            {productId && (
              <Button
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            )}
          </>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            variant="solid"
            size="sm"
          >
            Edit
          </Button>
        )}
      </Flex>
    </Box>
  )
}
