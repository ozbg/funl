'use client'

import { useState } from 'react'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { ProductEditor } from './ProductEditor'
import { PricingTiersEditor } from './PricingTiersEditor'
import { ProductInventoryPanel } from './ProductInventoryPanel'
import { AdjustInventoryDialog } from './AdjustInventoryDialog'

interface Product {
  id: string
  name: string
  slug: string
  current_stock: number
  tracks_inventory: boolean
  low_stock_threshold: number
  pricing_tiers: Array<{ min_quantity: number; unit_price: number }>
}

interface LinkedBatch {
  id: string
  quantity_allocated: number
  quantity_remaining: number
  linked_at: string
  batch: {
    id: string
    batch_number: string
    name: string
    status: string
  }
}

interface ProductDetailTabsProps {
  product: Product
  linkedBatches: LinkedBatch[]
}

export function ProductDetailTabs({ product, linkedBatches }: ProductDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'pricing' | 'inventory'>('details')
  const [showAdjustInventory, setShowAdjustInventory] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const tabs = [
    { id: 'details' as const, label: 'Details' },
    { id: 'pricing' as const, label: 'Pricing' },
    { id: 'inventory' as const, label: 'Inventory' },
  ]

  const handleInventoryAdjusted = () => {
    setRefreshKey((prev) => prev + 1)
    // Refresh the page to get updated data
    window.location.reload()
  }

  return (
    <>
      <Box>
        {/* Tab Navigation */}
        <Flex
          borderBottomWidth="1px"
          borderColor="border.default"
          mb={6}
          gap={1}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={css({
                px: 4,
                py: 3,
                fontSize: 'sm',
                fontWeight: 'medium',
                color: activeTab === tab.id ? 'accent.default' : 'fg.muted',
                borderBottomWidth: '2px',
                borderColor: activeTab === tab.id ? 'accent.default' : 'transparent',
                cursor: 'pointer',
                _hover: {
                  color: activeTab === tab.id ? 'accent.default' : 'fg.default',
                },
              })}
            >
              {tab.label}
            </button>
          ))}
        </Flex>

        {/* Tab Content */}
        <Box>
          {activeTab === 'details' && (
            <Box maxWidth="800px">
              <ProductEditor productId={product.id} initialData={product as never} />
            </Box>
          )}

          {activeTab === 'pricing' && (
            <Box>
              <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 4 })}>
                Pricing Tiers
              </h2>
              <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 4 })}>
                Pricing tier management UI coming soon. Current tiers: {product.pricing_tiers?.length || 0}
              </p>

              <Box mt={8} pt={8} borderTopWidth="1px" borderColor="border.default">
                <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 4 })}>
                  Pricing History
                </h3>
                <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                  View pricing changes over time (coming soon)
                </p>
              </Box>
            </Box>
          )}

          {activeTab === 'inventory' && (
            <Box>
              <Grid columns={{ base: 1, md: 2 }} gap={6} mb={6}>
                {/* Current Stock Card */}
                <Box p={6} bg="bg.default" rounded="lg" borderWidth="1px" borderColor="border.default">
                  <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>
                    Current Stock
                  </p>
                  <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'accent.default' })}>
                    {product.current_stock || 0}
                  </p>
                  {product.tracks_inventory && (
                    <Flex gap={2} mt={4}>
                      <button
                        onClick={() => setShowAdjustInventory(true)}
                        className={css({
                          px: 3,
                          py: 2,
                          bg: 'accent.default',
                          color: 'white',
                          rounded: 'md',
                          fontSize: 'sm',
                          fontWeight: 'medium',
                          cursor: 'pointer',
                          _hover: { opacity: 0.9 },
                        })}
                      >
                        Adjust Inventory
                      </button>
                    </Flex>
                  )}
                </Box>

                {/* Stock Status Card */}
                <Box p={6} bg="bg.default" rounded="lg" borderWidth="1px" borderColor="border.default">
                  <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>
                    Stock Status
                  </p>
                  {!product.tracks_inventory ? (
                    <p className={css({ fontSize: 'lg', fontWeight: 'medium' })}>
                      Not Tracking Inventory
                    </p>
                  ) : product.current_stock === 0 ? (
                    <p className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'red.600' })}>
                      Out of Stock
                    </p>
                  ) : product.current_stock <= product.low_stock_threshold ? (
                    <p className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'orange.600' })}>
                      Low Stock
                    </p>
                  ) : (
                    <p className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'green.600' })}>
                      In Stock
                    </p>
                  )}
                  {product.tracks_inventory && (
                    <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 2 })}>
                      Low stock threshold: {product.low_stock_threshold || 0}
                    </p>
                  )}
                </Box>
              </Grid>

              {/* Linked Batches */}
              <Box mb={8}>
                <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 4 })}>
                  Linked QR Code Batches
                </h3>
                <ProductInventoryPanel productId={product.id} inventory={linkedBatches as never} />
              </Box>

              {/* Inventory History */}
              <Box pt={8} borderTopWidth="1px" borderColor="border.default">
                <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 4 })}>
                  Inventory Adjustment History
                </h3>
                <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                  View all inventory adjustments (coming soon)
                </p>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Adjust Inventory Dialog */}
      {showAdjustInventory && (
        <AdjustInventoryDialog
          isOpen={showAdjustInventory}
          onClose={() => setShowAdjustInventory(false)}
          productId={product.id}
          productName={product.name}
          currentStock={product.current_stock || 0}
          onSuccess={handleInventoryAdjusted}
        />
      )}
    </>
  )
}
