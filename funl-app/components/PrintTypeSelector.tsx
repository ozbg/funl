'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { createClient } from '@/lib/supabase/client'

interface PrintLayout {
  id: string
  name: string
  print_type: string
}

interface PrintTypeSelectorProps {
  funnelId: string
  initialPrintType: string
  onPrintTypeChange?: (printType: string) => void
}

export default function PrintTypeSelector({ funnelId, initialPrintType, onPrintTypeChange }: PrintTypeSelectorProps) {
  const [printType, setPrintType] = useState(initialPrintType)
  const [saving, setSaving] = useState(false)
  const [layouts, setLayouts] = useState<PrintLayout[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadLayouts() {
      try {
        const { data, error } = await supabase
          .from('print_layouts')
          .select('id, name, print_type')
          .eq('is_active', true)
          .order('name')

        if (error) {
          console.error('Failed to load print layouts:', error)
          return
        }

        setLayouts(data || [])
        
        // If no initial layout ID and we have layouts, set to first one
        if (!initialPrintType && data && data.length > 0) {
          const firstLayout = data[0]
          setPrintType(firstLayout.id)
          onPrintTypeChange?.(firstLayout.id)
          
          // Also update the funnel in database
          try {
            await supabase
              .from('funnels')
              .update({ print_layout_id: firstLayout.id })
              .eq('id', funnelId)
          } catch (updateError) {
            console.error('Failed to set default layout:', updateError)
          }
        }
      } catch (err) {
        console.error('Failed to load print layouts:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLayouts()
  }, [])

  const handlePrintTypeChange = async (layoutId: string) => {
    setPrintType(layoutId)
    setSaving(true)
    
    // Notify parent component immediately for UI updates
    onPrintTypeChange?.(layoutId)

    try {
      const { error } = await supabase
        .from('funnels')
        .update({ print_layout_id: layoutId })
        .eq('id', funnelId)

      if (error) {
        console.error('Failed to update print layout:', error)
        setPrintType(initialPrintType)
        onPrintTypeChange?.(initialPrintType) // Revert on error
      }
    } catch (err) {
      console.error('Failed to update print layout:', err)
      setPrintType(initialPrintType)
      onPrintTypeChange?.(initialPrintType) // Revert on error
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

  if (loading) {
    return (
      <Box>
        <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
          Print Layout
        </label>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Loading layouts...</p>
      </Box>
    )
  }

  return (
    <Box>
      <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
        Print Layout
      </label>
      <select
        value={printType}
        onChange={(e) => handlePrintTypeChange(e.target.value)}
        disabled={saving}
        className={inputStyles}
      >
        {layouts.map((layout) => (
          <option key={layout.id} value={layout.id}>
            {layout.name}
          </option>
        ))}
      </select>
      {saving && (
        <p className={css({ mt: 1, fontSize: 'xs', color: 'fg.muted' })}>Saving...</p>
      )}
    </Box>
  )
}