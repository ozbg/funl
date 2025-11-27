'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { CodeAssignmentModal } from './CodeAssignmentModal'
import { CodeDetailModal } from './CodeDetailModal'

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

interface CodeTableProps {
  codes: Code[]
  batchId: string
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  filters: {
    status: string
    search: string
  }
}

export function CodeTable({ codes, batchId, pagination, filters }: CodeTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [assignModalCode, setAssignModalCode] = useState<Code | null>(null)
  const [detailModalCode, setDetailModalCode] = useState<Code | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

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

  const getFunnelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'bg.muted', color: 'accent.default' }
      case 'draft': return { bg: 'bg.muted', color: 'fg.muted' }
      case 'paused': return { bg: 'bg.muted', color: 'fg.default' }
      case 'archived': return { bg: 'bg.muted', color: 'fg.muted' }
      default: return { bg: 'bg.muted', color: 'fg.muted' }
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateRelative = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return formatDate(dateString)
  }

  const handleStatusFilter = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newStatus === 'all') {
      params.delete('status')
    } else {
      params.set('status', newStatus)
    }
    params.delete('page') // Reset to first page
    router.push(`/admin/qr-batches/${batchId}?${params.toString()}`)
  }

  const handleSearch = (search: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    params.delete('page') // Reset to first page
    router.push(`/admin/qr-batches/${batchId}?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/admin/qr-batches/${batchId}?${params.toString()}`)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCodes(codes.map(code => code.id))
    } else {
      setSelectedCodes([])
    }
  }

  const handleSelectCode = (codeId: string, checked: boolean) => {
    if (checked) {
      setSelectedCodes(prev => [...prev, codeId])
    } else {
      setSelectedCodes(prev => prev.filter(id => id !== codeId))
    }
  }

  const handleUnassign = async (code: Code) => {
    if (!confirm(`Are you sure you want to unassign code ${code.code}? This will remove it from the funnel "${code.funnels?.name}".`)) {
      return
    }

    setLoading(code.id)

    try {
      const response = await fetch('/api/admin/qr-codes/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeId: code.id,
          reason: 'Admin unassignment'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unassign code')
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to unassign code')
    } finally {
      setLoading(null)
    }
  }

  const isAllSelected = codes.length > 0 && selectedCodes.length === codes.length
  const isPartiallySelected = selectedCodes.length > 0 && selectedCodes.length < codes.length

  return (
    <Box>
      {/* Filters and Search */}
      <Box p={4} borderBottomWidth="1px" borderColor="border.default">
        <Flex justify="space-between" align="center" mb={4}>
          <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>
            Codes ({pagination.total.toLocaleString()})
          </h2>

          <Flex gap={2}>
            {selectedCodes.length > 0 && (
              <button
                className={css({
                  px: 3,
                  py: 1,
                  bg: 'accent.default',
                  color: 'white',
                  rounded: 'md',
                  fontSize: 'sm',
                  _hover: { bg: 'accent.emphasized' }
                })}
                onClick={() => {
                  // TODO: Implement bulk operations
                  alert(`Bulk operations for ${selectedCodes.length} codes will be implemented`)
                }}
              >
                Actions ({selectedCodes.length})
              </button>
            )}

            <input
              type="text"
              placeholder="Search codes or businesses..."
              defaultValue={filters.search}
              className={css({
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm',
                w: '64'
              })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e.currentTarget.value)
                }
              }}
            />
          </Flex>
        </Flex>

        {/* Status Filter Tabs */}
        <Flex gap={1}>
          {[
            { key: 'all', label: 'All' },
            { key: 'available', label: 'Available' },
            { key: 'assigned', label: 'Assigned' },
            { key: 'reserved', label: 'Reserved' },
            { key: 'damaged', label: 'Damaged' },
            { key: 'lost', label: 'Lost' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => handleStatusFilter(tab.key)}
              className={css({
                px: 3,
                py: 1,
                fontSize: 'sm',
                rounded: 'md',
                ...(filters.status === tab.key ? {
                  bg: 'accent.default',
                  color: 'white'
                } : {
                  bg: 'transparent',
                  color: 'fg.muted',
                  _hover: { bg: 'bg.subtle' }
                })
              })}
            >
              {tab.label}
            </button>
          ))}
        </Flex>
      </Box>

      {/* Table */}
      {codes.length === 0 ? (
        <Box p={8} textAlign="center">
          <p className={css({ color: 'fg.muted', mb: 2 })}>No codes found</p>
          <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            {filters.status !== 'all' || filters.search ?
              'Try adjusting your filters' :
              'This batch has no codes yet'
            }
          </p>
        </Box>
      ) : (
        <div className={css({ overflowX: 'auto' })}>
          <table className={css({ w: 'full', borderCollapse: 'collapse' })}>
            <thead>
              <tr className={css({ borderBottom: '1px solid', borderColor: 'border.default' })}>
                <th className={css({ p: 3, textAlign: 'left', w: '12' })}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isPartiallySelected
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className={css({ cursor: 'pointer' })}
                  />
                </th>
                <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Code</th>
                <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Status</th>
                <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Business</th>
                <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Funnel</th>
                <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Funnel Status</th>
                <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Assigned</th>
                <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => {
                const statusColors = getStatusColor(code.status)
                const funnelStatusColors = code.funnels ? getFunnelStatusColor(code.funnels.status) : null

                return (
                  <tr key={code.id} className={css({ borderBottom: '1px solid', borderColor: 'border.default' })}>
                    <td className={css({ p: 3 })}>
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(code.id)}
                        onChange={(e) => handleSelectCode(code.id, e.target.checked)}
                        className={css({ cursor: 'pointer' })}
                      />
                    </td>
                    <td className={css({ p: 3 })}>
                      <span className={css({ fontFamily: 'mono', fontWeight: 'medium' })}>
                        {code.code}
                      </span>
                    </td>
                    <td className={css({ p: 3 })}>
                      <span className={css({
                        px: 2,
                        py: 1,
                        bg: statusColors.bg,
                        color: statusColors.color,
                        rounded: 'sm',
                        fontSize: 'xs',
                        fontWeight: 'medium'
                      })}>
                        {code.status}
                      </span>
                    </td>
                    <td className={css({ p: 3 })}>
                      {code.businesses ? (
                        <Box>
                          <p className={css({ fontWeight: 'medium', fontSize: 'sm' })}>
                            {code.businesses.name}
                          </p>
                          <p className={css({ color: 'fg.muted', fontSize: 'xs' })}>
                            {code.businesses.email}
                          </p>
                        </Box>
                      ) : (
                        <span className={css({ color: 'fg.muted' })}>-</span>
                      )}
                    </td>
                    <td className={css({ p: 3 })}>
                      {code.funnels ? (
                        <p className={css({ fontSize: 'sm' })}>
                          {code.funnels.name}
                        </p>
                      ) : (
                        <span className={css({ color: 'fg.muted' })}>-</span>
                      )}
                    </td>
                    <td className={css({ p: 3 })}>
                      {funnelStatusColors ? (
                        <span className={css({
                          px: 2,
                          py: 1,
                          bg: funnelStatusColors.bg,
                          color: funnelStatusColors.color,
                          rounded: 'sm',
                          fontSize: 'xs',
                          fontWeight: 'medium'
                        })}>
                          {code.funnels!.status}
                        </span>
                      ) : (
                        <span className={css({ color: 'fg.muted' })}>-</span>
                      )}
                    </td>
                    <td className={css({ p: 3 })}>
                      <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                        {formatDateRelative(code.assigned_at)}
                      </span>
                    </td>
                    <td className={css({ p: 3 })}>
                      <Flex gap={1}>
                        <button
                          onClick={() => setDetailModalCode(code)}
                          className={css({
                            px: 2,
                            py: 1,
                            border: '1px solid',
                            borderColor: 'border.default',
                            rounded: 'sm',
                            fontSize: 'xs',
                            _hover: { bg: 'bg.subtle' }
                          })}
                        >
                          View
                        </button>

                        {code.status === 'available' && (
                          <button
                            onClick={() => setAssignModalCode(code)}
                            className={css({
                              px: 2,
                              py: 1,
                              bg: 'accent.default',
                              color: 'white',
                              rounded: 'sm',
                              fontSize: 'xs',
                              _hover: { bg: 'accent.emphasized' }
                            })}
                          >
                            Assign
                          </button>
                        )}

                        {code.status === 'assigned' && (
                          <button
                            onClick={() => handleUnassign(code)}
                            disabled={loading === code.id}
                            className={css({
                              px: 2,
                              py: 1,
                              bg: 'red.600',
                              color: 'white',
                              rounded: 'sm',
                              fontSize: 'xs',
                              _hover: { bg: 'red.700' },
                              _disabled: { opacity: 0.5, cursor: 'not-allowed' }
                            })}
                          >
                            {loading === code.id ? '...' : 'Unassign'}
                          </button>
                        )}
                      </Flex>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Flex justify="between" align="center" p={4} borderTopWidth="1px" borderColor="border.default">
          <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total.toLocaleString()} codes
          </p>

          <Flex gap={1}>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={css({
                px: 3,
                py: 1,
                border: '1px solid',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm',
                _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                _hover: { bg: 'bg.subtle' }
              })}
            >
              Previous
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const pageNum = pagination.page + i - 2
              if (pageNum < 1 || pageNum > pagination.pages) return null

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={css({
                    px: 3,
                    py: 1,
                    border: '1px solid',
                    borderColor: 'border.default',
                    rounded: 'md',
                    fontSize: 'sm',
                    ...(pageNum === pagination.page ? {
                      bg: 'accent.default',
                      color: 'white'
                    } : {
                      _hover: { bg: 'bg.subtle' }
                    })
                  })}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className={css({
                px: 3,
                py: 1,
                border: '1px solid',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm',
                _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                _hover: { bg: 'bg.subtle' }
              })}
            >
              Next
            </button>
          </Flex>
        </Flex>
      )}

      {/* Modals */}
      {assignModalCode && (
        <CodeAssignmentModal
          code={assignModalCode}
          isOpen={!!assignModalCode}
          onClose={() => setAssignModalCode(null)}
          onSuccess={() => {
            setAssignModalCode(null)
            router.refresh()
          }}
        />
      )}

      {detailModalCode && (
        <CodeDetailModal
          code={detailModalCode}
          isOpen={!!detailModalCode}
          onClose={() => setDetailModalCode(null)}
        />
      )}
    </Box>
  )
}