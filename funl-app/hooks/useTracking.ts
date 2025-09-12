'use client'

import { useCallback, useEffect, useState } from 'react'
import { nanoid } from 'nanoid'

export function useTracking(funnelId: string) {
  const [sessionId, setSessionId] = useState<string>('')
  
  useEffect(() => {
    // Generate or get existing session ID from localStorage
    let id = localStorage.getItem('funl_session_id')
    if (!id) {
      id = nanoid(12)
      localStorage.setItem('funl_session_id', id)
    }
    setSessionId(id)
  }, [])

  const track = useCallback(async (action: string, metadata?: Record<string, unknown>) => {
    if (!sessionId) return
    
    try {
      await fetch('/api/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          funnel_id: funnelId,
          action,
          session_id: sessionId,
          metadata,
        }),
      })
    } catch (error) {
      console.error('Tracking failed:', error)
    }
  }, [funnelId, sessionId])

  return { track, sessionId }
}