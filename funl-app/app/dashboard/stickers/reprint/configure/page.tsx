'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { StickerPreview } from '@/components/stickers/StickerPreview'
import Link from 'next/link'

interface Style {
  id: string
  name: string
  template: string
  preview_url?: string
}

export default function ConfigureReprintPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeId = searchParams.get('code_id')

  const [code, setCode] = useState<any>(null)
  const [styles, setStyles] = useState<Style[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null)
  const [quantity, setQuantity] = useState(1)

  const sampleQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://funl.au'

  // Pricing (same as purchase)
  const getPriceForQuantity = (qty: number) => {
    if (qty >= 100) return 3.50
    if (qty >= 50) return 4.00
    if (qty >= 10) return 4.50
    return 5.00
  }

  useEffect(() => {
    if (!codeId) {
      router.push('/dashboard/stickers/reprint')
      return
    }
    fetchCodeAndStyles()
  }, [codeId])

  const fetchCodeAndStyles = async () => {
    try {
      setLoading(true)

      // Fetch code details
      const codeRes = await fetch(`/api/stickers/code/${codeId}`)
      if (!codeRes.ok) throw new Error('Failed to fetch code')
      const codeData = await codeRes.json()
      setCode(codeData)

      // Fetch available styles
      const stylesRes = await fetch('/api/stickers/styles')
      if (!stylesRes.ok) throw new Error('Failed to fetch styles')
      const stylesData = await stylesRes.json()
      setStyles(stylesData.styles || [])

      if (stylesData.styles?.length > 0) {
        setSelectedStyle(stylesData.styles[0])
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderReprint = async () => {
    if (!code || !selectedStyle) return

    try {
      setProcessing(true)
      setError(null)

      const unitPrice = getPriceForQuantity(quantity)
      const subtotal = quantity * unitPrice
      const tax = subtotal * 0.1
      const shipping = 5 + (quantity * 0.5)
      const total = subtotal + tax + shipping

      const response = await fetch('/api/stickers/reprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code_id: code.id,
          size: selectedSize,
          style: selectedStyle,
          quantity,
          unit_price: unitPrice,
          subtotal,
          tax,
          shipping,
          total
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to order reprint')
      }

      const { order_id } = await response.json()
      router.push(`/dashboard/stickers/orders/${order_id}?confirmed=true`)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reprint order failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Box textAlign="center" py={12}>
        <p className={css({ color: 'fg.muted' })}>Loading...</p>
      </Box>
    )
  }

  if (!code) {
    return (
      <Box textAlign="center" py={12}>
        <p className={css({ color: 'fg.muted' })}>Code not found</p>
      </Box>
    )
  }

  const unitPrice = getPriceForQuantity(quantity)
  const subtotal = quantity * unitPrice
  const tax = subtotal * 0.1
  const shipping = 5 + (quantity * 0.5)
  const total = subtotal + tax + shipping

  return (
    <Box>
      {/* Header */}
      <Box mb={8}>
        <Link
          href="/dashboard/stickers/reprint"
          className={css({
            fontSize: 'sm',
            color: 'fg.muted',
            mb: 2,
            display: 'inline-block',
            _hover: { color: 'fg.default' }
          })}
        >
          ← Back to Reprint Selection
        </Link>
        <h1 className={css({ fontSize: '3xl', fontWeight: 'bold' })}>
          Configure Reprint
        </h1>
        <p className={css({ color: 'fg.muted', mt: 2 })}>
          Code: <span className={css({ fontFamily: 'monospace', fontWeight: 'medium' })}>{code.code}</span>
        </p>
      </Box>

      {error && (
        <Box mb={6} p={4} bg="red.subtle" borderWidth="1px" borderColor="red.default" rounded="md">
          <p className={css({ color: 'red.text', fontSize: 'sm' })}>{error}</p>
        </Box>
      )}

      <Grid gridTemplateColumns={{ base: '1', lg: '2fr 1fr' }} gap={8}>
        {/* Left Column - Configuration */}
        <Box>
          {/* Size Selection */}
          <Box mb={8}>
            <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 4 })}>
              Select Size
            </h2>
            <Grid gridTemplateColumns="3" gap={4}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={css({
                    p: 4,
                    borderWidth: '2px',
                    borderColor: selectedSize === size ? 'accent.default' : 'border.default',
                    bg: selectedSize === size ? 'accent.subtle' : 'bg.default',
                    rounded: 'lg',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    _hover: { borderColor: 'accent.default' }
                  })}
                >
                  <p className={css({ fontSize: 'md', fontWeight: 'semibold', mb: 1 })}>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </p>
                  <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                    {size === 'small' && '50mm'}
                    {size === 'medium' && '75mm'}
                    {size === 'large' && '100mm'}
                  </p>
                </button>
              ))}
            </Grid>
          </Box>

          {/* Style Selection */}
          <Box mb={8}>
            <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 4 })}>
              Select Style
            </h2>
            <Grid gridTemplateColumns={{ base: '2', md: '3' }} gap={4}>
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={css({
                    p: 4,
                    borderWidth: '2px',
                    borderColor: selectedStyle?.id === style.id ? 'accent.default' : 'border.default',
                    bg: selectedStyle?.id === style.id ? 'accent.subtle' : 'bg.default',
                    rounded: 'lg',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    _hover: { borderColor: 'accent.default' }
                  })}
                >
                  <p className={css({ fontSize: 'sm', fontWeight: 'semibold' })}>
                    {style.name}
                  </p>
                </button>
              ))}
            </Grid>
          </Box>

          {/* Quantity Selection */}
          <Box mb={8}>
            <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 4 })}>
              Quantity
            </h2>
            <Flex gap={2} align="center">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className={css({
                  w: 10,
                  h: 10,
                  bg: 'bg.subtle',
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  fontSize: 'lg',
                  fontWeight: 'semibold',
                  cursor: 'pointer',
                  _hover: { bg: 'bg.muted' },
                  _disabled: { opacity: 0.5, cursor: 'not-allowed' }
                })}
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1
                  setQuantity(Math.max(1, val))
                }}
                className={css({
                  w: 24,
                  h: 10,
                  textAlign: 'center',
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  fontSize: 'md',
                  fontWeight: 'medium'
                })}
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className={css({
                  w: 10,
                  h: 10,
                  bg: 'bg.subtle',
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  fontSize: 'lg',
                  fontWeight: 'semibold',
                  cursor: 'pointer',
                  _hover: { bg: 'bg.muted' }
                })}
              >
                +
              </button>
            </Flex>
            <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 2 })}>
              ${unitPrice.toFixed(2)} each at this quantity
            </p>
          </Box>

          {/* Preview */}
          {selectedStyle && (
            <Box>
              <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 4 })}>
                Preview
              </h2>
              <Flex justify="center" p={8} bg="bg.subtle" rounded="lg">
                <StickerPreview
                  qrCodeUrl={sampleQrUrl}
                  style={selectedStyle}
                  size={selectedSize}
                />
              </Flex>
            </Box>
          )}
        </Box>

        {/* Right Column - Order Summary */}
        <Box>
          <Box
            position="sticky"
            top={4}
            p={6}
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border.default"
            rounded="lg"
          >
            <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 6 })}>
              Reprint Summary
            </h2>

            <Box mb={6}>
              <Box mb={4} pb={4} borderBottomWidth="1px" borderColor="border.default">
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>
                  QR Code:
                </p>
                <p className={css({ fontSize: 'sm', fontFamily: 'monospace', fontWeight: 'medium' })}>
                  {code.code}
                </p>
              </Box>

              <Box mb={4} pb={4} borderBottomWidth="1px" borderColor="border.default">
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>
                  Configuration:
                </p>
                <p className={css({ fontSize: 'sm' })}>
                  {selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)} - {selectedStyle?.name}
                </p>
                <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                  Quantity: {quantity}
                </p>
              </Box>

              <Flex justify="space-between" mb={2}>
                <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Subtotal:</span>
                <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                  ${subtotal.toFixed(2)}
                </span>
              </Flex>
              <Flex justify="space-between" mb={2}>
                <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Tax (GST):</span>
                <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                  ${tax.toFixed(2)}
                </span>
              </Flex>
              <Flex justify="space-between" mb={4} pb={4} borderBottomWidth="1px" borderColor="border.default">
                <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Shipping:</span>
                <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                  ${shipping.toFixed(2)}
                </span>
              </Flex>
              <Flex justify="space-between" mb={6}>
                <span className={css({ fontSize: 'lg', fontWeight: 'bold' })}>Total:</span>
                <span className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'accent.default' })}>
                  ${total.toFixed(2)}
                </span>
              </Flex>
            </Box>

            <button
              onClick={handleOrderReprint}
              disabled={processing || !selectedStyle}
              className={css({
                w: 'full',
                px: 6,
                py: 3,
                bg: 'accent.default',
                color: 'white',
                rounded: 'md',
                fontSize: 'md',
                fontWeight: 'semibold',
                cursor: 'pointer',
                mb: 3,
                _hover: { bg: 'accent.emphasized' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' }
              })}
            >
              {processing ? 'Processing...' : 'Order Reprint'}
            </button>

            <p className={css({ fontSize: 'xs', color: 'fg.muted', textAlign: 'center' })}>
              Your existing sticker will remain active
            </p>
          </Box>
        </Box>
      </Grid>
    </Box>
  )
}
