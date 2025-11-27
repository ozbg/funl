'use client'

import { useState } from 'react'
import { Box, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { Button } from '@/components/ui/button'
import { RestoreProductDialog } from './RestoreProductDialog'

interface DeletedProduct {
  id: string
  name: string
  slug: string
  product_type: string
  is_active: boolean
  current_stock: number
  deleted_at: string
}

interface DeletedProductsTableProps {
  products: DeletedProduct[]
}

export function DeletedProductsTable({ products }: DeletedProductsTableProps) {
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<DeletedProduct | null>(null)

  const handleRestoreClick = (product: DeletedProduct) => {
    setSelectedProduct(product)
    setShowRestoreDialog(true)
  }

  const handleRestoreSuccess = () => {
    // Refresh the page to show updated list
    window.location.reload()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <Box overflowX="auto">
        <table className={css({ width: '100%', borderCollapse: 'collapse' })}>
          <thead>
            <tr className={css({ borderBottomWidth: '1px', borderColor: 'border.default' })}>
              <th className={css({ px: 6, py: 4, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>
                Product Name
              </th>
              <th className={css({ px: 6, py: 4, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>
                Type
              </th>
              <th className={css({ px: 6, py: 4, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>
                Stock
              </th>
              <th className={css({ px: 6, py: 4, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>
                Deleted At
              </th>
              <th className={css({ px: 6, py: 4, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>
                Status Before Deletion
              </th>
              <th className={css({ px: 6, py: 4, textAlign: 'right', fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className={css({
                  borderBottomWidth: '1px',
                  borderColor: 'border.default',
                  _hover: { bg: 'bg.muted' },
                })}
              >
                <td className={css({ px: 6, py: 4 })}>
                  <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                    {product.name}
                  </p>
                  <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                    {product.slug}
                  </p>
                </td>
                <td className={css({ px: 6, py: 4 })}>
                  <p className={css({ fontSize: 'sm', color: 'fg.default' })}>
                    {product.product_type}
                  </p>
                </td>
                <td className={css({ px: 6, py: 4 })}>
                  <p className={css({ fontSize: 'sm', color: 'fg.default' })}>
                    {product.current_stock || 0}
                  </p>
                </td>
                <td className={css({ px: 6, py: 4 })}>
                  <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                    {formatDate(product.deleted_at)}
                  </p>
                </td>
                <td className={css({ px: 6, py: 4 })}>
                  <span
                    className={css({
                      px: 2,
                      py: 1,
                      fontSize: 'xs',
                      fontWeight: 'medium',
                      rounded: 'md',
                      color: product.is_active ? 'accent.default' : 'fg.muted',
                      bg: 'bg.muted',
                    })}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className={css({ px: 6, py: 4, textAlign: 'right' })}>
                  <Button
                    onClick={() => handleRestoreClick(product)}
                    variant="solid"
                    size="sm"
                  >
                    Restore
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* Restore Dialog */}
      {selectedProduct && (
        <RestoreProductDialog
          isOpen={showRestoreDialog}
          onClose={() => {
            setShowRestoreDialog(false)
            setSelectedProduct(null)
          }}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          wasActive={selectedProduct.is_active}
          onSuccess={handleRestoreSuccess}
        />
      )}
    </>
  )
}
