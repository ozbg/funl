'use client'

import React, { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { generateSampleQR, type QRPreset } from '@/lib/qr-generation'

interface QRPreviewProps {
  preset?: QRPreset
  codeText?: string
  size?: number
  showLabel?: boolean
}

export function QRPreview({ preset, codeText = 'SAMPLE', size = 120, showLabel = true }: QRPreviewProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!preset) {
      setQrCodeDataURL('')
      return
    }

    const generatePreview = async () => {
      setLoading(true)
      try {
        const svg = await generateSampleQR(preset, codeText)
        setQrCodeDataURL(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
      } catch (error) {
        console.error('Error generating QR preview:', error)
        setQrCodeDataURL('')
      } finally {
        setLoading(false)
      }
    }

    generatePreview()
  }, [preset, codeText])

  return (
    <Box textAlign="center">
      {showLabel && (
        <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>
          {preset ? `Preview: ${preset.name}` : 'Select a style to preview'}
        </p>
      )}

      <Box
        mx="auto"
        width={`${size}px`}
        height={`${size}px`}
        bg="white"
        border="1px solid"
        borderColor="border.default"
        rounded="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {loading ? (
          <div className={css({ fontSize: 'xs', color: 'fg.muted' })}>
            Generating...
          </div>
        ) : qrCodeDataURL ? (
          <img
            src={qrCodeDataURL}
            alt="QR Code Preview"
            style={{
              width: `${size - 20}px`,
              height: `${size - 20}px`,
              objectFit: 'contain'
            }}
          />
        ) : (
          <div className={css({
            fontSize: 'xs',
            color: 'fg.muted',
            textAlign: 'center',
            p: 2
          })}>
            {preset ? 'Failed to load' : 'No style selected'}
          </div>
        )}
      </Box>

      {preset && (
        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
          Code: {codeText}
        </p>
      )}
    </Box>
  )
}