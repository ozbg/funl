'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex, Container, Stack } from '@/styled-system/jsx'
import { createClient } from '@/lib/supabase/client'

interface PurchasedSticker {
  id: string
  code: string
  status: string
  purchased_at: string
  purchase_price: number | null
  base_qr_svg: string
}

type ConnectionMethod = 'list' | 'scan' | 'manual'
type VerificationStep = 'select' | 'verify' | 'complete'

export default function ConnectStickerPage() {
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>('list')
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('select')
  const [purchasedStickers, setPurchasedStickers] = useState<PurchasedSticker[]>([])
  const [selectedSticker, setSelectedSticker] = useState<PurchasedSticker | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [, setVerificationToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const funnelId = searchParams.get('funnelId')
  const supabase = createClient()

  const fetchPurchasedStickers = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: stickers, error } = await supabase
        .from('reserved_codes')
        .select('*')
        .eq('business_id', user.id)
        .eq('status', 'purchased')
        .order('purchased_at', { ascending: false })

      if (error) throw error
      setPurchasedStickers(stickers || [])
    } catch {
      setError('Failed to load your stickers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchasedStickers()
  }, [])

  const handleSelectSticker = async (sticker: PurchasedSticker) => {
    setSelectedSticker(sticker)
    setError(null)

    // For list method, directly connect without additional verification
    try {
      setProcessing(true)
      const response = await fetch('/api/stickers/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stickerId: sticker.id,
          funnelId,
          method: 'list'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to connect sticker')
      }

      setVerificationStep('complete')
      setSuccessMessage(`Sticker ${sticker.code} successfully connected to your funnel!`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleManualVerification = async () => {
    if (!manualCode) {
      setError('Please enter a sticker code')
      return
    }

    try {
      setProcessing(true)
      setError(null)

      const response = await fetch('/api/stickers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: manualCode.toUpperCase(),
          method: 'manual'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Verification failed')
      }

      const data = await response.json()

      if (data.requires_verification) {
        setVerificationToken(data.token)
        setVerificationStep('verify')
      } else if (data.stickerId) {
        // Direct verification successful
        await connectSticker(data.stickerId, null)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleVerificationCodeSubmit = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    try {
      setProcessing(true)
      setError(null)

      const response = await fetch('/api/stickers/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: manualCode.toUpperCase(),
          funnelId,
          verificationToken: verificationCode
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Connection failed')
      }

      setVerificationStep('complete')
      setSuccessMessage(`Sticker ${manualCode} successfully connected to your funnel!`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection failed')
    } finally {
      setProcessing(false)
    }
  }

  const connectSticker = async (stickerId: string, token: string | null) => {
    try {
      setProcessing(true)
      const response = await fetch('/api/stickers/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stickerId,
          funnelId,
          verificationToken: token
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Connection failed')
      }

      setVerificationStep('complete')
      setSuccessMessage('Sticker successfully connected!')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection failed')
    } finally {
      setProcessing(false)
    }
  }

  const tabStyles = (isActive: boolean) => css({
    flex: 1,
    py: 2,
    px: 4,
    borderBottomWidth: '2px',
    borderBottomColor: isActive ? 'mint.default' : 'transparent',
    color: isActive ? 'mint.default' : 'fg.muted',
    fontWeight: isActive ? 'semibold' : 'normal',
    cursor: 'pointer',
    textAlign: 'center',
    bg: 'transparent',
    _hover: {
      color: isActive ? 'mint.default' : 'fg.default'
    }
  })

  if (verificationStep === 'complete') {
    return (
      <Container maxW="2xl" mx="auto" py={16}>
        <Box textAlign="center">
          <Box fontSize="5xl" mb={4}>✅</Box>
          <h2 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 4, color: 'fg.default' })}>
            Success!
          </h2>
          <p className={css({ fontSize: 'lg', color: 'fg.muted', mb: 8 })}>
            {successMessage}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className={css({
              colorPalette: 'mint',
              px: 6,
              py: 3,
              bg: 'colorPalette.default',
              color: 'white',
              fontWeight: 'medium',
              fontSize: 'lg',
              _hover: { bg: 'colorPalette.emphasized' }
            })}
          >
            Go to Dashboard
          </button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="2xl" mx="auto" py={8}>
      <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 8, color: 'fg.default' })}>
        Connect Your Sticker
      </h1>

      {error && (
        <Box mb={4} p={4} bg="red.subtle" borderWidth="1px" borderColor="red.default">
          <p className={css({ color: 'red.text', fontSize: 'sm' })}>{error}</p>
        </Box>
      )}

      {/* Method Selector Tabs */}
      <Flex mb={8} borderBottomWidth="1px" borderColor="border.default">
        <button
          className={tabStyles(connectionMethod === 'list')}
          onClick={() => setConnectionMethod('list')}
        >
          My Stickers
        </button>
        <button
          className={tabStyles(connectionMethod === 'scan')}
          onClick={() => setConnectionMethod('scan')}
        >
          Scan QR
        </button>
        <button
          className={tabStyles(connectionMethod === 'manual')}
          onClick={() => setConnectionMethod('manual')}
        >
          Enter Code
        </button>
      </Flex>

      {/* Tab Content */}
      {connectionMethod === 'list' && (
        <Box>
          {loading ? (
            <Box textAlign="center" py={8}>
              <p className={css({ color: 'fg.muted' })}>Loading your stickers...</p>
            </Box>
          ) : purchasedStickers.length === 0 ? (
            <Box textAlign="center" py={8}>
              <p className={css({ color: 'fg.muted', mb: 4 })}>
                You don't have any purchased stickers yet.
              </p>
              <button
                onClick={() => router.push(`/dashboard/stickers/buy?funnelId=${funnelId}`)}
                className={css({
                  colorPalette: 'mint',
                  px: 4,
                  py: 2,
                  bg: 'colorPalette.default',
                  color: 'white',
                  fontWeight: 'medium',
                  _hover: { bg: 'colorPalette.emphasized' }
                })}
              >
                Buy Stickers
              </button>
            </Box>
          ) : (
            <Stack gap={4}>
              <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                Select from your purchased stickers:
              </p>
              {purchasedStickers.map((sticker) => (
                <Box
                  key={sticker.id}
                  borderWidth="1px"
                  borderColor="border.default"
                  p={4}
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{
                    borderColor: 'mint.default',
                    bg: 'bg.subtle'
                  }}
                  onClick={() => handleSelectSticker(sticker)}
                >
                  <Flex justify="space-between" align="center">
                    <Box>
                      <p className={css({ fontWeight: 'semibold', color: 'fg.default' })}>
                        Code: {sticker.code}
                      </p>
                      <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                        Purchased {new Date(sticker.purchased_at).toLocaleDateString()}
                      </p>
                    </Box>
                    <button
                      disabled={processing}
                      className={css({
                        px: 4,
                        py: 2,
                        borderWidth: '1px',
                        borderColor: 'mint.default',
                        color: 'mint.default',
                        fontSize: 'sm',
                        fontWeight: 'medium',
                        bg: 'transparent',
                        _hover: { bg: 'mint.subtle' },
                        _disabled: { opacity: 0.5, cursor: 'not-allowed' }
                      })}
                    >
                      {processing && selectedSticker?.id === sticker.id ? 'Connecting...' : 'Connect'}
                    </button>
                  </Flex>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {connectionMethod === 'scan' && (
        <Box>
          <Box
            p={12}
            borderWidth="2px"
            borderStyle="dashed"
            borderColor="border.default"
            textAlign="center"
            bg="bg.subtle"
          >
            <Box fontSize="4xl" mb={4}>📷</Box>
            <p className={css({ fontSize: 'lg', fontWeight: 'medium', mb: 2, color: 'fg.default' })}>
              QR Scanner Coming Soon
            </p>
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              This feature will allow you to scan your sticker's QR code directly
            </p>
          </Box>

          <Box mt={4} p={4} bg="blue.subtle" borderWidth="1px" borderColor="blue.default">
            <p className={css({ fontSize: 'sm', color: 'blue.text' })}>
              <strong>Security Note:</strong> When available, scanning will require email verification
              to ensure the sticker belongs to you before connecting it to your funnel.
            </p>
          </Box>
        </Box>
      )}

      {connectionMethod === 'manual' && verificationStep === 'select' && (
        <Box>
          <Stack gap={6}>
            <Box>
              <label className={css({
                display: 'block',
                fontSize: 'sm',
                fontWeight: 'medium',
                mb: 2,
                color: 'fg.default'
              })}>
                Enter Sticker Code
              </label>
              <input
                type="text"
                placeholder="e.g., ABC123XY"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  bg: 'bg.default',
                  color: 'fg.default',
                  fontSize: 'lg',
                  fontFamily: 'mono',
                  textAlign: 'center',
                  letterSpacing: 'wider',
                  _focus: {
                    outline: 'none',
                    borderColor: 'mint.default',
                    ringWidth: '2',
                    ringColor: 'mint.default'
                  }
                })}
                maxLength={8}
              />
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                The 8-character code printed below your QR code
              </p>
            </Box>

            <Box p={4} bg="amber.subtle" borderWidth="1px" borderColor="amber.default">
              <p className={css({ fontSize: 'sm', color: 'amber.text' })}>
                <strong>Security Check:</strong> For your protection, we'll send a verification
                code to your email after validating this sticker belongs to you.
              </p>
            </Box>

            <button
              onClick={handleManualVerification}
              disabled={processing || !manualCode}
              className={css({
                colorPalette: 'mint',
                w: 'full',
                py: 3,
                bg: 'colorPalette.default',
                color: 'white',
                fontWeight: 'medium',
                _hover: { bg: 'colorPalette.emphasized' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' }
              })}
            >
              {processing ? 'Verifying...' : 'Verify Ownership'}
            </button>
          </Stack>
        </Box>
      )}

      {connectionMethod === 'manual' && verificationStep === 'verify' && (
        <Box>
          <Stack gap={6}>
            <Box textAlign="center">
              <Box fontSize="3xl" mb={2}>📧</Box>
              <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 2, color: 'fg.default' })}>
                Check Your Email
              </h3>
              <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                We've sent a 6-digit verification code to your email address.
              </p>
            </Box>

            <Box>
              <label className={css({
                display: 'block',
                fontSize: 'sm',
                fontWeight: 'medium',
                mb: 2,
                color: 'fg.default'
              })}>
                Enter Verification Code
              </label>
              <input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 3,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  bg: 'bg.default',
                  color: 'fg.default',
                  fontSize: '2xl',
                  fontFamily: 'mono',
                  textAlign: 'center',
                  letterSpacing: 'widest',
                  _focus: {
                    outline: 'none',
                    borderColor: 'mint.default',
                    ringWidth: '2',
                    ringColor: 'mint.default'
                  }
                })}
                maxLength={6}
              />
            </Box>

            <button
              onClick={handleVerificationCodeSubmit}
              disabled={processing || verificationCode.length !== 6}
              className={css({
                colorPalette: 'mint',
                w: 'full',
                py: 3,
                bg: 'colorPalette.default',
                color: 'white',
                fontWeight: 'medium',
                _hover: { bg: 'colorPalette.emphasized' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' }
              })}
            >
              {processing ? 'Connecting...' : 'Connect Sticker'}
            </button>

            <button
              onClick={() => setVerificationStep('select')}
              className={css({
                fontSize: 'sm',
                color: 'fg.muted',
                textDecoration: 'underline',
                _hover: { color: 'fg.default' }
              })}
            >
              ← Back
            </button>
          </Stack>
        </Box>
      )}
    </Container>
  )
}