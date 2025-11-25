'use client'

import { css } from '@/styled-system/css'

interface Product {
  id: string
  name: string
  slug: string
}

interface EditProductDialogProps {
  product: Product
  onSuccess: () => void
}

export function EditProductDialog({ product, onSuccess: _onSuccess }: EditProductDialogProps) {
  const handleEdit = () => {
    // Navigate to product detail page (editing is inline on the Details tab)
    window.location.href = `/admin/products/${product.slug}`
  }

  return (
    <button
      onClick={handleEdit}
      className={css({
        px: 3,
        py: 1,
        fontSize: 'xs',
        fontWeight: 'medium',
        color: 'blue.600',
        cursor: 'pointer',
        _hover: { textDecoration: 'underline' }
      })}
    >
      Edit
    </button>
  )
}
