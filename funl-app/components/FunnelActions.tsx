'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'

interface FunnelActionsProps {
  funnelId: string
  currentStatus: string
  publicUrl?: string
}

export default function FunnelActions({ funnelId, currentStatus, publicUrl }: FunnelActionsProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  const copyToClipboard = async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const updateFunnelStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/funnels/${funnelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setStatus(newStatus)
      } else {
        console.error('Failed to update funnel status')
      }
    } catch (error) {
      console.error('Error updating funnel status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (publicUrl) {
    // Copy URL Button (for URL section)
    return (
      <button
        onClick={copyToClipboard}
        className={css({
          colorPalette: 'mint',
          px: 2,
          py: 1,
          fontSize: 'xs',
          color: 'colorPalette.default',
          cursor: 'pointer',
          _hover: {
            color: 'colorPalette.emphasized',
          },
        })}
      >
        Copy
      </button>
    )
  }

  // Status Action Buttons (for actions section)
  return (
    <Box display="flex" gap={3}>
      {status === 'draft' && (
        <button 
          onClick={() => updateFunnelStatus('active')}
          disabled={loading}
          className={css({
            colorPalette: 'mint',
            px: 4,
            py: 2,
            fontSize: 'sm',
            fontWeight: 'medium',
            color: 'colorPalette.fg',
            bg: 'colorPalette.default',
            borderWidth: '1px',
            borderColor: 'transparent',
            cursor: 'pointer',
            _hover: {
              bg: 'colorPalette.emphasized',
            },
            _disabled: {
              opacity: 'disabled',
              cursor: 'not-allowed',
            },
          })}
        >
          {loading ? 'Activating...' : 'Activate Funnel'}
        </button>
      )}
      {status === 'active' && (
        <button 
          onClick={() => updateFunnelStatus('paused')}
          disabled={loading}
          className={css({
            px: 4,
            py: 2,
            fontSize: 'sm',
            fontWeight: 'medium',
            color: 'fg.default',
            bg: 'bg.default',
            borderWidth: '1px',
            borderColor: 'border.default',
            cursor: 'pointer',
            _hover: {
              bg: 'bg.muted',
            },
            _disabled: {
              opacity: 'disabled',
              cursor: 'not-allowed',
            },
          })}
        >
          {loading ? 'Pausing...' : 'Pause Funnel'}
        </button>
      )}
    </Box>
  )
}