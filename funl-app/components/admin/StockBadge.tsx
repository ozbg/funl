import { css } from '@/styled-system/css'

interface StockBadgeProps {
  current: number | null
  lowThreshold?: number | null
  tracksInventory: boolean
  size?: 'sm' | 'md'
}

export function StockBadge({ current, lowThreshold, tracksInventory, size = 'md' }: StockBadgeProps) {
  if (!tracksInventory) {
    return (
      <span
        className={css({
          fontSize: size === 'sm' ? 'xs' : 'sm',
          color: 'fg.muted'
        })}
      >
        No tracking
      </span>
    )
  }

  if (current === null) {
    return (
      <span
        className={css({
          fontSize: size === 'sm' ? 'xs' : 'sm',
          color: 'fg.muted'
        })}
      >
        No stock
      </span>
    )
  }

  const isLowStock = lowThreshold !== null && lowThreshold !== undefined && current <= lowThreshold
  const isOutOfStock = current === 0

  let color = 'green.700'
  let bg = 'green.100'
  let label = `${current} in stock`

  if (isOutOfStock) {
    color = 'red.700'
    bg = 'red.100'
    label = 'Out of stock'
  } else if (isLowStock) {
    color = 'orange.700'
    bg = 'orange.100'
    label = `${current} (Low stock)`
  }

  return (
    <span
      className={css({
        display: 'inline-flex',
        alignItems: 'center',
        px: size === 'sm' ? '2' : '2.5',
        py: size === 'sm' ? '0.5' : '1',
        fontSize: size === 'sm' ? 'xs' : 'sm',
        fontWeight: 'medium',
        rounded: 'full',
        color,
        bg
      })}
    >
      {label}
    </span>
  )
}
