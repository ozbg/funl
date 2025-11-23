import { css } from '@/styled-system/css'

type ProductType = 'qr_stickers' | 'physical_product' | 'digital_product' | 'service'

interface ProductTypeBadgeProps {
  productType: ProductType
  size?: 'sm' | 'md'
}

const typeConfig: Record<ProductType, { label: string; color: string; bg: string }> = {
  qr_stickers: {
    label: 'QR Stickers',
    color: 'purple.700',
    bg: 'purple.100'
  },
  physical_product: {
    label: 'Physical',
    color: 'blue.700',
    bg: 'blue.100'
  },
  digital_product: {
    label: 'Digital',
    color: 'cyan.700',
    bg: 'cyan.100'
  },
  service: {
    label: 'Service',
    color: 'pink.700',
    bg: 'pink.100'
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
        bg: config.bg,
        borderWidth: '1px',
        borderColor: `${config.color.split('.')[0]}.200` as never
      })}
    >
      {config.label}
    </span>
  )
}
