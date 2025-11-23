'use client'

import { css } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'

interface BillingPeriodToggleProps {
  value: 'weekly' | 'monthly'
  onChange: (value: 'weekly' | 'monthly') => void
  disabled?: boolean
}

export function BillingPeriodToggle({ value, onChange, disabled = false }: BillingPeriodToggleProps) {
  return (
    <Flex
      gap="0"
      bg="gray.100"
      rounded="lg"
      p="1"
      display="inline-flex"
    >
      <button
        type="button"
        onClick={() => onChange('weekly')}
        disabled={disabled}
        className={css({
          px: '4',
          py: '2',
          fontSize: 'sm',
          fontWeight: 'medium',
          rounded: 'md',
          transition: 'all 0.2s',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          bg: value === 'weekly' ? 'white' : 'transparent',
          color: value === 'weekly' ? 'fg.default' : 'fg.muted',
          boxShadow: value === 'weekly' ? 'sm' : 'none',
          _hover: {
            color: disabled ? undefined : 'fg.default'
          }
        })}
      >
        Weekly
      </button>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        disabled={disabled}
        className={css({
          px: '4',
          py: '2',
          fontSize: 'sm',
          fontWeight: 'medium',
          rounded: 'md',
          transition: 'all 0.2s',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          bg: value === 'monthly' ? 'white' : 'transparent',
          color: value === 'monthly' ? 'fg.default' : 'fg.muted',
          boxShadow: value === 'monthly' ? 'sm' : 'none',
          _hover: {
            color: disabled ? undefined : 'fg.default'
          }
        })}
      >
        Monthly
      </button>
    </Flex>
  )
}
