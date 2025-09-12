'use client'

import React, { useEffect, useState } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { generateQRCode } from '@/lib/qr'

interface PrintPreviewProps {
  printType: 'A4_portrait' | 'A5_portrait' | 'A5_landscape'
  funnelName?: string
}

export default function PrintPreview({ printType, funnelName }: PrintPreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  useEffect(() => {
    // Generate a preview QR code
    const generatePreviewQR = async () => {
      try {
        // For now, generate QR code with placeholder URL
        const placeholderUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/f/preview`
        const qrDataUrl = await generateQRCode(placeholderUrl)
        setQrCodeUrl(qrDataUrl)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    generatePreviewQR()
  }, [])

  // Calculate dimensions based on print type
  const getDimensions = () => {
    switch (printType) {
      case 'A4_portrait':
        return { width: 210, height: 297, displayWidth: '150px', displayHeight: '212px' }
      case 'A5_portrait':
        return { width: 148, height: 210, displayWidth: '148px', displayHeight: '210px' }
      case 'A5_landscape':
        return { width: 210, height: 148, displayWidth: '210px', displayHeight: '148px' }
      default:
        return { width: 210, height: 297, displayWidth: '150px', displayHeight: '212px' }
    }
  }

  const dimensions = getDimensions()

  return (
    <Box>
      <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
        Print Preview
      </h3>
      
      {/* Print Preview Container */}
      <Box
        position="relative"
        w={dimensions.displayWidth}
        h={dimensions.displayHeight}
        mx="auto"
        bg="white"
        borderWidth="1px"
        borderColor="border.default"
        boxShadow="sm"
        display="flex"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        {/* QR Code */}
        {qrCodeUrl && (
          <img
            src={qrCodeUrl}
            alt="QR Code Preview"
            className={css({
              w: "60%",
              h: "auto",
              maxW: "120px"
            })}
          />
        )}
        
        {/* Optional: Funnel name */}
        {funnelName && (
          <Box
            position="absolute"
            bottom={2}
            left="50%"
            transform="translateX(-50%)"
            fontSize="2xs"
            color="fg.muted"
            textAlign="center"
          >
            {funnelName}
          </Box>
        )}
      </Box>
      
      {/* Print Type Label */}
      <p className={css({ fontSize: 'xs', color: 'fg.muted', textAlign: 'center', mt: 2 })}>
        {printType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </p>
    </Box>
  )
}