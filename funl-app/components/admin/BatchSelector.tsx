'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'

interface Batch {
  id: string
  batch_name: string
  total_quantity: number
  used_quantity: number
}

interface BatchSelectorProps {
  value: string | null
  onChange: (batchId: string | null) => void
  disabled?: boolean
}

export function BatchSelector({ value, onChange, disabled = false }: BatchSelectorProps) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBatches() {
      try {
        const response = await fetch('/api/admin/qr-batches')
        const data = await response.json()
        setBatches(data.batches || [])
      } catch (error) {
        console.error('Error fetching batches:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBatches()
  }, [])

  if (isLoading) {
    return (
      <Box
        p={3}
        bg="bg.muted"
        borderWidth="1px"
        borderColor="border.default"
        rounded="md"
      >
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Loading batches...</p>
      </Box>
    )
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      className={css({
        w: 'full',
        px: 3,
        py: 2,
        fontSize: 'sm',
        bg: 'bg.default',
        borderWidth: '1px',
        borderColor: 'border.default',
        rounded: 'md',
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        _focus: {
          borderColor: 'accent.default',
          ring: '2px',
          ringColor: 'accent.default',
          ringOffset: "0"
        }
      })}
    >
      <option value="">Select a batch...</option>
      {batches.map((batch) => {
        const available = batch.total_quantity - batch.used_quantity
        return (
          <option key={batch.id} value={batch.id}>
            {batch.batch_name} ({available} available / {batch.total_quantity} total)
          </option>
        )
      })}
    </select>
  )
}
