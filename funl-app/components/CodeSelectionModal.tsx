'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'

interface CodeSelectionModalProps {
  funnelId: string
  isOpen: boolean
  onClose: () => void
}

export default function CodeSelectionModal({ funnelId, isOpen, onClose }: CodeSelectionModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleBuySticker = () => {
    setLoading(true)
    router.push(`/dashboard/stickers/buy?funnelId=${funnelId}`)
  }

  const handleDesignOwn = () => {
    setLoading(true)
    router.push(`/dashboard/funnels/${funnelId}`)
  }

  const handleConnectExisting = () => {
    setLoading(true)
    router.push(`/dashboard/stickers/connect?funnelId=${funnelId}`)
  }

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
        p={8}
        position="relative"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={css({
            position: 'absolute',
            top: 4,
            right: 4,
            p: 2,
            color: 'fg.muted',
            _hover: { color: 'fg.default' }
          })}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Header */}
        <Box mb={8} textAlign="center">
          <h2 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default', mb: 2 })}>
            Choose How to Get Your QR Sticker
          </h2>
          <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            Select the option that best fits your needs
          </p>
        </Box>

        {/* Options Grid */}
        <Grid columns={{ base: 1, md: 3 }} gap={6}>
          {/* Buy Pre-Printed Option */}
          <Box
            borderWidth="2px"
            borderColor="border.default"
            p={6}
            cursor="pointer"
            transition="all 0.2s"
            position="relative"
            _hover={{
              borderColor: 'mint.default',
              transform: 'translateY(-2px)',
              boxShadow: 'lg'
            }}
            onClick={handleBuySticker}
          >
            {/* Most Popular Badge */}
            <Box
              position="absolute"
              top={-3}
              left="50%"
              transform="translateX(-50%)"
              bg="mint.default"
              color="white"
              px={3}
              py={1}
              fontSize="xs"
              fontWeight="semibold"
            >
              MOST POPULAR
            </Box>

            <Flex direction="column" align="center" gap={4}>
              {/* Icon */}
              <Box color="mint.default" fontSize="3xl">
                🏷️
              </Box>

              <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
                Buy Pre-Printed Sticker
              </h3>

              <ul className={css({ fontSize: 'sm', color: 'fg.muted', textAlign: 'left', w: 'full' })}>
                <li className={css({ mb: 2 })}>✓ Professional quality</li>
                <li className={css({ mb: 2 })}>✓ Weatherproof material</li>
                <li className={css({ mb: 2 })}>✓ Ships in 2-3 days</li>
                <li className={css({ mb: 2 })}>✓ From $0.50/sticker</li>
              </ul>

              <button
                disabled={loading}
                className={css({
                  colorPalette: 'mint',
                  w: 'full',
                  py: 2,
                  bg: 'colorPalette.default',
                  color: 'white',
                  fontWeight: 'medium',
                  fontSize: 'sm',
                  _hover: { bg: 'colorPalette.emphasized' },
                  _disabled: { opacity: 0.5, cursor: 'not-allowed' }
                })}
              >
                Browse Stickers
              </button>
            </Flex>
          </Box>

          {/* Design Your Own Option */}
          <Box
            borderWidth="2px"
            borderColor="border.default"
            p={6}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              borderColor: 'mint.default',
              transform: 'translateY(-2px)',
              boxShadow: 'lg'
            }}
            onClick={handleDesignOwn}
          >
            <Flex direction="column" align="center" gap={4}>
              {/* Icon */}
              <Box color="mint.default" fontSize="3xl">
                🎨
              </Box>

              <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
                Design Your Own
              </h3>

              <ul className={css({ fontSize: 'sm', color: 'fg.muted', textAlign: 'left', w: 'full' })}>
                <li className={css({ mb: 2 })}>✓ Full customization</li>
                <li className={css({ mb: 2 })}>✓ Instant download</li>
                <li className={css({ mb: 2 })}>✓ Print anywhere</li>
                <li className={css({ mb: 2 })}>✓ From $5/design</li>
              </ul>

              <button
                disabled={loading}
                className={css({
                  w: 'full',
                  py: 2,
                  borderWidth: '2px',
                  borderColor: 'mint.default',
                  color: 'mint.default',
                  fontWeight: 'medium',
                  fontSize: 'sm',
                  bg: 'transparent',
                  _hover: { bg: 'mint.subtle' },
                  _disabled: { opacity: 0.5, cursor: 'not-allowed' }
                })}
              >
                Open Designer
              </button>
            </Flex>
          </Box>

          {/* Connect Existing Option */}
          <Box
            borderWidth="2px"
            borderColor="border.default"
            p={6}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              borderColor: 'mint.default',
              transform: 'translateY(-2px)',
              boxShadow: 'lg'
            }}
            onClick={handleConnectExisting}
          >
            <Flex direction="column" align="center" gap={4}>
              {/* Icon */}
              <Box color="mint.default" fontSize="3xl">
                🔗
              </Box>

              <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
                Connect Existing
              </h3>

              <ul className={css({ fontSize: 'sm', color: 'fg.muted', textAlign: 'left', w: 'full' })}>
                <li className={css({ mb: 2 })}>✓ Use purchased stickers</li>
                <li className={css({ mb: 2 })}>✓ Quick setup</li>
                <li className={css({ mb: 2 })}>✓ Secure verification</li>
                <li className={css({ mb: 2 })}>✓ No additional cost</li>
              </ul>

              <button
                disabled={loading}
                className={css({
                  w: 'full',
                  py: 2,
                  borderWidth: '2px',
                  borderColor: 'mint.default',
                  color: 'mint.default',
                  fontWeight: 'medium',
                  fontSize: 'sm',
                  bg: 'transparent',
                  _hover: { bg: 'mint.subtle' },
                  _disabled: { opacity: 0.5, cursor: 'not-allowed' }
                })}
              >
                Connect Sticker
              </button>
            </Flex>
          </Box>
        </Grid>

        {/* Skip Option */}
        <Flex justify="center" mt={6}>
          <button
            onClick={onClose}
            className={css({
              fontSize: 'sm',
              color: 'fg.muted',
              textDecoration: 'underline',
              _hover: { color: 'fg.default' }
            })}
          >
            Skip for now
          </button>
        </Flex>
      </Box>
    </div>
  )
}