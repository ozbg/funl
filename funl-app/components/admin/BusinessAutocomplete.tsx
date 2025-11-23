'use client'

import { useState, useEffect, useRef } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface Business {
  id: string
  name: string
  email: string
}

interface BusinessAutocompleteProps {
  value: Business | null
  onChange: (business: Business | null) => void
  onSearch: (query: string) => Promise<Business[]>
  placeholder?: string
  disabled?: boolean
}

export function BusinessAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = 'Search businesses...',
  disabled = false
}: BusinessAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Business[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search with debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      try {
        const businesses = await onSearch(query)
        setResults(businesses)
        setIsOpen(true)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, onSearch])

  const handleSelect = (business: Business) => {
    onChange(business)
    setQuery('')
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
    setResults([])
  }

  return (
    <Box ref={wrapperRef} position="relative">
      {value ? (
        <Flex
          gap="2"
          align="center"
          justify="space-between"
          p="3"
          bg="bg.default"
          borderWidth="1px"
          borderColor="border.default"
          rounded="md"
        >
          <Box flex="1">
            <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
              {value.name}
            </p>
            <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
              {value.email}
            </p>
          </Box>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className={css({
                px: '2',
                py: '1',
                fontSize: 'xs',
                color: 'fg.muted',
                cursor: 'pointer',
                _hover: { color: 'fg.default' }
              })}
            >
              Clear
            </button>
          )}
        </Flex>
      ) : (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={css({
            w: 'full',
            px: '3',
            py: '2',
            fontSize: 'sm',
            bg: 'bg.default',
            borderWidth: '1px',
            borderColor: 'border.default',
            rounded: 'md',
            outline: 'none',
            _focus: {
              borderColor: 'accent.default',
              ring: '2px',
              ringColor: 'accent.default',
              ringOffset: "0"
            },
            _disabled: {
              opacity: 0.5,
              cursor: 'not-allowed'
            }
          })}
        />
      )}

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <Box
          position="absolute"
          top="full"
          left="0"
          right="0"
          mt="1"
          bg="bg.default"
          borderWidth="1px"
          borderColor="border.default"
          rounded="md"
          boxShadow="lg"
          maxH="60"
          overflowY="auto"
          zIndex="50"
        >
          {results.map((business) => (
            <button
              key={business.id}
              type="button"
              onClick={() => handleSelect(business)}
              className={css({
                w: 'full',
                textAlign: 'left',
                px: '3',
                py: '2',
                cursor: 'pointer',
                _hover: {
                  bg: 'bg.muted'
                }
              })}
            >
              <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                {business.name}
              </p>
              <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                {business.email}
              </p>
            </button>
          ))}
        </Box>
      )}

      {/* Loading state */}
      {isLoading && (
        <Box
          position="absolute"
          top="full"
          left="0"
          right="0"
          mt="1"
          bg="bg.default"
          borderWidth="1px"
          borderColor="border.default"
          rounded="md"
          boxShadow="lg"
          p="3"
          zIndex="50"
        >
          <p className={css({ fontSize: 'sm', color: 'fg.muted', textAlign: 'center' })}>
            Searching...
          </p>
        </Box>
      )}
    </Box>
  )
}
