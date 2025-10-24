'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex, Container, Stack } from '@/styled-system/jsx'
import { Badge } from '@/components/ui/badge'

interface CodeHistory {
  id: string
  action: string
  previous_status: string
  new_status: string
  reason: string
  created_at: string
  metadata?: Record<string, unknown>
}

interface QRCode {
  id: string
  code: string
  status: string
  business_id: string
  funnel_id: string | null
  assigned_at: string | null
  purchased_at: string | null
  purchase_price: number | null
  created_at: string
  updated_at: string
  funnels: {
    id: string
    name: string
    type: string
    status: string
  } | null
  history: CodeHistory[]
}

interface Stats {
  total: number
  assigned: number
  available: number
  damaged: number
  lost: number
}

type StatusFilter = 'all' | 'assigned' | 'owned_unassigned' | 'damaged' | 'lost'

export default function MyAssetsPage() {
  const [codes, setCodes] = useState<QRCode[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, assigned: 0, available: 0, damaged: 0, lost: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedCodeId, setExpandedCodeId] = useState<string | null>(null)
  const router = useRouter()

  const fetchCodes = async (filter: StatusFilter) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/my-assets?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch codes')
      }

      const data = await response.json()
      setCodes(data.codes || [])
      setStats(data.stats || { total: 0, assigned: 0, available: 0, damaged: 0, lost: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCodes(statusFilter)
  }, [statusFilter])

  const handleFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter)
    setExpandedCodeId(null)
  }

  const toggleHistory = (codeId: string) => {
    setExpandedCodeId(expandedCodeId === codeId ? null : codeId)
  }

  const tabStyles = (isActive: boolean) => css({
    flex: 1,
    py: 3,
    px: 4,
    borderBottomWidth: '2px',
    borderBottomColor: isActive ? 'mint.default' : 'transparent',
    color: isActive ? 'mint.default' : 'fg.muted',
    fontWeight: isActive ? 'semibold' : 'normal',
    cursor: 'pointer',
    textAlign: 'center',
    bg: 'transparent',
    transition: 'all 0.2s',
    _hover: {
      color: isActive ? 'mint.default' : 'fg.default',
      bg: 'bg.subtle'
    }
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { label: 'Active', color: 'green' as const, variant: 'solid' as const },
      owned_unassigned: { label: 'Available', color: 'blue' as const, variant: 'solid' as const },
      available: { label: 'Unowned', color: 'gray' as const, variant: 'subtle' as const },
      damaged: { label: 'Damaged', color: 'orange' as const, variant: 'solid' as const },
      lost: { label: 'Lost', color: 'red' as const, variant: 'solid' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: 'gray' as const,
      variant: 'subtle' as const
    }

    return (
      <Badge colorPalette={config.color} variant={config.variant} size="sm">
        {config.label}
      </Badge>
    )
  }

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      assign: '✅',
      release: '↩️',
      status_change: '🔄',
      purchase: '🛒'
    }
    return icons[action] || '•'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const hasPreviousAssignments = (code: QRCode) => {
    return code.history.some(h => h.action === 'release' && h.reason.includes('deletion'))
  }

  if (loading) {
    return (
      <Container maxW="6xl" mx="auto" py={8}>
        <Box textAlign="center" py={16}>
          <p className={css({ color: 'fg.muted', fontSize: 'lg' })}>Loading your assets...</p>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="6xl" mx="auto" py={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default', mb: 2 })}>
            My QR Assets
          </h1>
          <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            Manage your purchased QR code assets and view their assignment history
          </p>
        </Box>
        <button
          onClick={() => router.push('/dashboard/stickers/buy')}
          className={css({
            colorPalette: 'mint',
            px: 4,
            py: 2,
            bg: 'colorPalette.default',
            color: 'white',
            fontWeight: 'medium',
            fontSize: 'sm',
            borderRadius: 'sm',
            _hover: { bg: 'colorPalette.emphasized' }
          })}
        >
          Buy More Assets
        </button>
      </Flex>

      {/* Stats Summary */}
      <Flex gap={4} mb={6} flexWrap="wrap">
        <Box
          flex={1}
          minW="150px"
          p={4}
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border.default"
        >
          <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>Total Owned</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            {stats.total}
          </p>
        </Box>
        <Box
          flex={1}
          minW="150px"
          p={4}
          bg="green.subtle"
          borderWidth="1px"
          borderColor="green.default"
        >
          <p className={css({ fontSize: 'xs', color: 'green.text', mb: 1 })}>Active (Assigned)</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'green.text' })}>
            {stats.assigned}
          </p>
        </Box>
        <Box
          flex={1}
          minW="150px"
          p={4}
          bg="blue.subtle"
          borderWidth="1px"
          borderColor="blue.default"
        >
          <p className={css({ fontSize: 'xs', color: 'blue.text', mb: 1 })}>Available</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'blue.text' })}>
            {stats.available}
          </p>
        </Box>
        {(stats.damaged > 0 || stats.lost > 0) && (
          <Box
            flex={1}
            minW="150px"
            p={4}
            bg="orange.subtle"
            borderWidth="1px"
            borderColor="orange.default"
          >
            <p className={css({ fontSize: 'xs', color: 'orange.text', mb: 1 })}>Issues</p>
            <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'orange.text' })}>
              {stats.damaged + stats.lost}
            </p>
          </Box>
        )}
      </Flex>

      {error && (
        <Box mb={4} p={4} bg="red.subtle" borderWidth="1px" borderColor="red.default">
          <p className={css({ color: 'red.text', fontSize: 'sm' })}>{error}</p>
        </Box>
      )}

      {/* Filter Tabs */}
      <Flex mb={6} borderBottomWidth="1px" borderColor="border.default">
        <button
          className={tabStyles(statusFilter === 'all')}
          onClick={() => handleFilterChange('all')}
        >
          All ({stats.total})
        </button>
        <button
          className={tabStyles(statusFilter === 'assigned')}
          onClick={() => handleFilterChange('assigned')}
        >
          Active ({stats.assigned})
        </button>
        <button
          className={tabStyles(statusFilter === 'owned_unassigned')}
          onClick={() => handleFilterChange('owned_unassigned')}
        >
          Available ({stats.available})
        </button>
        {(stats.damaged > 0 || stats.lost > 0) && (
          <button
            className={tabStyles(statusFilter === 'damaged')}
            onClick={() => handleFilterChange('damaged')}
          >
            Issues ({stats.damaged + stats.lost})
          </button>
        )}
      </Flex>

      {/* Codes List */}
      {codes.length === 0 ? (
        <Box textAlign="center" py={16}>
          <Box fontSize="4xl" mb={4}>📦</Box>
          <p className={css({ color: 'fg.muted', fontSize: 'lg', mb: 4 })}>
            {statusFilter === 'all'
              ? "You don't have any QR assets yet."
              : `No ${statusFilter === 'owned_unassigned' ? 'available' : statusFilter} assets.`
            }
          </p>
          {statusFilter === 'all' && (
            <button
              onClick={() => router.push('/dashboard/stickers/buy')}
              className={css({
                colorPalette: 'mint',
                px: 6,
                py: 3,
                bg: 'colorPalette.default',
                color: 'white',
                fontWeight: 'medium',
                _hover: { bg: 'colorPalette.emphasized' }
              })}
            >
              Buy Your First Assets
            </button>
          )}
        </Box>
      ) : (
        <Stack gap={4}>
          {codes.map((code) => {
            const isExpanded = expandedCodeId === code.id
            const wasPreviouslyUsed = hasPreviousAssignments(code)

            return (
              <Box
                key={code.id}
                borderWidth="1px"
                borderColor="border.default"
                bg="bg.default"
                overflow="hidden"
                transition="all 0.2s"
                _hover={{ borderColor: 'mint.default', boxShadow: 'sm' }}
              >
                {/* Main Code Info */}
                <Box p={4}>
                  <Flex justify="space-between" align="start" mb={3}>
                    <Flex align="center" gap={3}>
                      <Box>
                        <p className={css({
                          fontSize: '2xl',
                          fontWeight: 'bold',
                          fontFamily: 'mono',
                          color: 'fg.default',
                          letterSpacing: 'wider'
                        })}>
                          {code.code}
                        </p>
                      </Box>
                      {getStatusBadge(code.status)}
                      {wasPreviouslyUsed && code.status === 'owned_unassigned' && (
                        <Badge colorPalette="amber" variant="outline" size="sm">
                          ♻️ Previously Used
                        </Badge>
                      )}
                    </Flex>
                  </Flex>

                  {/* Current Assignment or Available Status */}
                  {code.status === 'assigned' && code.funnels ? (
                    <Box mb={3}>
                      <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>
                        Currently assigned to:
                      </p>
                      <Flex align="center" gap={2}>
                        <button
                          onClick={() => router.push(`/dashboard/funnels/${code.funnel_id}`)}
                          className={css({
                            fontSize: 'sm',
                            fontWeight: 'medium',
                            color: 'mint.default',
                            textDecoration: 'underline',
                            _hover: { color: 'mint.emphasized' }
                          })}
                        >
                          {code.funnels.name}
                        </button>
                        <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                          ({code.funnels.type})
                        </span>
                      </Flex>
                      {code.assigned_at && (
                        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                          Assigned {formatDate(code.assigned_at)}
                        </p>
                      )}
                    </Box>
                  ) : code.status === 'owned_unassigned' ? (
                    <Box mb={3}>
                      <p className={css({ fontSize: 'sm', color: 'blue.text', fontWeight: 'medium' })}>
                        ✓ Available for assignment
                      </p>
                      <button
                        onClick={() => router.push('/dashboard')}
                        className={css({
                          mt: 2,
                          fontSize: 'xs',
                          color: 'mint.default',
                          textDecoration: 'underline',
                          _hover: { color: 'mint.emphasized' }
                        })}
                      >
                        Create a funnel to use this code →
                      </button>
                    </Box>
                  ) : null}

                  {/* Purchase Info */}
                  {code.purchased_at && (
                    <Flex gap={4} mb={3} fontSize="xs" color="fg.muted">
                      <span>Purchased {formatDate(code.purchased_at)}</span>
                      {code.purchase_price && (
                        <span>${code.purchase_price.toFixed(2)}</span>
                      )}
                    </Flex>
                  )}

                  {/* History Toggle */}
                  {code.history.length > 0 && (
                    <button
                      onClick={() => toggleHistory(code.id)}
                      className={css({
                        fontSize: 'xs',
                        color: 'mint.default',
                        fontWeight: 'medium',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        _hover: { color: 'mint.emphasized' }
                      })}
                    >
                      {isExpanded ? '▼' : '▶'}
                      {isExpanded ? 'Hide' : 'View'} History ({code.history.length})
                    </button>
                  )}
                </Box>

                {/* History Timeline (Expandable) */}
                {isExpanded && code.history.length > 0 && (
                  <Box
                    borderTopWidth="1px"
                    borderColor="border.default"
                    bg="bg.subtle"
                    p={4}
                  >
                    <p className={css({
                      fontSize: 'xs',
                      fontWeight: 'semibold',
                      color: 'fg.muted',
                      mb: 3,
                      textTransform: 'uppercase',
                      letterSpacing: 'wider'
                    })}>
                      Assignment History
                    </p>
                    <Stack gap={3}>
                      {code.history.map((event, index) => (
                        <Flex key={event.id} gap={3}>
                          {/* Timeline Dot */}
                          <Flex direction="column" align="center">
                            <Box
                              fontSize="lg"
                              w="24px"
                              h="24px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {getActionIcon(event.action)}
                            </Box>
                            {index < code.history.length - 1 && (
                              <Box
                                w="2px"
                                flex={1}
                                bg="border.default"
                                minH="20px"
                              />
                            )}
                          </Flex>

                          {/* Event Details */}
                          <Box flex={1} pb={index < code.history.length - 1 ? 2 : 0}>
                            <Flex justify="space-between" align="start" mb={1}>
                              <p className={css({
                                fontSize: 'sm',
                                fontWeight: 'medium',
                                color: 'fg.default',
                                textTransform: 'capitalize'
                              })}>
                                {event.action.replace('_', ' ')}
                              </p>
                              <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                                {formatDate(event.created_at)}
                              </p>
                            </Flex>
                            <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>
                              {event.reason}
                            </p>
                            <Flex gap={2} fontSize="xs">
                              {event.previous_status && (
                                <Badge colorPalette="gray" variant="subtle" size="sm">
                                  {event.previous_status}
                                </Badge>
                              )}
                              {event.new_status && (
                                <>
                                  <span className={css({ color: 'fg.muted' })}>→</span>
                                  <Badge colorPalette="blue" variant="subtle" size="sm">
                                    {event.new_status}
                                  </Badge>
                                </>
                              )}
                            </Flex>
                          </Box>
                        </Flex>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            )
          })}
        </Stack>
      )}
    </Container>
  )
}
