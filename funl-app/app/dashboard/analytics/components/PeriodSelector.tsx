'use client'

import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface PeriodSelectorProps {
  selected: '24h' | '7d' | '30d' | 'all'
  onChange: (period: '24h' | '7d' | '30d' | 'all') => void
}

export default function PeriodSelector({ selected, onChange }: PeriodSelectorProps) {
  const periods = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'all', label: 'All Time' }
  ] as const

  return (
    <Flex gap={2}>
      {periods.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={css({
            colorPalette: 'mint',
            px: 3,
            py: 2,
            fontSize: 'sm',
            fontWeight: 'medium',
            borderWidth: '1px',
            borderColor: selected === value ? 'colorPalette.default' : 'border.default',
            bg: selected === value ? 'colorPalette.subtle' : 'bg.default',
            color: selected === value ? 'colorPalette.text' : 'fg.default',
            cursor: 'pointer',
            transition: 'all 0.2s',
            _hover: {
              borderColor: 'colorPalette.default',
              bg: selected === value ? 'colorPalette.subtle' : 'colorPalette.muted'
            }
          })}
        >
          {label}
        </button>
      ))}
    </Flex>
  )
}