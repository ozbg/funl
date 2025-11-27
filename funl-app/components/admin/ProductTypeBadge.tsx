import { css } from '@/styled-system/css'

type ProductType = 'qr_stickers' | 'physical_product' | 'digital_product' | 'service'

interface ProductTypeBadgeProps {
  productType: ProductType
  size?: 'sm' | 'md'
}

const typeConfig: Record<ProductType, { label: string; color: string; bg: string }> = {
  qr_stickers: {
    label: 'QR Stickers',
    color: 'fg.default',
    bg: 'bg.muted'
  },
  physical_product: {
    label: 'Physical',
    color: 'fg.default',
    bg: 'bg.muted'
  },
  digital_product: {
    label: 'Digital',
    color: 'fg.default',
    bg: 'bg.muted'
  },
  service: {
    label: 'Service',
    color: 'fg.default',
    bg: 'bg.muted'
  }
}

export function ProductTypeBadge({ productType, size = 'md' }: ProductTypeBadgeProps) {
  const config = typeConfig[productType] || typeConfig.physical_product

  return (
    <span
      className={css({
        display: 'inline-flex',
        alignItems: 'center',
        px: size === 'sm' ? '2' : '2.5',
        py: size === 'sm' ? '0.5' : '1',
        fontSize: size === 'sm' ? 'xs' : 'sm',
        fontWeight: 'medium',
        rounded: 'md',
        color: config.color,
        bg: config.bg
      })}
    >
      {config.label}
    </span>
  )
}
