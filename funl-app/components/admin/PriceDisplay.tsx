import { css } from '@/styled-system/css'

interface PriceDisplayProps {
  cents: number
  size?: 'sm' | 'md' | 'lg'
  showCurrency?: boolean
}

export function PriceDisplay({ cents, size = 'md', showCurrency = true }: PriceDisplayProps) {
  const dollars = cents / 100

  const fontSizeMap = {
    sm: 'sm',
    md: 'md',
    lg: 'lg'
  }

  return (
    <span
      className={css({
        fontSize: fontSizeMap[size],
        fontWeight: 'semibold',
        color: 'fg.default'
      })}
    >
      {showCurrency && '$'}
      {dollars.toFixed(2)}
    </span>
  )
}
