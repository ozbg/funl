import { css } from '@/styled-system/css'

type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due'

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<SubscriptionStatus, { label: string; color: string; bg: string }> = {
  active: {
    label: 'Active',
    color: 'accent.default',
    bg: 'bg.muted'
  },
  trialing: {
    label: 'Trialing',
    color: 'fg.default',
    bg: 'bg.muted'
  },
  canceled: {
    label: 'Canceled',
    color: 'fg.muted',
    bg: 'bg.muted'
  },
  past_due: {
    label: 'Past Due',
    color: 'fg.muted',
    bg: 'bg.muted'
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
