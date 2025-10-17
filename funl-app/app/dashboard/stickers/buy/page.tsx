'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid, Container } from '@/styled-system/jsx'
import { createClient } from '@/lib/supabase/client'

interface AvailableSticker {
  id: string
  code: string
  batch_id: string
  base_qr_svg: string
  generation_settings: Record<string, unknown>
  qr_code_batches?: {
    name: string
    size: string
    style_preset_id: string | null
  }
}

export default function BuyStickerPage() {
  const [availableStickers, setAvailableStickers] = useState<AvailableSticker[]>([])
  const [selectedSticker, setSelectedSticker] = useState<AvailableSticker | null>(null)
  const [previewSize, setPreviewSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium')
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const funnelId = searchParams.get('funnelId')

  useEffect(() => {
    fetchAvailableStickers()
  }, [])

  const fetchAvailableStickers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stickers/available')

      if (!response.ok) {
        throw new Error('Failed to fetch available stickers')
      }

      const { stickers } = await response.json()
      setAvailableStickers(stickers)

      // Auto-select first sticker if available
      if (stickers.length > 0) {
        setSelectedSticker(stickers[0])
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load stickers')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!selectedSticker || !funnelId) return

    try {
      setPurchasing(true)
      setError(null)

      const response = await fetch('/api/stickers/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stickerId: selectedSticker.id,
          funnelId,
          shippingAddress: {
            // This would be collected from the user
            line1: '123 Demo Street',
            city: 'Demo City',
            state: 'DC',
            postal_code: '12345',
            country: 'US'
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to purchase sticker')
      }

      // Success! Redirect to dashboard
      router.push('/dashboard?purchase=success')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Purchase failed')
    } finally {
      setPurchasing(false)
    }
  }

  const getSizeDisplay = (size: string) => {
    const sizes = {
      small: '25mm × 25mm',
      medium: '50mm × 50mm',
      large: '75mm × 75mm',
      xlarge: '100mm × 100mm'
    }
    return sizes[size as keyof typeof sizes] || size
  }

  const getSizeInPixels = (size: string) => {
    const pixels = {
      small: 100,
      medium: 200,
      large: 300,
      xlarge: 400
    }
    return pixels[size as keyof typeof pixels] || 200
  }

  if (loading) {
    return (
      <Container maxW="7xl" mx="auto" py={8}>
        <Box textAlign="center" py={12}>
          <p className={css({ color: 'fg.muted' })}>Loading available stickers...</p>
        </Box>
      </Container>
    )
  }

  if (availableStickers.length === 0) {
    return (
      <Container maxW="7xl" mx="auto" py={8}>
        <Box textAlign="center" py={12}>
          <Box fontSize="4xl" mb={4}>📦</Box>
          <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: 4, color: 'fg.default' })}>
            No Stickers Available
          </h2>
          <p className={css({ color: 'fg.muted', mb: 6 })}>
            Pre-printed stickers are currently out of stock. Please check back later.
          </p>
          <button
            onClick={() => router.back()}
            className={css({
              px: 6,
              py: 2,
              borderWidth: '1px',
              borderColor: 'border.default',
              color: 'fg.default',
              fontWeight: 'medium',
              bg: 'bg.default',
              _hover: { bg: 'bg.muted' }
            })}
          >
            ← Go Back
          </button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="7xl" mx="auto" py={8}>
      <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 8, color: 'fg.default' })}>
        Choose Your QR Sticker
      </h1>

      {error && (
        <Box mb={4} p={4} bg="red.subtle" borderWidth="1px" borderColor="red.default">
          <p className={css({ color: 'red.text', fontSize: 'sm' })}>{error}</p>
        </Box>
      )}

      {/* Available Stickers Grid */}
      <Box mb={8}>
        <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 4, color: 'fg.default' })}>
          Available Pre-Printed Stickers
        </h2>
        <Grid columns={{ base: 2, md: 4, lg: 6 }} gap={4}>
          {availableStickers.map((sticker) => (
            <Box
              key={sticker.id}
              borderWidth="2px"
              borderColor={selectedSticker?.id === sticker.id ? 'mint.default' : 'border.default'}
              p={4}
              cursor="pointer"
              transition="all 0.2s"
              bg={selectedSticker?.id === sticker.id ? 'mint.subtle' : 'bg.default'}
              _hover={{
                borderColor: 'mint.default',
                transform: 'scale(1.02)'
              }}
              onClick={() => setSelectedSticker(sticker)}
            >
              {/* QR Preview */}
              <Box
                mb={2}
                p={2}
                bg="white"
                borderWidth="1px"
                borderColor="border.default"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <div
                  dangerouslySetInnerHTML={{ __html: sticker.base_qr_svg }}
                  style={{ width: '80px', height: '80px' }}
                />
              </Box>

              {/* Code */}
              <p className={css({
                fontSize: 'xs',
                fontWeight: 'bold',
                textAlign: 'center',
                color: selectedSticker?.id === sticker.id ? 'mint.text' : 'fg.default'
              })}>
                {sticker.code}
              </p>

              {/* Batch Info */}
              {sticker.qr_code_batches && (
                <p className={css({ fontSize: 'xs', color: 'fg.muted', textAlign: 'center', mt: 1 })}>
                  {getSizeDisplay(sticker.qr_code_batches.size)}
                </p>
              )}
            </Box>
          ))}
        </Grid>
      </Box>

      {/* Selected Sticker Details */}
      {selectedSticker && (
        <Grid columns={{ base: 1, md: 2 }} gap={8}>
          {/* Preview Section */}
          <Box>
            <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 4, color: 'fg.default' })}>
              Preview
            </h2>

            <Box
              p={8}
              bg="white"
              borderWidth="1px"
              borderColor="border.default"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              mb={4}
            >
              {/* Actual Size Label */}
              <Box mb={4} px={3} py={1} bg="gray.100" fontSize="xs" color="gray.600">
                Actual Size: {getSizeDisplay(previewSize)}
              </Box>

              {/* QR Code */}
              <Box
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="gray.300"
                p={4}
                position="relative"
              >
                <div
                  dangerouslySetInnerHTML={{ __html: selectedSticker.base_qr_svg }}
                  style={{
                    width: `${getSizeInPixels(previewSize)}px`,
                    height: `${getSizeInPixels(previewSize)}px`
                  }}
                />

                {/* Code Label */}
                <p className={css({
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 'sm',
                  fontWeight: 'bold',
                  bg: 'white',
                  px: 2
                })}>
                  {selectedSticker.code}
                </p>
              </Box>
            </Box>

            {/* Size Selector */}
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2, color: 'fg.default' })}>
                View Size:
              </label>
              <select
                value={previewSize}
                onChange={(e) => setPreviewSize(e.target.value as 'small' | 'medium' | 'large' | 'xlarge')}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  bg: 'bg.default',
                  color: 'fg.default'
                })}
              >
                <option value="small">Small - {getSizeDisplay('small')}</option>
                <option value="medium">Medium - {getSizeDisplay('medium')}</option>
                <option value="large">Large - {getSizeDisplay('large')}</option>
                <option value="xlarge">X-Large - {getSizeDisplay('xlarge')}</option>
              </select>
            </Box>
          </Box>

          {/* Order Details */}
          <Box>
            <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 4, color: 'fg.default' })}>
              Order Details
            </h2>

            <Box bg="bg.subtle" p={6} mb={4}>
              {/* Price Breakdown */}
              <Flex justify="space-between" mb={3}>
                <span className={css({ color: 'fg.muted' })}>Sticker Price:</span>
                <span className={css({ fontWeight: 'medium', color: 'fg.default' })}>$4.99</span>
              </Flex>
              <Flex justify="space-between" mb={3}>
                <span className={css({ color: 'fg.muted' })}>Shipping:</span>
                <span className={css({ fontWeight: 'medium', color: 'fg.default' })}>FREE</span>
              </Flex>
              <Box borderTopWidth="1px" borderColor="border.default" pt={3}>
                <Flex justify="space-between">
                  <span className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'fg.default' })}>Total:</span>
                  <span className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'mint.default' })}>$4.99</span>
                </Flex>
              </Box>
            </Box>

            {/* Features */}
            <Box mb={6}>
              <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', mb: 3, color: 'fg.default' })}>
                Included Features:
              </h3>
              <ul className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                <li className={css({ mb: 2 })}>✓ Professional UV printing</li>
                <li className={css({ mb: 2 })}>✓ Weatherproof vinyl material</li>
                <li className={css({ mb: 2 })}>✓ Strong adhesive backing</li>
                <li className={css({ mb: 2 })}>✓ 2-3 business day shipping</li>
                <li className={css({ mb: 2 })}>✓ Tracking number provided</li>
              </ul>
            </Box>

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={purchasing || !funnelId}
              className={css({
                colorPalette: 'mint',
                w: 'full',
                py: 3,
                bg: 'colorPalette.default',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 'lg',
                _hover: { bg: 'colorPalette.emphasized' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' }
              })}
            >
              {purchasing ? 'Processing...' : 'Confirm Purchase - $4.99'}
            </button>

            <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 3, textAlign: 'center' })}>
              Your sticker will be shipped within 24 hours
            </p>

            {/* Back Link */}
            <Flex justify="center" mt={4}>
              <button
                onClick={() => router.back()}
                className={css({
                  fontSize: 'sm',
                  color: 'fg.muted',
                  textDecoration: 'underline',
                  _hover: { color: 'fg.default' }
                })}
              >
                ← Back to options
              </button>
            </Flex>
          </Box>
        </Grid>
      )}
    </Container>
  )
}