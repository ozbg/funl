'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { createClient } from '@/lib/supabase/client'

interface ToggleButtonProps {
  funnelId: string
  currentStatus: string
  onStatusChange?: (newStatus: string) => void
}

export default function ToggleButton({ funnelId, currentStatus, onStatusChange }: ToggleButtonProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleToggle = async () => {
    setLoading(true)
    
    try {
      const newStatus = status === 'active' ? 'paused' : 'active'
      
      console.log('Toggling funnel status:', { funnelId, currentStatus: status, newStatus })
      
      const { error } = await supabase
        .from('funnels')
        .update({ status: newStatus })
        .eq('id', funnelId)

      if (error) {
        console.error('Error updating funnel status:', error)
        alert('Failed to update funnel status')
        return
      }

      console.log('Successfully updated funnel status to:', newStatus)
      setStatus(newStatus)
      onStatusChange?.(newStatus)
    } catch (error) {
      console.error('Error toggling funnel status:', error)
      alert('Failed to update funnel status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={css({
        colorPalette: status === 'active' ? 'red' : 'mint',
        px: 3,
        py: 1,
        fontSize: 'sm',
        fontWeight: 'medium',
        color: 'colorPalette.default',
        bg: 'transparent',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        _hover: loading ? {} : { color: 'colorPalette.emphasized' }
      })}
    >
      {loading ? '...' : (status === 'active' ? 'Pause' : 'Activate')}
    </button>
  )
}