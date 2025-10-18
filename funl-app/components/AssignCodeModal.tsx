'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack } from '@/styled-system/jsx'
import { Badge } from '@/components/ui/badge'

interface AvailableCode {
  id: string
  code: string
  purchased_at: string
  purchase_price: number | null
}

interface AssignCodeModalProps {
  funnelId: string
  funnelName: string
  isOpen: boolean
  onClose: () => void
  stickerDownloaded?: boolean
}

export default function AssignCodeModal({
  funnelId,
  funnelName,
  isOpen,
  onClose,
  stickerDownloaded = false
}: AssignCodeModalProps) {
  const router = useRouter()
  const [availableCodes, setAvailableCodes] = useState<AvailableCode[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchAvailableCodes()
    }
  }, [isOpen])

  const fetchAvailableCodes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/my-stickers?status=owned_unassigned')
      if (!response.ok) throw new Error('Failed to fetch available codes')

      const data = await response.json()
      setAvailableCodes(data.codes || [])
    } catch (err) {
      console.error('Error fetching available codes:', err)
      setError('Failed to load available codes')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignCode = async (codeId: string) => {
    setAssigning(true)
    setError(null)

    try {
      const response = await fetch('/api/stickers/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reserved_code_id: codeId,
          funnel_id: funnelId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign code')
      }

      // Success - reload page to show updated funnel
      router.refresh()
      onClose()
    } catch (err) {
      console.error('Error assigning code:', err)
      setError(err instanceof Error ? err.message : 'Failed to assign code')
    } finally {
      setAssigning(false)
    }
  }

  if (!isOpen) return null

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.5)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={50}
      onClick={onClose}
    >
      <Box
        bg="bg.default"
        maxW="2xl"
        w="full"
        mx={4}
        maxH="90vh"
        overflow="auto"
        boxShadow="xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box p={6} borderBottomWidth="1px" borderColor="border.default">
          <Flex justify="space-between" align="start">
            <Box>
              <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'fg.default', mb: 1 })}>
                Assign QR Code
              </h2>
              <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                to {funnelName}
              </p>
            </Box>
            <button
              onClick={onClose}
              className={css({
                p: 1,
                color: 'fg.muted',
                _hover: { color: 'fg.default', bg: 'bg.muted' }
              })}
              aria-label="Close"
            >
              <svg className={css({ w: 6, h: 6 })} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Flex>
        </Box>

        {/* Content */}
        <Box p={6}>
          {/* Locked Notice */}
          {stickerDownloaded && (
            <Box
              bg="amber.50"
              borderWidth="2px"
              borderColor="amber.400"
              p={4}
              mb={6}
            >
              <Flex align="start" gap={2}>
                <Box fontSize="xl">🔒</Box>
                <Box>
                  <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'amber.900', mb: 1 })}>
                    QR Code Locked
                  </h3>
                  <p className={css({ fontSize: 'xs', color: 'amber.800' })}>
                    This funnel&apos;s sticker has been downloaded. The QR code cannot be changed.
                  </p>
                </Box>
              </Flex>
            </Box>
          )}

          {error && (
            <Box mb={4} p={4} bg="red.subtle" borderWidth="1px" borderColor="red.default">
              <p className={css({ color: 'red.text', fontSize: 'sm' })}>{error}</p>
            </Box>
          )}

          {loading ? (
            <Box textAlign="center" py={8}>
              <p className={css({ color: 'fg.muted' })}>Loading available codes...</p>
            </Box>
          ) : availableCodes.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Box fontSize="3xl" mb={3}>📦</Box>
              <p className={css({ color: 'fg.default', fontSize: 'lg', mb: 2 })}>
                No Available Codes
              </p>
              <p className={css({ color: 'fg.muted', fontSize: 'sm', mb: 4 })}>
                You don&apos;t have any unassigned QR codes.
              </p>
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
                Buy QR Stickers
              </button>
            </Box>
          ) : (
            <Stack gap={3}>
              <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>
                Select a code to assign to this funnel:
              </p>
              {availableCodes.map((code) => (
                <Box
                  key={code.id}
                  borderWidth="1px"
                  borderColor="border.default"
                  p={4}
                  transition="all 0.2s"
                  cursor={stickerDownloaded ? 'not-allowed' : 'pointer'}
                  opacity={stickerDownloaded ? 0.5 : 1}
                  _hover={stickerDownloaded ? {} : {
                    borderColor: 'mint.default',
                    bg: 'mint.subtle'
                  }}
                  onClick={stickerDownloaded ? undefined : () => handleAssignCode(code.id)}
                >
                  <Flex justify="space-between" align="center">
                    <Box>
                      <p className={css({
                        fontSize: 'xl',
                        fontWeight: 'bold',
                        fontFamily: 'mono',
                        color: 'fg.default',
                        letterSpacing: 'wider',
                        mb: 2
                      })}>
                        {code.code}
                      </p>
                      <Flex gap={3} fontSize="xs" color="fg.muted">
                        {code.purchased_at && (
                          <span>Purchased {new Date(code.purchased_at).toLocaleDateString()}</span>
                        )}
                        {code.purchase_price && (
                          <span>${code.purchase_price.toFixed(2)}</span>
                        )}
                      </Flex>
                    </Box>
                    <Badge colorPalette="blue" variant="outline" size="sm">
                      Available
                    </Badge>
                  </Flex>
                </Box>
              ))}
            </Stack>
          )}

          {/* Footer */}
          <Flex justify="end" gap={3} mt={6} pt={6} borderTopWidth="1px" borderColor="border.default">
            <button
              onClick={onClose}
              disabled={assigning}
              className={css({
                px: 4,
                py: 2,
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'fg.default',
                borderWidth: '1px',
                borderColor: 'border.default',
                _hover: { bg: 'bg.muted' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' }
              })}
            >
              Cancel
            </button>
          </Flex>
        </Box>
      </Box>
    </Box>
  )
}
