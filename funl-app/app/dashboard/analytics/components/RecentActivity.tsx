'use client'

import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface ActivityEvent {
  action: string
  timestamp: string
  funnelName: string
  deviceType?: string
}

interface RecentActivityProps {
  events: ActivityEvent[]
  loading?: boolean
}

export default function RecentActivity({ events, loading = false }: RecentActivityProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view':
        return '👁️'
      case 'vcard_download':
        return '📇'
      case 'callback_request':
        return '📞'
      case 'link_click':
        return '🔗'
      default:
        return '📊'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'view':
        return 'Viewed funnel'
      case 'vcard_download':
        return 'Downloaded vCard'
      case 'callback_request':
        return 'Requested callback'
      case 'link_click':
        return 'Clicked link'
      default:
        return action
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Box bg="bg.default" p={6} boxShadow="sm">
        <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'fg.default', mb: 4 })}>
          Recent Activity
        </h2>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Loading...</p>
      </Box>
    )
  }

  return (
    <Box bg="bg.default" p={6} boxShadow="sm">
      <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'fg.default', mb: 4 })}>
        Recent Activity
      </h2>
      
      {events.length > 0 ? (
        <div className={css({ gap: '3' })}>
          {events.map((event, index) => (
            <Flex key={index} align="center" gap={3} py={3} borderBottom={index < events.length - 1 ? '1px solid' : 'none'} borderColor="border.default">
              <span className={css({ fontSize: 'lg' })}>
                {getActionIcon(event.action)}
              </span>
              
              <Box flex="1">
                <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  {getActionLabel(event.action)}
                </p>
                <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                  {event.funnelName} {event.deviceType && `• ${event.deviceType}`}
                </p>
              </Box>
              
              <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                {formatTimestamp(event.timestamp)}
              </span>
            </Flex>
          ))}
        </div>
      ) : (
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
          No recent activity found
        </p>
      )}
    </Box>
  )
}