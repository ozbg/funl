import { css } from '@/styled-system/css'

interface PlanBadgeProps {
  planName: string
  billingPeriod: 'weekly' | 'monthly'
  size?: 'sm' | 'md'
}

export function PlanBadge({ planName, billingPeriod, size = 'md' }: PlanBadgeProps) {
  return (
    <div className={css({ display: 'inline-flex', alignItems: 'center', gap: 2 })}>
      <span
        className={css({
          display: 'inline-flex',
          alignItems: 'center',
          px: size === 'sm' ? '2' : '2.5',
          py: size === 'sm' ? '0.5' : '1',
          fontSize: size === 'sm' ? 'xs' : 'sm',
          fontWeight: 'semibold',
          rounded: 'md',
          color: 'purple.700',
          bg: 'purple.100',
          borderWidth: '1px',
          borderColor: 'purple.200'
        })}
      >
        {planName}
      </span>
      <span
        className={css({
          fontSize: size === 'sm' ? 'xs' : 'sm',
          color: 'fg.muted'
        })}
      >
        {billingPeriod === 'weekly' ? '/ week' : '/ month'}
      </span>
    </div>
  )
}
