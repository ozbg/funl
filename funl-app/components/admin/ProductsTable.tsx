'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { ProductStatusBadge } from './ProductStatusBadge'
import { ProductTypeBadge } from './ProductTypeBadge'
import { StockBadge } from './StockBadge'
import { PriceDisplay } from './PriceDisplay'
import { EditProductDialog } from './EditProductDialog'
import { ProductDetailDrawer } from './ProductDetailDrawer'

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
  inventory_allocated: number
  inventory_remaining: number
  batches_linked: number
  thumbnail_url: string | null
}

interface ProductsTableProps {
  initialProducts: Product[]
}

export function ProductsTable({ initialProducts }: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)

  const filteredProducts = products.filter(product => {
    const matchesType = productTypeFilter === 'all' || product.product_type === productTypeFilter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'inactive' && !product.is_active)
    const matchesSearch = !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesType && matchesStatus && matchesSearch
  })

  const handleRefresh = async () => {
    const response = await fetch('/api/admin/products')
    const { products: updatedProducts } = await response.json()
    setProducts(updatedProducts)
  }

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product)
    setIsDetailDrawerOpen(true)
  }

  const getLowestPrice = (pricingTiers: Array<{ min_quantity: number; unit_price: number }>) => {
    if (!pricingTiers || pricingTiers.length === 0) return 0
    return Math.min(...pricingTiers.map(tier => tier.unit_price))
  }

  return (
    <Box>
      {/* Filters */}
      <Flex gap={4} p={4} borderBottomWidth="1px" borderColor="border.default" flexWrap="wrap">
        <input
          type="text"
          placeholder="Search by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={css({
            flex: 1,
            minW: '200px',
            px: 3,
            py: 2,
            fontSize: 'sm',
            bg: 'bg.muted',
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
        <select
          value={productTypeFilter}
          onChange={(e) => setProductTypeFilter(e.target.value)}
          className={css({
            px: 3,
            py: 2,
            fontSize: 'sm',
            bg: 'bg.muted',
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
          <option value="all">All Types</option>
          <option value="qr_stickers">QR Stickers</option>
          <option value="physical_product">Physical Product</option>
          <option value="digital_product">Digital Product</option>
          <option value="service">Service</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={css({
            px: 3,
            py: 2,
            fontSize: 'sm',
            bg: 'bg.muted',
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
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={handleRefresh}
          className={css({
            px: 4,
            py: 2,
            fontSize: 'sm',
            fontWeight: 'medium',
            bg: 'bg.muted',
            borderWidth: '1px',
            borderColor: 'border.default',
            rounded: 'md',
            cursor: 'pointer',
            _hover: {
              bg: 'bg.default'
            }
          })}
        >
          Refresh
        </button>
      </Flex>

      {/* Table */}
      <Box overflowX="auto">
        <table className={css({ w: 'full', fontSize: 'sm' })}>
          <thead className={css({ bg: 'bg.muted', borderBottomWidth: '1px', borderColor: 'border.default' })}>
            <tr>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Product
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Type
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Status
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Price
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Stock
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold', color: 'fg.default' })}>
                Batches
              </th>
              <th className={css({ px: 4, py: 3, textAlign: 'right', fontWeight: 'semibold', color: 'fg.default' })}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr
                key={product.id}
                className={css({
                  borderBottomWidth: '1px',
                  borderColor: 'border.default',
                  _hover: { bg: 'bg.muted' }
                })}
              >
                <td className={css({ px: 4, py: 3 })}>
                  <Flex gap={3} align="center">
                    {product.thumbnail_url ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.name}
                        className={css({ w: 10, h: 10, rounded: 'md', objectFit: 'cover' })}
                      />
                    ) : (
                      <Box
                        w={10}
                        h={10}
                        bg="gray.100"
                        rounded="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <span className={css({ fontSize: 'xs', color: 'gray.400' })}>No img</span>
                      </Box>
                    )}
                    <Box>
                      <p className={css({ fontWeight: 'medium', color: 'fg.default' })}>
                        {product.name}
                      </p>
                      {product.description && (
                        <p className={css({ fontSize: 'xs', color: 'fg.muted', lineClamp: 1 })}>
                          {product.description}
                        </p>
                      )}
                    </Box>
                  </Flex>
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <ProductTypeBadge productType={product.product_type as never} size="sm" />
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <ProductStatusBadge isActive={product.is_active} size="sm" />
                  {product.featured && (
                    <p className={css({ fontSize: 'xs', color: 'yellow.600', mt: 1 })}>⭐ Featured</p>
                  )}
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>From</p>
                  <PriceDisplay cents={getLowestPrice(product.pricing_tiers)} size="sm" />
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <StockBadge
                    current={product.current_stock}
                    lowThreshold={product.low_stock_threshold}
                    tracksInventory={product.tracks_inventory}
                    size="sm"
                  />
                  {product.tracks_inventory && (
                    <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                      Allocated: {product.inventory_allocated}
                    </p>
                  )}
                </td>
                <td className={css({ px: 4, py: 3, color: 'fg.muted' })}>
                  {product.batches_linked > 0 ? (
                    <span>{product.batches_linked} linked</span>
                  ) : (
                    <span className={css({ color: 'fg.muted' })}>None</span>
                  )}
                </td>
                <td className={css({ px: 4, py: 3 })}>
                  <Flex gap={2} justify="flex-end">
                    <button
                      onClick={() => handleViewDetails(product)}
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
                      Details
                    </button>
                    <EditProductDialog product={product} onSuccess={handleRefresh} />
                  </Flex>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <Box p={8} textAlign="center">
            <p className={css({ color: 'fg.muted' })}>No products found</p>
          </Box>
        )}
      </Box>

      {/* Detail Drawer */}
      {selectedProduct && (
        <ProductDetailDrawer
          product={selectedProduct}
          isOpen={isDetailDrawerOpen}
          onClose={() => setIsDetailDrawerOpen(false)}
          onRefresh={handleRefresh}
        />
      )}
    </Box>
  )
}
