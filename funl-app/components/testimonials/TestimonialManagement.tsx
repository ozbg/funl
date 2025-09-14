'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack, Grid } from '@/styled-system/jsx'
import {
  Star,
  Check,
  X,
  Archive,
  Trash2,
  Eye,
  Filter,
  Search,
  ChevronDown,
  Star as StarIcon,
  Calendar,
  MapPin,
  Mail,
  Phone
} from 'lucide-react'
import type { Tables, TestimonialStatus } from '@/lib/database.types'

interface TestimonialWithFunnel extends Tables<'testimonials'> {
  funnel?: {
    id: string
    name: string
    type: string
  } | null
}

interface TestimonialManagementProps {
  businessId: string
}

export default function TestimonialManagement({ businessId }: TestimonialManagementProps) {
  const [testimonials, setTestimonials] = useState<TestimonialWithFunnel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<TestimonialStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards')

  useEffect(() => {
    fetchTestimonials()
  }, [businessId, statusFilter, searchQuery])

  const fetchTestimonials = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50'
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/testimonials?${params}`)
      if (!response.ok) throw new Error('Failed to fetch testimonials')

      const result = await response.json()
      setTestimonials(result.data || [])
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      setError('Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: TestimonialStatus, rejectionReason?: string) => {
    try {
      const response = await fetch(`/api/testimonials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ...(rejectionReason && { rejection_reason: rejectionReason })
        }),
      })

      if (!response.ok) throw new Error('Failed to update testimonial')

      await fetchTestimonials()
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Error updating testimonial:', error)
      setError('Failed to update testimonial')
    }
  }

  const handleBulkAction = async (action: string, rejectionReason?: string) => {
    if (selectedIds.size === 0) return

    try {
      const response = await fetch('/api/testimonials/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testimonial_ids: Array.from(selectedIds),
          action,
          ...(rejectionReason && { rejection_reason: rejectionReason })
        }),
      })

      if (!response.ok) throw new Error(`Failed to ${action} testimonials`)

      await fetchTestimonials()
      setSelectedIds(new Set())
    } catch (error) {
      console.error(`Error ${action} testimonials:`, error)
      setError(`Failed to ${action} testimonials`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/testimonials/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete testimonial')

      await fetchTestimonials()
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      setError('Failed to delete testimonial')
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.size === testimonials.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(testimonials.map(t => t.id)))
    }
  }

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const getStatusBadge = (status: TestimonialStatus, featured: boolean) => {
    const baseStyles = {
      px: 2,
      py: 1,
      fontSize: 'xs',
      fontWeight: 'medium'
    } as const

    if (featured) {
      return (
        <span className={css({
          ...baseStyles,
          bg: 'yellow.100',
          color: 'yellow.800'
        })}>
          Featured
        </span>
      )
    }

    switch (status) {
      case 'approved':
        return <span className={css({ ...baseStyles, bg: 'green.100', color: 'green.800' })}>Approved</span>
      case 'pending':
        return <span className={css({ ...baseStyles, bg: 'yellow.100', color: 'yellow.800' })}>Pending</span>
      case 'rejected':
        return <span className={css({ ...baseStyles, bg: 'red.100', color: 'red.800' })}>Rejected</span>
      case 'archived':
        return <span className={css({ ...baseStyles, bg: 'gray.100', color: 'gray.800' })}>Archived</span>
      default:
        return <span className={css({ ...baseStyles, bg: 'gray.100', color: 'gray.800' })}>{status}</span>
    }
  }

  const StarRating = ({ rating }: { rating: number | null }) => {
    if (!rating) return <span className={css({ color: 'fg.muted', fontSize: 'sm' })}>No rating</span>

    return (
      <Flex gap={1} align="center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={css({
              color: star <= rating ? 'yellow.500' : 'gray.300',
              fill: star <= rating ? 'yellow.500' : 'transparent'
            })}
          />
        ))}
        <span className={css({ ml: 1, fontSize: 'sm', color: 'fg.muted' })}>{rating}/5</span>
      </Flex>
    )
  }

  const TestimonialCard = ({ testimonial }: { testimonial: TestimonialWithFunnel }) => (
    <Box
      className={css({
        bg: 'bg.default',
        border: '1px solid',
        borderColor: 'border.default',
        p: 4,
        shadow: 'sm',
        position: 'relative',
        transition: 'all 0.2s',
        _hover: {
          shadow: 'md',
          borderColor: 'colorPalette.default'
        }
      })}
    >
      <Stack gap={3}>
        <Flex justify="space-between" align="start">
          <Flex gap={2} align="center">
            <input
              type="checkbox"
              checked={selectedIds.has(testimonial.id)}
              onChange={() => handleSelectOne(testimonial.id)}
              className={css({ cursor: 'pointer' })}
            />
            {getStatusBadge(testimonial.status as TestimonialStatus, testimonial.featured || false)}
          </Flex>

          <Flex gap={1}>
            <button
              onClick={() => handleStatusUpdate(testimonial.id, 'approved')}
              className={css({
                p: 1,
                color: 'green.600',
                _hover: { bg: 'green.50' }
              })}
              title="Approve"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                const reason = prompt('Rejection reason (optional):')
                handleStatusUpdate(testimonial.id, 'rejected', reason || undefined)
              }}
              className={css({
                p: 1,
                color: 'red.600',
                _hover: { bg: 'red.50' }
              })}
              title="Reject"
            >
              <X size={16} />
            </button>
            <button
              onClick={() => handleStatusUpdate(testimonial.id, 'archived')}
              className={css({
                p: 1,
                color: 'gray.600',
                _hover: { bg: 'gray.50' }
              })}
              title="Archive"
            >
              <Archive size={16} />
            </button>
            <button
              onClick={() => handleDelete(testimonial.id)}
              className={css({
                p: 1,
                color: 'red.600',
                _hover: { bg: 'red.50' }
              })}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </Flex>
        </Flex>

        <Box>
          <p className={css({
            fontSize: 'sm',
            lineHeight: 'relaxed',
            color: 'fg.default',
            mb: 2
          })}>
            "{testimonial.comment}"
          </p>
          {testimonial.edited_comment && (
            <p className={css({
              fontSize: 'xs',
              color: 'fg.muted',
              fontStyle: 'italic'
            })}>
              Edited: "{testimonial.edited_comment}"
            </p>
          )}
        </Box>

        <Flex justify="space-between" align="center">
          <Box>
            <p className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default' })}>
              {testimonial.name}
            </p>
            <Flex gap={4} align="center" mt={1}>
              <Flex gap={1} align="center">
                <MapPin size={12} className={css({ color: 'fg.muted' })} />
                <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                  {testimonial.suburb}
                </span>
              </Flex>
              {testimonial.email && (
                <Flex gap={1} align="center">
                  <Mail size={12} className={css({ color: 'fg.muted' })} />
                  <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                    {testimonial.email}
                  </span>
                </Flex>
              )}
              {testimonial.phone && (
                <Flex gap={1} align="center">
                  <Phone size={12} className={css({ color: 'fg.muted' })} />
                  <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                    {testimonial.phone}
                  </span>
                </Flex>
              )}
            </Flex>
          </Box>
          <StarRating rating={testimonial.rating} />
        </Flex>

        <Flex justify="space-between" align="center" pt={2} borderTop="1px solid" borderColor="border.default">
          <Flex gap={1} align="center">
            <Calendar size={12} className={css({ color: 'fg.muted' })} />
            <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
              {new Date(testimonial.submitted_at || testimonial.created_at || '').toLocaleDateString()}
            </span>
          </Flex>
          {testimonial.funnel && (
            <span className={css({
              fontSize: 'xs',
              color: 'fg.muted',
              bg: 'bg.muted',
              px: 2,
              py: 1,
            })}>
              {testimonial.funnel.name}
            </span>
          )}
        </Flex>

        {testimonial.rejection_reason && (
          <Box bg="red.50" border="1px solid" borderColor="red.200" p={2}>
            <p className={css({ fontSize: 'xs', color: 'red.700' })}>
              Rejection reason: {testimonial.rejection_reason}
            </p>
          </Box>
        )}

        {testimonial.internal_notes && (
          <Box bg="blue.50" border="1px solid" borderColor="blue.200" p={2}>
            <p className={css({ fontSize: 'xs', color: 'blue.700' })}>
              Notes: {testimonial.internal_notes}
            </p>
          </Box>
        )}
      </Stack>
    </Box>
  )

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <div className={css({ fontSize: 'lg', color: 'fg.muted' })}>Loading testimonials...</div>
      </Box>
    )
  }

  return (
    <Box className={css({ colorPalette: 'mint' })}>
      <Stack gap={6}>

        {error && (
          <Box bg="red.50" border="1px solid" borderColor="red.200" p={4}>
            <p className={css({ fontSize: 'sm', color: 'red.700' })}>{error}</p>
          </Box>
        )}

        <Flex gap={4} align="center" wrap="wrap">
          <Box position="relative" minW="200px">
            <Search size={16} className={css({
              position: 'absolute',
              left: 3,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'fg.muted'
            })} />
            <input
              type="text"
              placeholder="Search testimonials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={css({
                w: 'full',
                pl: 10,
                pr: 4,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                fontSize: 'sm',
                _focus: {
                  outline: 'none',
                  ringWidth: '2',
                  ringColor: 'colorPalette.default',
                  borderColor: 'colorPalette.default'
                }
              })}
            />
          </Box>

          <Box position="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TestimonialStatus | 'all')}
              className={css({
                appearance: 'none',
                bg: 'bg.default',
                border: '1px solid',
                borderColor: 'border.default',
                px: 3,
                py: 2,
                pr: 8,
                fontSize: 'sm',
                cursor: 'pointer',
                _focus: {
                  outline: 'none',
                  ringWidth: '2',
                  ringColor: 'colorPalette.default',
                  borderColor: 'colorPalette.default'
                }
              })}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="featured">Featured</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown size={16} className={css({
              position: 'absolute',
              right: 2,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'fg.muted',
              pointerEvents: 'none'
            })} />
          </Box>
        </Flex>

        {selectedIds.size > 0 && (
          <Box bg="colorPalette.subtle" border="1px solid" borderColor="colorPalette.default" p={4}>
            <Flex justify="space-between" align="center">
              <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                {selectedIds.size} testimonial{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <Flex gap={2}>
                <button
                  onClick={() => handleBulkAction('approve')}
                  className={css({
                    px: 3,
                    py: 1,
                    bg: 'green.600',
                    color: 'white',
                        fontSize: 'sm',
                    _hover: { bg: 'green.700' }
                  })}
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Rejection reason (optional):')
                    handleBulkAction('reject', reason || undefined)
                  }}
                  className={css({
                    px: 3,
                    py: 1,
                    bg: 'red.600',
                    color: 'white',
                        fontSize: 'sm',
                    _hover: { bg: 'red.700' }
                  })}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleBulkAction('feature')}
                  className={css({
                    px: 3,
                    py: 1,
                    bg: 'yellow.600',
                    color: 'white',
                        fontSize: 'sm',
                    _hover: { bg: 'yellow.700' }
                  })}
                >
                  Feature
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className={css({
                    px: 3,
                    py: 1,
                    bg: 'gray.600',
                    color: 'white',
                        fontSize: 'sm',
                    _hover: { bg: 'gray.700' }
                  })}
                >
                  Delete
                </button>
              </Flex>
            </Flex>
          </Box>
        )}

        <Flex justify="space-between" align="center">
          <Flex gap={2} align="center">
            <input
              type="checkbox"
              checked={selectedIds.size === testimonials.length && testimonials.length > 0}
              onChange={handleSelectAll}
              className={css({ cursor: 'pointer' })}
            />
            <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              Select all ({testimonials.length} testimonials)
            </span>
          </Flex>
        </Flex>

        {testimonials.length === 0 ? (
          <Box textAlign="center" py={12}>
            <div className={css({ fontSize: '3xl', mb: 4 })}>💬</div>
            <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
              No Testimonials Yet
            </h3>
            <p className={css({ color: 'fg.muted' })}>
              Testimonials will appear here once customers start submitting them.
            </p>
          </Box>
        ) : (
          <Grid
            className={css({
              gridTemplateColumns: {
                base: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              },
              gap: 4
            })}
          >
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </Grid>
        )}
      </Stack>
    </Box>
  )
}