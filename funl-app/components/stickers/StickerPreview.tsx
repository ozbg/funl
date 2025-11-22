'use client'

import { Box } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface StickerPreviewProps {
  qrCodeUrl: string
  style: {
    template: string
    name: string
  }
  size: 'small' | 'medium' | 'large'
  showSize?: boolean
}

const sizeMap = {
  small: { dimension: '50mm', pixels: 150 },
  medium: { dimension: '75mm', pixels: 225 },
  large: { dimension: '100mm', pixels: 300 }
}

export function StickerPreview({ qrCodeUrl, style, size, showSize = true }: StickerPreviewProps) {
  const sizeInfo = sizeMap[size]

  return (
    <Box position="relative">
      {/* Preview Container */}
      <Box
        position="relative"
        w={`${sizeInfo.pixels}px`}
        h={`${sizeInfo.pixels}px`}
        bg="white"
        borderWidth="1px"
        borderColor="border.default"
        rounded="md"
        overflow="hidden"
        boxShadow="sm"
      >
        {/* QR Code */}
        <img
          src={qrCodeUrl}
          alt="QR Code Preview"
          className={css({
            w: 'full',
            h: 'full',
            objectFit: 'contain',
            p: 4
          })}
        />

        {/* Style Overlay based on template */}
        {style.template === 'modern' && (
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            bg="accent.default"
            color="white"
            p={2}
            textAlign="center"
            fontSize="xs"
            fontWeight="semibold"
          >
            Scan Me
          </Box>
        )}

        {style.template === 'classic' && (
          <Box
            position="absolute"
            top={2}
            left={2}
            right={2}
            textAlign="center"
            fontSize="xs"
            fontWeight="medium"
            color="fg.muted"
          >
            FunL
          </Box>
        )}

        {style.template === 'minimal' && (
          <Box
            position="absolute"
            bottom={2}
            right={2}
            w={6}
            h={6}
            bg="accent.default"
            rounded="full"
          />
        )}
      </Box>

      {/* Size Label */}
      {showSize && (
        <Box mt={2} textAlign="center">
          <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
            {sizeInfo.dimension} ({size})
          </p>
        </Box>
      )}
    </Box>
  )
}
