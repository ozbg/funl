'use client'

import { useState, useEffect, useRef } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface Business {
  id: string
  name: string
  email: string
  type: string
  funnel_count?: number
}

interface BusinessSelectorProps {
  selectedBusiness: Business | null
  onSelect: (business: Business | null) => void
}

export function BusinessSelector({ selectedBusiness, onSelect }: BusinessSelectorProps) {
  const [query, setQuery] = useState('')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [recentBusinesses, setRecentBusinesses] = useState<Business[]>([])
  const debounceTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load recent businesses on mount
  useEffect(() => {
    loadRecentBusinesses()
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    if (query.length >= 2) {
      debounceTimeout.current = setTimeout(() => {
        searchBusinesses(query)
      }, 300)
    } else {
      setBusinesses([])
      if (query.length === 0) {
        setShowDropdown(true) // Show recent businesses when empty
      }
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [query])

  const loadRecentBusinesses = async () => {
    try {
      const response = await fetch('/api/admin/businesses/recent')
      if (response.ok) {
        const data = await response.json()
        setRecentBusinesses(data.businesses || [])
      }
    } catch (error) {
      console.error('Failed to load recent businesses:', error)
    }
  }

  const searchBusinesses = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/businesses/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setBusinesses(data.businesses || [])
        setShowDropdown(true)
      }
    } catch (error) {
      console.error('Failed to search businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (business: Business) => {
    onSelect(business)
    setQuery('')
    setShowDropdown(false)

    // Add to recent businesses (client-side for now)
    setRecentBusinesses(prev => {
      const filtered = prev.filter(b => b.id !== business.id)
      return [business, ...filtered].slice(0, 5)
    })
  }

  const displayedBusinesses = query.length >= 2 ? businesses : recentBusinesses
  const showResults = showDropdown && (displayedBusinesses.length > 0 || loading)

  return (
    <div className={css({ position: 'relative' })} ref={dropdownRef}>
      {/* Search Input */}
      <div className={css({ position: 'relative' })}>
        <input
          type="text"
          placeholder="Search businesses by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          className={css({
            w: 'full',
            px: 4,
            py: 3,
            borderWidth: '1px',
            borderColor: 'border.default',
            rounded: 'md',
            fontSize: 'sm',
            _focus: {
              outline: 'none',
              borderColor: 'accent.default',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
            }
          })}
        />
        {loading && (
          <div className={css({
            position: 'absolute',
            right: 3,
            top: '50%',
            transform: 'translateY(-50%)'
          })}>
            <div className={css({
              w: 4,
              h: 4,
              border: '2px solid',
              borderColor: 'border.default',
              borderTopColor: 'accent.default',
              rounded: 'full',
              animation: 'spin 1s linear infinite'
            })} />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showResults && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg="bg.default"
          borderWidth="1px"
          borderColor="border.default"
          rounded="md"
          boxShadow="lg"
          maxH="64"
          overflowY="auto"
          zIndex={10}
        >
          {/* Header */}
          <Box p={3} borderBottomWidth="1px" borderColor="border.default">
            <p className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.muted', textTransform: 'uppercase' })}>
              {query.length >= 2 ? 'Search Results' : 'Recent Businesses'}
            </p>
          </Box>

          {/* Loading */}
          {loading && (
            <Box p={4} textAlign="center">
              <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Searching...</p>
            </Box>
          )}

          {/* No Results */}
          {!loading && displayedBusinesses.length === 0 && query.length >= 2 && (
            <Box p={4} textAlign="center">
              <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>No businesses found</p>
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Try adjusting your search terms
              </p>
            </Box>
          )}

          {/* No Recent */}
          {!loading && displayedBusinesses.length === 0 && query.length < 2 && (
            <Box p={4} textAlign="center">
              <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>No recent businesses</p>
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Start typing to search
              </p>
            </Box>
          )}

          {/* Results */}
          {!loading && displayedBusinesses.map((business) => (
            <button
              key={business.id}
              onClick={() => handleSelect(business)}
              className={css({
                w: 'full',
                p: 3,
                textAlign: 'left',
                borderBottomWidth: '1px',
                borderColor: 'border.default',
                _hover: { bg: 'bg.subtle' },
                _last: { borderBottom: 'none' }
              })}
            >
              <Flex justify="space-between" align="start">
                <Box flex="1">
                  <p className={css({ fontWeight: 'medium', fontSize: 'sm' })}>
                    {business.name}
                  </p>
                  <p className={css({ color: 'fg.muted', fontSize: 'xs', mt: 1 })}>
                    {business.email}
                  </p>
                </Box>
                <Box textAlign="right">
                  <span className={css({
                    px: 2,
                    py: 1,
                    bg: 'bg.subtle',
                    color: 'fg.muted',
                    rounded: 'sm',
                    fontSize: 'xs'
                  })}>
                    {business.type}
                  </span>
                  {business.funnel_count !== undefined && (
                    <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                      {business.funnel_count} funnels
                    </p>
                  )}
                </Box>
              </Flex>
            </button>
          ))}
        </Box>
      )}

      {/* Selected Business Display */}
      {selectedBusiness && !showDropdown && (
        <Box mt={2} p={3} bg="accent.subtle" borderWidth="1px" borderColor="accent.default" rounded="md">
          <Flex justify="space-between" align="center">
            <Box>
              <p className={css({ fontWeight: 'medium', fontSize: 'sm', color: 'accent.text' })}>
                {selectedBusiness.name}
              </p>
              <p className={css({ fontSize: 'xs', color: 'accent.text', opacity: 0.8 })}>
                {selectedBusiness.email}
              </p>
            </Box>
            <button
              onClick={() => onSelect(null)}
              className={css({
                p: 1,
                color: 'accent.text',
                _hover: { bg: 'accent.default', color: 'white' },
                rounded: 'sm'
              })}
              title="Clear selection"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </Flex>
        </Box>
      )}
    </div>
  )
}