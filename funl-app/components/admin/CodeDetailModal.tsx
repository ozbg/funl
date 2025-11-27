'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface Code {
  id: string
  code: string
  status: string
  business_id?: string
  funnel_id?: string
  assigned_at?: string
  updated_at: string
  created_at: string
  businesses?: {
    id: string
    name: string
    email: string
    type?: string
  } | null
  funnels?: {
    id: string
    name: string
    status: string
    type?: string
  } | null
}

interface HistoryEntry {
  allocation_id: string
  action: string
  previous_status?: string
  new_status?: string
  business_name?: string
  business_email?: string
  funnel_name?: string
  admin_name?: string
  reason?: string
  created_at: string
  is_successful: boolean
}

interface CodeDetailModalProps {
  code: Code
  isOpen: boolean
  onClose: () => void
}

export function CodeDetailModal({ code, isOpen, onClose }: CodeDetailModalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadHistory()
    }
  }, [isOpen, activeTab, code.id])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/admin/qr-codes/${code.id}/history`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return { bg: 'bg.muted', color: 'accent.default' }
      case 'assigned': return { bg: 'bg.muted', color: 'fg.default' }
      case 'reserved': return { bg: 'bg.muted', color: 'fg.default' }
      case 'damaged': return { bg: 'bg.muted', color: 'fg.muted' }
      case 'lost': return { bg: 'bg.muted', color: 'fg.muted' }
      default: return { bg: 'bg.muted', color: 'fg.muted' }
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'assign': return { bg: 'bg.muted', color: 'fg.default' }
      case 'release': return { bg: 'bg.muted', color: 'fg.default' }
      case 'damage': return { bg: 'bg.muted', color: 'fg.muted' }
      case 'repair': return { bg: 'bg.muted', color: 'accent.default' }
      default: return { bg: 'bg.muted', color: 'fg.muted' }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateRelative = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) return `${diffMinutes} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return formatDate(dateString)
  }

  const statusColors = getStatusColor(code.status)

  if (!isOpen) return null

  return (
    <div className={css({
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bg: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)'
    })}>
      <Box
        bg="bg.default"
        boxShadow="xl"
        maxW="4xl"
        w="90%"
        rounded="lg"
        position="relative"
        maxH="90vh"
        overflowY="auto"
      >
        {/* Header */}
        <Flex justify="space-between" align="center" p={6} borderBottomWidth="1px" borderColor="border.default">
          <Box>
            <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'fg.default' })}>
              QR Code Details
            </h2>
            <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
              Code: <span className={css({ fontFamily: 'mono', fontWeight: 'medium' })}>{code.code}</span>
            </p>
          </Box>
          <button
            onClick={onClose}
            className={css({
              p: 2,
              color: 'fg.muted',
              _hover: { color: 'fg.default' },
              rounded: 'md'
            })}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </Flex>

        {/* Tabs */}
        <Flex borderBottomWidth="1px" borderColor="border.default">
          <button
            onClick={() => setActiveTab('details')}
            className={css({
              px: 6,
              py: 3,
              fontSize: 'sm',
              fontWeight: 'medium',
              borderBottomWidth: '2px',
              ...(activeTab === 'details' ? {
                color: 'accent.default',
                borderColor: 'accent.default'
              } : {
                color: 'fg.muted',
                borderColor: 'transparent',
                _hover: { color: 'fg.default' }
              })
            })}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={css({
              px: 6,
              py: 3,
              fontSize: 'sm',
              fontWeight: 'medium',
              borderBottomWidth: '2px',
              ...(activeTab === 'history' ? {
                color: 'accent.default',
                borderColor: 'accent.default'
              } : {
                color: 'fg.muted',
                borderColor: 'transparent',
                _hover: { color: 'fg.default' }
              })
            })}
          >
            History
          </button>
        </Flex>

        {/* Content */}
        <Box p={6}>
          {activeTab === 'details' && (
            <div className={css({ display: 'flex', flexDirection: 'column', gap: 6 })}>
              {/* Basic Information */}
              <Box>
                <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 3, color: 'fg.default' })}>
                  Basic Information
                </h3>
                <div className={css({ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 })}>
                  <Box>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Code</p>
                    <p className={css({ fontFamily: 'mono', fontWeight: 'medium' })}>{code.code}</p>
                  </Box>
                  <Box>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Status</p>
                    <span className={css({
                      px: 2,
                      py: 1,
                      bg: statusColors.bg,
                      color: statusColors.color,
                      rounded: 'sm',
                      fontSize: 'sm',
                      fontWeight: 'medium'
                    })}>
                      {code.status}
                    </span>
                  </Box>
                  <Box>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Created</p>
                    <p className={css({ fontSize: 'sm' })}>{formatDate(code.created_at)}</p>
                  </Box>
                  <Box>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Last Updated</p>
                    <p className={css({ fontSize: 'sm' })}>{formatDateRelative(code.updated_at)}</p>
                  </Box>
                </div>
              </Box>

              {/* Current Assignment */}
              <Box>
                <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 3, color: 'fg.default' })}>
                  Current Assignment
                </h3>
                {code.status === 'assigned' && code.businesses && code.funnels ? (
                  <Box p={4} bg="bg.subtle" rounded="lg" borderWidth="1px" borderColor="border.default">
                    <div className={css({ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 })}>
                      <Box>
                        <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Business</p>
                        <p className={css({ fontWeight: 'medium' })}>{code.businesses.name}</p>
                        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>{code.businesses.email}</p>
                      </Box>
                      <Box>
                        <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Funnel</p>
                        <p className={css({ fontWeight: 'medium' })}>{code.funnels.name}</p>
                        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                          {code.funnels.status} • {code.funnels.type}
                        </p>
                      </Box>
                      <Box>
                        <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Assigned</p>
                        <p className={css({ fontSize: 'sm' })}>{formatDateRelative(code.assigned_at!)}</p>
                      </Box>
                    </div>
                  </Box>
                ) : (
                  <Box p={4} bg="bg.subtle" rounded="lg" textAlign="center">
                    <p className={css({ color: 'fg.muted' })}>
                      {code.status === 'available' ? 'Code is available for assignment' : 'No current assignment'}
                    </p>
                  </Box>
                )}
              </Box>

              {/* QR Code Preview */}
              <Box>
                <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 3, color: 'fg.default' })}>
                  QR Code Preview
                </h3>
                <Box p={6} bg="white" rounded="lg" borderWidth="1px" borderColor="border.default" textAlign="center">
                  <Box display="inline-block" p={4} bg="white" borderWidth="2px" borderStyle="dashed" borderColor="gray.300">
                    {/* TODO: Generate actual QR code SVG */}
                    <div className={css({
                      w: '32',
                      h: '32',
                      bg: 'gray.100',
                      rounded: 'md',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'xs',
                      color: 'fg.muted'
                    })}>
                      QR Code
                    </div>
                  </Box>
                  <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 2 })}>
                    URL: funl.app/f/{code.code}
                  </p>
                </Box>
              </Box>
            </div>
          )}

          {activeTab === 'history' && (
            <Box>
              <Flex justify="space-between" align="center" mb={4}>
                <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
                  Assignment History
                </h3>
                <button
                  onClick={loadHistory}
                  disabled={loadingHistory}
                  className={css({
                    px: 3,
                    py: 1,
                    border: '1px solid',
                    borderColor: 'border.default',
                    rounded: 'md',
                    fontSize: 'sm',
                    _hover: { bg: 'bg.subtle' },
                    _disabled: { opacity: 0.5, cursor: 'not-allowed' }
                  })}
                >
                  {loadingHistory ? 'Loading...' : 'Refresh'}
                </button>
              </Flex>

              {loadingHistory ? (
                <Box p={8} textAlign="center">
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
                  <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Loading history...</p>
                </Box>
              ) : history.length === 0 ? (
                <Box p={8} textAlign="center">
                  <p className={css({ color: 'fg.muted', mb: 2 })}>No history available</p>
                  <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                    Actions performed on this code will appear here
                  </p>
                </Box>
              ) : (
                <div className={css({ display: 'flex', flexDirection: 'column', gap: 3 })}>
                  {history.map((entry, index) => {
                    const actionColors = getActionColor(entry.action)
                    const isFirst = index === 0
                    const isLast = index === history.length - 1

                    return (
                      <Box
                        key={entry.allocation_id}
                        position="relative"
                        pl={8}
                        pb={isLast ? 0 : 4}
                      >
                        {/* Timeline line */}
                        {!isLast && (
                          <Box
                            position="absolute"
                            left="3"
                            top="6"
                            bottom="0"
                            w="px"
                            bg="border.default"
                          />
                        )}

                        {/* Timeline dot */}
                        <Box
                          position="absolute"
                          left="0"
                          top="1"
                          w="6"
                          h="6"
                          bg={entry.is_successful ? actionColors.bg : 'bg.muted'}
                          borderWidth="2px"
                          borderColor={entry.is_successful ? actionColors.color : 'fg.muted'}
                          rounded="full"
                        />

                        {/* Content */}
                        <Box p={3} bg="bg.subtle" rounded="lg" borderWidth="1px" borderColor="border.default">
                          <Flex justify="space-between" align="start" mb={2}>
                            <Box>
                              <Flex align="center" gap={2} mb={1}>
                                <span className={css({
                                  px: 2,
                                  py: 1,
                                  bg: actionColors.bg,
                                  color: actionColors.color,
                                  rounded: 'sm',
                                  fontSize: 'xs',
                                  fontWeight: 'medium'
                                })}>
                                  {entry.action}
                                </span>
                                {entry.previous_status && entry.new_status && (
                                  <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                                    {entry.previous_status} → {entry.new_status}
                                  </span>
                                )}
                                {!entry.is_successful && (
                                  <span className={css({
                                    px: 2,
                                    py: 1,
                                    bg: 'bg.muted',
                                    color: 'fg.muted',
                                    rounded: 'sm',
                                    fontSize: 'xs'
                                  })}>
                                    Failed
                                  </span>
                                )}
                              </Flex>

                              {(entry.business_name || entry.funnel_name) && (
                                <p className={css({ fontSize: 'sm', mb: 1 })}>
                                  {entry.funnel_name && (
                                    <span>Funnel: <strong>{entry.funnel_name}</strong></span>
                                  )}
                                  {entry.business_name && (
                                    <span className={css({ color: 'fg.muted', ml: 2 })}>
                                      ({entry.business_name})
                                    </span>
                                  )}
                                </p>
                              )}

                              {entry.reason && (
                                <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                                  Reason: {entry.reason}
                                </p>
                              )}
                            </Box>

                            <Box textAlign="right">
                              <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                                {formatDateRelative(entry.created_at)}
                              </p>
                              {entry.admin_name && (
                                <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                                  by {entry.admin_name}
                                </p>
                              )}
                            </Box>
                          </Flex>
                        </Box>
                      </Box>
                    )
                  })}
                </div>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </div>
  )
}