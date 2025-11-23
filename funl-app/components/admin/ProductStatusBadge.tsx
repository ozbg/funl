import { css } from '@/styled-system/css'

interface ProductStatusBadgeProps {
  isActive: boolean
  size?: 'sm' | 'md'
}

export function ProductStatusBadge({ isActive, size = 'md' }: ProductStatusBadgeProps) {
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
        color: isActive ? 'green.700' : 'gray.700',
        bg: isActive ? 'green.100' : 'gray.100'
      })}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}
