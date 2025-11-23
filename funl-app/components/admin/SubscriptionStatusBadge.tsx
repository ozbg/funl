import { css } from '@/styled-system/css'

type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due'

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<SubscriptionStatus, { label: string; color: string; bg: string }> = {
  active: {
    label: 'Active',
    color: 'green.700',
    bg: 'green.100'
  },
  trialing: {
    label: 'Trialing',
    color: 'blue.700',
    bg: 'blue.100'
  },
  canceled: {
    label: 'Canceled',
    color: 'gray.700',
    bg: 'gray.100'
  },
  past_due: {
    label: 'Past Due',
    color: 'red.700',
    bg: 'red.100'
  }
}

export function SubscriptionStatusBadge({ status, size = 'md' }: SubscriptionStatusBadgeProps) {
  const config = statusConfig[status]

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
        color: config.color,
        bg: config.bg
      })}
    >
      {config.label}
    </span>
  )
}
