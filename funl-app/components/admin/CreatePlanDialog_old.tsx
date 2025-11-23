'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'

export function CreatePlanDialog() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={css({
          px: 4,
          py: 2,
          bg: 'accent.default',
          color: 'white',
          fontSize: 'sm',
          fontWeight: 'medium',
          rounded: 'md',
          cursor: 'pointer',
          _hover: { bg: 'accent.emphasized' }
        })}
      >
        Create Plan
      </button>
    )
  }

  return (
    <Box>
      {/* Simplified - full implementation would include form fields */}
      <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Plan creation dialog</p>
    </Box>
  )
}
