'use client'

import { useEffect, useState } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'

interface HistoryEvent {
  type: 'subscription' | 'audit'
  created_at: string
  action?: string
  status?: string
  admin_email?: string
  reason?: string
  notes?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
}

interface SubscriptionHistoryPanelProps {
  businessId: string
}

export function SubscriptionHistoryPanel({ businessId }: SubscriptionHistoryPanelProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(`/api/admin/subscriptions/history/${businessId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch history')
        }
        const { events } = await response.json()
        setEvents(events)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [businessId])

  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <p className={css({ color: 'fg.muted' })}>Loading history...</p>
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={6} bg="red.50" borderWidth="1px" borderColor="red.200" rounded="md">
        <p className={css({ fontSize: 'sm', color: 'red.700' })}>{error}</p>
      </Box>
    )
  }

  if (events.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <p className={css({ color: 'fg.muted' })}>No history found</p>
      </Box>
    )
  }

  return (
    <Box>
      <div className={css({ position: 'relative', pl: 6 })}>
        {/* Timeline line */}
        <div
          className={css({
            position: 'absolute',
            left: '0.75rem',
            top: 0,
            bottom: 0,
            w: '2px',
            bg: 'border.default'
          })}
        />

        {/* Events */}
        {events.map((event, index) => (
          <Box key={index} position="relative" pb={6}>
            {/* Timeline dot */}
            <div
              className={css({
                position: 'absolute',
                left: '-1.4rem',
                top: '0.2rem',
                w: '3',
                h: '3',
                rounded: 'full',
                bg: event.type === 'audit' ? 'blue.500' : 'green.500',
                borderWidth: '2px',
                borderColor: 'bg.default'
              })}
            />

            {/* Event content */}
            <Box bg="bg.muted" rounded="md" p={4}>
              <div className={css({ mb: 2 })}>
                <span
                  className={css({
                    fontSize: 'sm',
                    fontWeight: 'semibold',
                    color: event.type === 'audit' ? 'blue.700' : 'green.700'
                  })}
                >
                  {event.action || event.status}
                </span>
                <span className={css({ ml: 2, fontSize: 'xs', color: 'fg.muted' })}>
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </div>

              {event.admin_email && (
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>
                  By: {event.admin_email}
                </p>
              )}

              {event.reason && (
                <p className={css({ fontSize: 'sm', color: 'fg.default', mb: 2 })}>
                  <strong>Reason:</strong> {event.reason}
                </p>
              )}

              {event.notes && (
                <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>
                  <strong>Notes:</strong> {event.notes}
                </p>
              )}

              {event.old_values && event.new_values && (
                <Box mt={2} p={2} bg="bg.default" rounded="sm" fontSize="xs" fontFamily="mono">
                  <p className={css({ color: 'fg.muted', mb: 1 })}>Changes:</p>
                  <pre className={css({ color: 'fg.default', whiteSpace: 'pre-wrap' })}>
                    {JSON.stringify({ old: event.old_values, new: event.new_values }, null, 2)}
                  </pre>
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </div>
    </Box>
  )
}
