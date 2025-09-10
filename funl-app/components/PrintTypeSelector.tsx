'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { createClient } from '@/lib/supabase/client'

interface PrintTypeSelectorProps {
  funnelId: string
  initialPrintType: string
}

export default function PrintTypeSelector({ funnelId, initialPrintType }: PrintTypeSelectorProps) {
  const [printType, setPrintType] = useState(initialPrintType)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handlePrintTypeChange = async (newPrintType: string) => {
    setPrintType(newPrintType)
    setSaving(true)

    try {
      const { error } = await supabase
        .from('funnels')
        .update({ print_type: newPrintType })
        .eq('id', funnelId)

      if (error) {
        console.error('Failed to update print type:', error)
        setPrintType(initialPrintType)
      }
    } catch (err) {
      console.error('Failed to update print type:', err)
      setPrintType(initialPrintType)
    } finally {
      setSaving(false)
    }
  }

  const inputStyles = css({
    w: 'full',
    px: 3,
    py: 2,
    borderWidth: '1px',
    borderColor: 'border.default',
    boxShadow: 'sm',
    bg: 'bg.default',
    color: 'fg.default',
    _focus: {
      outline: 'none',
      ringWidth: '2',
      ringColor: 'colorPalette.default',
      borderColor: 'colorPalette.default',
    },
    _disabled: {
      opacity: 'disabled',
      cursor: 'not-allowed',
    },
  })

  return (
    <Box>
      <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
        Print Type
      </label>
      <select
        value={printType}
        onChange={(e) => handlePrintTypeChange(e.target.value)}
        disabled={saving}
        className={inputStyles}
      >
        <option value="A4_portrait">A4 Portrait</option>
        <option value="A5_portrait">A5 Portrait</option>
        <option value="A5_landscape">A5 Landscape</option>
        <option value="business_card_landscape">Business Card</option>
      </select>
      {saving && (
        <p className={css({ mt: 1, fontSize: 'xs', color: 'fg.muted' })}>Saving...</p>
      )}
    </Box>
  )
}