'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface Funnel {
  id: string
  name: string
  status: string
  type: string
  code_source?: string
  reserved_code_id?: string
  short_url?: string
  created_at: string
}

interface FunnelSelectorProps {
  businessId: string
  selectedFunnel: Funnel | null
  onSelect: (funnel: Funnel) => void
}

export function FunnelSelector({ businessId, selectedFunnel, onSelect }: FunnelSelectorProps) {
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'available' | 'active' | 'draft'>('all')

  useEffect(() => {
    if (businessId) {
      loadFunnels()
    }
  }, [businessId])

  const loadFunnels = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/funnels`)
      if (!response.ok) {
        throw new Error('Failed to load funnels')
      }

      const data = await response.json()
      setFunnels(data.funnels || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load funnels')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'green.100', color: 'green.800' }
      case 'draft': return { bg: 'gray.100', color: 'gray.800' }
      case 'paused': return { bg: 'orange.100', color: 'orange.800' }
      case 'archived': return { bg: 'red.100', color: 'red.800' }
      default: return { bg: 'gray.100', color: 'gray.800' }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const filteredFunnels = funnels.filter(funnel => {
    switch (filter) {
      case 'available':
        return !funnel.reserved_code_id
      case 'active':
        return funnel.status === 'active'
      case 'draft':
        return funnel.status === 'draft'
      default:
        return true
    }
  })

  const groupedFunnels = filteredFunnels.reduce((groups, funnel) => {
    const group = funnel.status
    if (!groups[group]) groups[group] = []
    groups[group].push(funnel)
    return groups
  }, {} as Record<string, Funnel[]>)

  if (loading) {
    return (
      <Box p={4} bg="bg.subtle" rounded="md" textAlign="center">
        <div className={css({
          w: 6,
          h: 6,
          border: '2px solid',
          borderColor: 'border.default',
          borderTopColor: 'accent.default',
          rounded: 'full',
          animation: 'spin 1s linear infinite',
          mx: 'auto',
          mb: 2
        })} />
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Loading funnels...</p>
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200" rounded="md">
        <p className={css({ fontSize: 'sm', color: 'red.800' })}>{error}</p>
        <button
          onClick={loadFunnels}
          className={css({
            mt: 2,
            px: 3,
            py: 1,
            bg: 'red.600',
            color: 'white',
            rounded: 'sm',
            fontSize: 'xs',
            _hover: { bg: 'red.700' }
          })}
        >
          Retry
        </button>
      </Box>
    )
  }

  if (funnels.length === 0) {
    return (
      <Box p={4} bg="bg.subtle" rounded="md" textAlign="center">
        <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>
          No funnels found for this business
        </p>
        <button
          className={css({
            px: 3,
            py: 2,
            bg: 'accent.default',
            color: 'white',
            rounded: 'md',
            fontSize: 'sm',
            _hover: { bg: 'accent.emphasized' }
          })}
          onClick={() => {
            // TODO: Navigate to create funnel for this business
            alert('Navigate to create funnel for this business')
          }}
        >
          Create First Funnel
        </button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Filter Tabs */}
      <Flex gap={1} mb={3}>
        {[
          { key: 'all', label: 'All', count: funnels.length },
          { key: 'available', label: 'Available', count: funnels.filter(f => !f.reserved_code_id).length },
          { key: 'active', label: 'Active', count: funnels.filter(f => f.status === 'active').length },
          { key: 'draft', label: 'Draft', count: funnels.filter(f => f.status === 'draft').length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={css({
              px: 3,
              py: 1,
              fontSize: 'xs',
              rounded: 'md',
              ...(filter === tab.key ? {
                bg: 'accent.default',
                color: 'white'
              } : {
                bg: 'transparent',
                color: 'fg.muted',
                _hover: { bg: 'bg.subtle' }
              })
            })}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </Flex>

      {/* Funnel List */}
      {filteredFunnels.length === 0 ? (
        <Box p={4} bg="bg.subtle" rounded="md" textAlign="center">
          <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            No funnels match the current filter
          </p>
        </Box>
      ) : (
        <Box
          maxH="80"
          overflowY="auto"
          borderWidth="1px"
          borderColor="border.default"
          rounded="md"
        >
          {Object.entries(groupedFunnels).map(([status, statusFunnels]) => (
            <Box key={status}>
              {/* Status Group Header */}
              <Box p={2} bg="bg.subtle" borderBottomWidth="1px" borderColor="border.default">
                <p className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.muted', textTransform: 'uppercase' })}>
                  {status} ({statusFunnels.length})
                </p>
              </Box>

              {/* Funnels in Group */}
              {statusFunnels.map((funnel) => {
                const statusColors = getStatusColor(funnel.status)
                const isSelected = selectedFunnel?.id === funnel.id

                return (
                  <button
                    key={funnel.id}
                    onClick={() => onSelect(funnel)}
                    className={css({
                      w: 'full',
                      p: 3,
                      textAlign: 'left',
                      borderBottomWidth: '1px',
                      borderColor: 'border.default',
                      ...(isSelected ? {
                        bg: 'accent.subtle',
                        borderLeftWidth: '3px',
                        borderLeftColor: 'accent.default'
                      } : {
                        _hover: { bg: 'bg.subtle' }
                      }),
                      _last: { borderBottom: 'none' }
                    })}
                  >
                    <Flex justify="space-between" align="start">
                      <Box flex="1">
                        <p className={css({ fontWeight: 'medium', fontSize: 'sm' })}>
                          {funnel.name}
                        </p>
                        <Flex align="center" gap={2} mt={1}>
                          <span className={css({
                            px: 2,
                            py: 1,
                            bg: statusColors.bg,
                            color: statusColors.color,
                            rounded: 'sm',
                            fontSize: 'xs',
                            fontWeight: 'medium'
                          })}>
                            {funnel.status}
                          </span>
                          <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                            {funnel.type}
                          </span>
                        </Flex>
                        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                          Created {formatDate(funnel.created_at)}
                        </p>
                      </Box>

                      <Box textAlign="right">
                        {funnel.reserved_code_id ? (
                          <Box>
                            <span className={css({
                              px: 2,
                              py: 1,
                              bg: 'orange.100',
                              color: 'orange.800',
                              rounded: 'sm',
                              fontSize: 'xs',
                              fontWeight: 'medium'
                            })}>
                              Has QR Code
                            </span>
                            {funnel.short_url && (
                              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1, fontFamily: 'mono' })}>
                                {funnel.short_url}
                              </p>
                            )}
                          </Box>
                        ) : (
                          <span className={css({
                            px: 2,
                            py: 1,
                            bg: 'green.100',
                            color: 'green.800',
                            rounded: 'sm',
                            fontSize: 'xs',
                            fontWeight: 'medium'
                          })}>
                            Available
                          </span>
                        )}
                      </Box>
                    </Flex>
                  </button>
                )
              })}
            </Box>
          ))}
        </Box>
      )}

      {/* Create New Funnel Option */}
      <Box mt={3} p={3} bg="bg.subtle" borderWidth="1px" borderColor="border.default" rounded="md">
        <Flex justify="between" align="center">
          <Box>
            <p className={css({ fontSize: 'sm', fontWeight: 'medium' })}>Need a new funnel?</p>
            <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>Create a new funnel for this business</p>
          </Box>
          <button
            className={css({
              px: 3,
              py: 2,
              border: '1px solid',
              borderColor: 'accent.default',
              color: 'accent.default',
              rounded: 'md',
              fontSize: 'sm',
              _hover: { bg: 'accent.subtle' }
            })}
            onClick={() => {
              // TODO: Navigate to create funnel with pre-selected business
              window.open(`/dashboard/funnels/new?businessId=${businessId}`, '_blank')
            }}
          >
            Create Funnel
          </button>
        </Flex>
      </Box>
    </Box>
  )
}