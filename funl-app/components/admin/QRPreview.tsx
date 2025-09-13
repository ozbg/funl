'use client'

import { useEffect, useState } from 'react'
import { generateQRCodeSVG } from '@/lib/qr'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'

interface QRPreviewProps {
  style_config: any
  size?: number
  url?: string
}

export function QRPreview({ style_config, size = 100, url = 'funl.au' }: QRPreviewProps) {
  const [svgData, setSvgData] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const generatePreview = async () => {
      try {
        setLoading(true)
        setError('')
        
        if (!style_config) {
          setError('No style configuration provided')
          return
        }
        
        // Convert comprehensive style_config to format expected by QR library
        // Use typeNumber 0 (auto) for preview to avoid overflow errors
        const qrConfig = {
          width: size,
          height: size,
          type: "svg" as const,
          data: url,
          margin: 0,
          qrOptions: {
            typeNumber: 0, // Always use auto for preview to prevent overflow
            mode: style_config.qrOptions?.mode || 'Byte',
            errorCorrectionLevel: style_config.qrOptions?.errorCorrectionLevel || 'M' // Use M instead of Q for shorter data
          },
          dotsOptions: {
            color: style_config.dotsOptions?.color || '#6a1a4c',
            type: style_config.dotsOptions?.type || 'extra-rounded',
            gradient: style_config.dotsOptions?.gradient
          },
          backgroundOptions: {
            color: style_config.backgroundOptions?.color || '#ffffff',
            gradient: style_config.backgroundOptions?.gradient
          },
          cornersSquareOptions: style_config.cornersSquareOptions?.type ? {
            type: style_config.cornersSquareOptions.type,
            color: style_config.cornersSquareOptions.color || '#000000',
            gradient: style_config.cornersSquareOptions?.gradient
          } : undefined,
          cornersDotOptions: style_config.cornersDotOptions?.type ? {
            type: style_config.cornersDotOptions.type,
            color: style_config.cornersDotOptions.color || '#000000',
            gradient: style_config.cornersDotOptions?.gradient
          } : undefined,
          imageOptions: {
            hideBackgroundDots: style_config.imageOptions?.hideBackgroundDots || true,
            imageSize: style_config.imageOptions?.imageSize || 0.4,
            margin: style_config.imageOptions?.margin || 0,
            crossOrigin: 'anonymous'
          }
        }

        // Generate QR code directly with qr-code-styling
        const { default: QRCodeStyling } = await import('qr-code-styling')
        
        // Add jsdom only in server environment
        if (typeof window === 'undefined') {
          const { JSDOM } = await import('jsdom')
          ;(qrConfig as any).jsdom = JSDOM
        }
        
        const qrCode = new QRCodeStyling(qrConfig as any)
        
        const svgBuffer = await qrCode.getRawData('svg')
        let svgString: string
        
        if (svgBuffer instanceof Blob) {
          svgString = await svgBuffer.text()
        } else if (svgBuffer) {
          svgString = new TextDecoder().decode(svgBuffer)
        } else {
          throw new Error('Failed to generate QR code')
        }
        
        setSvgData(svgString)
      } catch (err) {
        console.error('Error generating QR preview:', err)
        setError('Failed to generate preview')
      } finally {
        setLoading(false)
      }
    }

    generatePreview()
  }, [style_config, size, url])

  if (loading) {
    return (
      <Box 
        width={size} 
        height={size} 
        bg="bg.muted" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        rounded="md"
      >
        <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>Loading...</span>
      </Box>
    )
  }

  if (error) {
    return (
      <Box 
        width={size} 
        height={size} 
        bg="red.50" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        rounded="md"
        borderWidth="1px"
        borderColor="red.200"
      >
        <span className={css({ fontSize: 'xs', color: 'red.600' })}>Error</span>
      </Box>
    )
  }

  return (
    <Box 
      width={size} 
      height={size}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="bg.default"
      rounded="md"
      borderWidth="1px"
      borderColor="border.default"
      dangerouslySetInnerHTML={{ __html: svgData }}
    />
  )
}