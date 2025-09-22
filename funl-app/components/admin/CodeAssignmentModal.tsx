'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { BusinessSelector } from './BusinessSelector'
import { FunnelSelector } from './FunnelSelector'

interface Code {
  id: string
  code: string
  status: string
}

interface Business {
  id: string
  name: string
  email: string
  type: string
  funnel_count?: number
}

interface Funnel {
  id: string
  name: string
  status: string
  type: string
  code_source?: string
  reserved_code_id?: string
  created_at: string
}

interface CodeAssignmentModalProps {
  code: Code
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CodeAssignmentModal({ code, isOpen, onClose, onSuccess }: CodeAssignmentModalProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedBusiness(null)
      setSelectedFunnel(null)
      setError(null)
    }
  }, [isOpen])

  const handleAssign = async () => {
    if (!selectedBusiness || !selectedFunnel) {
      setError('Please select both a business and a funnel')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/qr-codes/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          codeId: code.id,
          funnelId: selectedFunnel.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign code')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign code')
    } finally {
      setLoading(false)
    }
  }

  const canAssign = selectedBusiness && selectedFunnel && !loading

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
        maxW="2xl"
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
              Assign Code to Funnel
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

        {/* Content */}
        <Box p={6}>
          {error && (
            <Box mb={4} p={3} bg="red.50" borderWidth="1px" borderColor="red.200" rounded="md">
              <p className={css({ fontSize: 'sm', color: 'red.800' })}>{error}</p>
            </Box>
          )}

          <div className={css({ display: 'flex', flexDirection: 'column', gap: 6 })}>
            {/* Step 1: Select Business */}
            <Box>
              <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 3, color: 'fg.default' })}>
                1. Select Business
              </h3>
              <BusinessSelector
                selectedBusiness={selectedBusiness}
                onSelect={(business) => {
                  setSelectedBusiness(business)
                  setSelectedFunnel(null) // Reset funnel when business changes
                }}
              />
              {selectedBusiness && (
                <Box mt={2} p={3} bg="bg.subtle" rounded="md">
                  <p className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                    Selected: {selectedBusiness.name}
                  </p>
                  <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                    {selectedBusiness.email} • {selectedBusiness.funnel_count || 0} funnels
                  </p>
                </Box>
              )}
            </Box>

            {/* Step 2: Select Funnel */}
            <Box>
              <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 3, color: 'fg.default' })}>
                2. Select Funnel
              </h3>
              {!selectedBusiness ? (
                <Box p={4} bg="bg.subtle" rounded="md" textAlign="center">
                  <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                    Please select a business first
                  </p>
                </Box>
              ) : (
                <>
                  <FunnelSelector
                    businessId={selectedBusiness.id}
                    selectedFunnel={selectedFunnel}
                    onSelect={setSelectedFunnel}
                  />
                  {selectedFunnel && (
                    <Box mt={2} p={3} bg="bg.subtle" rounded="md">
                      <Flex justify="space-between" align="center">
                        <Box>
                          <p className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                            Selected: {selectedFunnel.name}
                          </p>
                          <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                            Status: {selectedFunnel.status} • Type: {selectedFunnel.type}
                          </p>
                        </Box>
                        {selectedFunnel.reserved_code_id && (
                          <Box>
                            <span className={css({
                              px: 2,
                              py: 1,
                              bg: 'orange.100',
                              color: 'orange.800',
                              rounded: 'sm',
                              fontSize: 'xs'
                            })}>
                              Has Code
                            </span>
                          </Box>
                        )}
                      </Flex>
                      {selectedFunnel.reserved_code_id && (
                        <Box mt={2} p={2} bg="orange.50" borderWidth="1px" borderColor="orange.200" rounded="sm">
                          <p className={css({ fontSize: 'xs', color: 'orange.800' })}>
                            ⚠️ This funnel already has a QR code assigned. Assigning this code will replace the existing one.
                          </p>
                        </Box>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>

            {/* Assignment Summary */}
            {selectedBusiness && selectedFunnel && (
              <Box p={4} bg="accent.subtle" borderWidth="1px" borderColor="accent.default" rounded="md">
                <h4 className={css({ fontSize: 'sm', fontWeight: 'semibold', mb: 2, color: 'accent.text' })}>
                  Assignment Summary
                </h4>
                <div className={css({ fontSize: 'sm', color: 'accent.text' })}>
                  <p>Code <strong>{code.code}</strong> will be assigned to:</p>
                  <p className={css({ mt: 1 })}>
                    <strong>{selectedFunnel.name}</strong> ({selectedBusiness.name})
                  </p>
                </div>
              </Box>
            )}
          </div>
        </Box>

        {/* Footer */}
        <Flex justify="end" gap={3} p={6} borderTopWidth="1px" borderColor="border.default">
          <button
            onClick={onClose}
            disabled={loading}
            className={css({
              px: 4,
              py: 2,
              border: '1px solid',
              borderColor: 'border.default',
              rounded: 'md',
              fontSize: 'sm',
              _hover: { bg: 'bg.subtle' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' }
            })}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!canAssign}
            className={css({
              px: 6,
              py: 2,
              bg: 'accent.default',
              color: 'white',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'medium',
              _hover: { bg: 'accent.emphasized' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' }
            })}
          >
            {loading ? 'Assigning...' : 'Assign Code'}
          </button>
        </Flex>
      </Box>
    </div>
  )
}