'use client'

import React, { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Stack, Flex } from '@/styled-system/jsx'
import { createClient } from '@/lib/supabase/client'
import { generateQRCodeSVG, generateShortUrl } from '@/lib/qr'

interface QRLayoutPreviewProps {
  qrCodeUrl?: string // Keep for backwards compatibility
  shortUrl?: string // New: pass the URL to encode
  funnelName: string
  funnelId: string
  qrStyle?: 'square' | 'rounded' | 'dots' | 'dots-rounded' | 'classy' | 'classy-rounded' | 'extra-rounded'
  initialStickerSettings?: {
    wordTop?: string
    wordBottom?: string
    wordLeft?: string
    wordRight?: string
    textSize?: number
    textDistance?: number
    verticalDistance?: number
    qrWidth?: number
    qrHeight?: number
    qrPresetId?: string
    outputSize?: string
    customWidth?: string
    customHeight?: string
    useCustomSize?: boolean
  }
}

export default function QRLayoutPreview({ qrCodeUrl, shortUrl, funnelName, funnelId, qrStyle = 'square', initialStickerSettings }: QRLayoutPreviewProps) {
  const [wordTop, setWordTop] = useState(initialStickerSettings?.wordTop ?? 'TOP TEXT')
  const [wordBottom, setWordBottom] = useState(initialStickerSettings?.wordBottom ?? 'BOTTOM TEXT')
  const [wordLeft, setWordLeft] = useState(initialStickerSettings?.wordLeft ?? 'LEFT')
  const [wordRight, setWordRight] = useState(initialStickerSettings?.wordRight ?? 'RIGHT')
  const [textSize, setTextSize] = useState(initialStickerSettings?.textSize ?? 18) // Font size in pixels
  const [textDistance, setTextDistance] = useState(initialStickerSettings?.textDistance ?? 40) // Distance from edges for left/right in pixels
  const [verticalDistance, setVerticalDistance] = useState(initialStickerSettings?.verticalDistance ?? 40) // Distance from edges for top/bottom in pixels
  const [qrWidth, setQrWidth] = useState(initialStickerSettings?.qrWidth ?? 120) // QR code width in pixels
  const [qrHeight, setQrHeight] = useState(initialStickerSettings?.qrHeight ?? initialStickerSettings?.qrWidth ?? 120) // QR code height in pixels (should match width for square)
  const [downloading, setDownloading] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [qrCodeSVG, setQrCodeSVG] = useState<string>('')
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')
  const [availableQRPresets, setAvailableQRPresets] = useState<Array<{
    id: string
    name: string
    style_config: Record<string, unknown>
  }>>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialStickerSettings?.qrPresetId || '')
  const [outputSize, setOutputSize] = useState<string>(initialStickerSettings?.outputSize || '50') // Default 50mm
  const [customWidth, setCustomWidth] = useState<string>(initialStickerSettings?.customWidth || '50')
  const [customHeight, setCustomHeight] = useState<string>(initialStickerSettings?.customHeight || '50')
  const [useCustomSize, setUseCustomSize] = useState<boolean>(initialStickerSettings?.useCustomSize || false)
  const supabase = createClient()

  // Generate SVG QR code when component mounts or style changes
  useEffect(() => {
    const generateQR = async () => {
      console.log('🔍 QR Generation Debug:', { shortUrl, selectedPresetId, availablePresets: availableQRPresets.length, qrWidth, qrHeight })
      if (shortUrl) {
        try {
          // Find the selected preset configuration or use first available
          const selectedPreset = selectedPresetId
            ? availableQRPresets.find(p => p.id === selectedPresetId)
            : availableQRPresets[0]

          if (!selectedPreset) {
            console.log('⚠️ No preset available yet, waiting...')
            return
          }

          console.log('🎨 Using preset:', selectedPreset.name)
          console.log('📋 Preset style_config:', JSON.stringify(selectedPreset.style_config, null, 2))

          // Use qr-code-styling directly with the preset configuration
          const { default: QRCodeStyling } = await import('qr-code-styling')

          const config = {
            width: Math.max(qrWidth, qrHeight),
            height: Math.max(qrWidth, qrHeight),
            type: "svg" as const,
            data: shortUrl,
            margin: 0,
            // Apply the preset's style configuration first
            ...selectedPreset.style_config,
            // Then merge qrOptions properly
            qrOptions: {
              errorCorrectionLevel: 'M' as const,
              ...((selectedPreset.style_config as Record<string, unknown>)?.qrOptions as Record<string, unknown> || {})
            }
          }

          console.log('🔧 Final QR config being used:', JSON.stringify(config, null, 2))

          // Add jsdom only in server environment
          if (typeof window === 'undefined') {
            const { JSDOM } = await import('jsdom')
            ;(config as Record<string, unknown>).jsdom = JSDOM
          }

          const qrCode = new QRCodeStyling(config)
          const svgBuffer = await qrCode.getRawData('svg')

          let svg: string
          if (svgBuffer instanceof Blob) {
            svg = await svgBuffer.text()
          } else if (svgBuffer) {
            svg = new TextDecoder().decode(svgBuffer)
          } else {
            throw new Error('Failed to generate QR code')
          }
          console.log('✅ SVG Generated, length:', svg.length)
          console.log('📐 Preview dimensions - qrWidth:', qrWidth, 'qrHeight:', qrHeight)
          console.log('🖼️ SVG preview will be scaled to fit', qrWidth, 'x', qrHeight, 'pixels')
          setQrCodeSVG(svg)
          
          // Convert SVG to data URL for preview display (more efficient without base64)
          setQrCodeDataURL(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
          console.log('✅ DataURL created for preview')
        } catch (error) {
          console.error('❌ Failed to generate QR code:', error)
        }
      } else {
        console.log('⚠️ No shortUrl provided')
        setQrCodeDataURL('')
      }
    }
    generateQR()
  }, [shortUrl, selectedPresetId, availableQRPresets, qrWidth, qrHeight])

  // Load available QR presets for the user's business category
  useEffect(() => {
    const loadQRPresets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user's business category
        const { data: business } = await supabase
          .from('businesses')
          .select('business_category_id')
          .eq('id', user.id)
          .single()

        if (!business?.business_category_id) {
          console.log('⚠️ No business category found for user')
          return
        }

        // Get QR presets for this business category
        const { data: presets } = await supabase
          .from('qr_code_presets')
          .select(`
            id,
            name,
            style_config,
            category_qr_presets!inner(
              business_category_id
            )
          `)
          .eq('category_qr_presets.business_category_id', business.business_category_id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (presets) {
          console.log('✅ Loaded QR presets for business:', presets.length)
          setAvailableQRPresets(presets)

          // Set default to first preset if none selected
          if (presets.length > 0 && !selectedPresetId) {
            setSelectedPresetId(presets[0].id)
          }
        }
      } catch (error) {
        console.error('❌ Error loading QR presets:', error)
      }
    }

    loadQRPresets()
  }, [supabase, selectedPresetId])

  // Save sticker settings to database with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        const stickerSettings = {
          wordTop,
          wordBottom,
          wordLeft,
          wordRight,
          textSize,
          textDistance,
          verticalDistance,
          qrWidth,
          qrHeight,
          qrPresetId: selectedPresetId,
          outputSize,
          customWidth,
          customHeight,
          useCustomSize
        }

        // First get the current content to preserve it
        const { data: currentFunnel } = await supabase
          .from('funnels')
          .select('content')
          .eq('id', funnelId)
          .single()

        await supabase
          .from('funnels')
          .update({
            content: {
              ...currentFunnel?.content,
              sticker_settings: stickerSettings
            }
          })
          .eq('id', funnelId)

      } catch (error) {
        console.error('Error saving sticker settings:', error)
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timeoutId)
  }, [wordTop, wordBottom, wordLeft, wordRight, textSize, textDistance, verticalDistance, qrWidth, qrHeight, selectedPresetId, outputSize, customWidth, customHeight, useCustomSize, funnelId, supabase])


  // Helper function to get final output dimensions in mm
  const getOutputDimensions = () => {
    if (useCustomSize) {
      return {
        width: parseFloat(customWidth) || 50,
        height: parseFloat(customHeight) || 50
      }
    }
    const size = parseFloat(outputSize) || 50
    return { width: size, height: size }
  }

  const handleDownloadSVG = async () => {
    setDownloading(true)
    try {
      // Use the current QR code SVG for export (already generated with correct preset)
      const exportQRSVG = qrCodeSVG
      console.log('📦 Using current QR SVG for export, length:', exportQRSVG.length)

      // Position and size calculations - EXACTLY same as preview
      const qrX = 210 - qrWidth/2
      const qrY = 210 - qrHeight/2
      console.log('📦 Export QR positioning - x:', qrX, 'y:', qrY, 'width:', qrWidth, 'height:', qrHeight)

      // Get final output dimensions
      const outputDims = getOutputDimensions()
      console.log('📐 Output dimensions:', outputDims.width, 'mm x', outputDims.height, 'mm')

      // Create SVG representation with proper scaling for output size
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${outputDims.width}mm" height="${outputDims.height}mm" viewBox="0 0 420 420">
          <rect width="420" height="420" fill="white"/>

          <!-- Top Text -->
          <text x="210" y="${verticalDistance * 0.75 + textSize * 0.75}" text-anchor="middle"
                font-family="Arial" font-weight="bold" font-size="${textSize}"
                fill="black" style="text-transform: uppercase;">${wordTop}</text>

          <!-- Bottom Text -->
          <text x="210" y="${420 - verticalDistance * 0.75}" text-anchor="middle"
                font-family="Arial" font-weight="bold" font-size="${textSize}"
                fill="black" style="text-transform: uppercase;">${wordBottom}</text>

          <!-- Left Text (Rotated) -->
          <text x="${textDistance}" y="210" text-anchor="middle"
                font-family="Arial" font-weight="bold" font-size="${textSize}"
                fill="black" style="text-transform: uppercase;"
                transform="rotate(-90 ${textDistance} 210)">${wordLeft}</text>

          <!-- Right Text (Rotated) -->
          <text x="${420 - textDistance}" y="210" text-anchor="middle"
                font-family="Arial" font-weight="bold" font-size="${textSize}"
                fill="black" style="text-transform: uppercase;"
                transform="rotate(90 ${420 - textDistance} 210)">${wordRight}</text>

          <!-- QR Code - Use image approach like preview -->
          <image x="${qrX}" y="${qrY}" width="${qrWidth}" height="${qrHeight}"
                 href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(exportQRSVG)}"
                 preserveAspectRatio="xMidYMid meet" />
        </svg>
      `
      
      console.log('📦 Export SVG using embedded SVG content with gradients')
      console.log('📦 Export SVG content length:', svgContent.length)
      
      // Create download link
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const link = document.createElement('a')
      link.download = `${funnelName}_sticker.svg`
      link.href = URL.createObjectURL(blob)
      link.click()
      URL.revokeObjectURL(link.href)
      
    } catch (error) {
      console.error('Failed to generate SVG:', error)
      alert('Failed to generate SVG')
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true)
    try {
      // Use the current QR code SVG for export (already generated with correct preset)
      const exportQRSVG = qrCodeSVG
      console.log('📦 Using current QR SVG for PDF export, length:', exportQRSVG.length)

      // Position and size calculations - EXACTLY same as preview
      const qrX = 210 - qrWidth/2
      const qrY = 210 - qrHeight/2
      console.log('📦 Export PDF QR positioning - x:', qrX, 'y:', qrY, 'width:', qrWidth, 'height:', qrHeight)

      // Get final output dimensions
      const outputDims = getOutputDimensions()
      console.log('📐 PDF Output dimensions:', outputDims.width, 'mm x', outputDims.height, 'mm')

      // Generate the same SVG content as used for SVG download with proper scaling
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${outputDims.width}mm" height="${outputDims.height}mm" viewBox="0 0 420 420">
          <rect width="420" height="420" fill="white"/>

          <!-- Top Text -->
          <text x="210" y="${verticalDistance * 0.75 + textSize * 0.75}" text-anchor="middle"
                font-family="Arial" font-weight="bold" font-size="${textSize}"
                fill="black" style="text-transform: uppercase;">${wordTop}</text>

          <!-- Bottom Text -->
          <text x="210" y="${420 - verticalDistance * 0.75}" text-anchor="middle"
                font-family="Arial" font-weight="bold" font-size="${textSize}"
                fill="black" style="text-transform: uppercase;">${wordBottom}</text>

          <!-- Left Text (Rotated) -->
          <text x="${textDistance}" y="210" text-anchor="middle"
                font-family="Arial" font-weight="bold" font-size="${textSize}"
                fill="black" style="text-transform: uppercase;"
                transform="rotate(-90 ${textDistance} 210)">${wordLeft}</text>

          <!-- Right Text (Rotated) -->
          <text x="${420 - textDistance}" y="210" text-anchor="middle"
                font-family="Arial" font-weight="bold" font-size="${textSize}"
                fill="black" style="text-transform: uppercase;"
                transform="rotate(90 ${420 - textDistance} 210)">${wordRight}</text>

          <!-- QR Code - Use image approach like preview -->
          <image x="${qrX}" y="${qrY}" width="${qrWidth}" height="${qrHeight}"
                 href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(exportQRSVG)}"
                 preserveAspectRatio="xMidYMid meet" />
        </svg>
      `
      
      console.log('📦 Export PDF using <image> method like preview')
      console.log('📦 Export PDF content length:', svgContent.length)

      // Use svg2pdf.js to properly convert SVG to PDF as vectors
      const [{ jsPDF }, { svg2pdf }] = await Promise.all([
        import('jspdf'),
        import('svg2pdf.js')
      ])
      
      // Create PDF with final output dimensions in mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [outputDims.width, outputDims.height] // Use final dimensions
      })
      
      // Parse SVG and convert to PDF as vectors
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
      const svgElement = svgDoc.documentElement
      
      await svg2pdf(svgElement, pdf)
      
      // Download the PDF
      pdf.save(`${funnelName}_sticker.pdf`)
      
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF')
    } finally {
      setDownloadingPDF(false)
    }
  }

  return (
    <Box bg="bg.default" boxShadow="sm" p={6}>
      <Flex align="center" justify="space-between" mb={4}>
        <h2 className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'fg.default' })}>
          Create Sticker
        </h2>
      </Flex>
      
      <Flex gap={6}>
        {/* Input Fields */}
        <Box flex="1">
          <h3 className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
            Text Fields
          </h3>
          <Stack gap={3}>
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Top Text
              </label>
              <input
                type="text"
                value={wordTop}
                onChange={(e) => setWordTop(e.target.value)}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  borderRadius: 'md',
                  bg: 'bg.default',
                  color: 'fg.default',
                  fontSize: 'sm',
                  _focus: {
                    outline: 'none',
                    borderColor: 'colorPalette.default',
                    ringWidth: '2px',
                    ringColor: 'colorPalette.default'
                  }
                })}
                placeholder="Enter top text"
              />
            </Box>
            
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Bottom Text
              </label>
              <input
                type="text"
                value={wordBottom}
                onChange={(e) => setWordBottom(e.target.value)}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  borderRadius: 'md',
                  bg: 'bg.default',
                  color: 'fg.default',
                  fontSize: 'sm',
                  _focus: {
                    outline: 'none',
                    borderColor: 'colorPalette.default',
                    ringWidth: '2px',
                    ringColor: 'colorPalette.default'
                  }
                })}
                placeholder="Enter bottom text"
              />
            </Box>
            
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Left Text
              </label>
              <input
                type="text"
                value={wordLeft}
                onChange={(e) => setWordLeft(e.target.value)}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  borderRadius: 'md',
                  bg: 'bg.default',
                  color: 'fg.default',
                  fontSize: 'sm',
                  _focus: {
                    outline: 'none',
                    borderColor: 'colorPalette.default',
                    ringWidth: '2px',
                    ringColor: 'colorPalette.default'
                  }
                })}
                placeholder="Enter left text"
              />
            </Box>
            
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Right Text
              </label>
              <input
                type="text"
                value={wordRight}
                onChange={(e) => setWordRight(e.target.value)}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  borderRadius: 'md',
                  bg: 'bg.default',
                  color: 'fg.default',
                  fontSize: 'sm',
                  _focus: {
                    outline: 'none',
                    borderColor: 'colorPalette.default',
                    ringWidth: '2px',
                    ringColor: 'colorPalette.default'
                  }
                })}
                placeholder="Enter right text"
              />
            </Box>
            
            {/* QR Code Style Selector */}
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                QR Code Style
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  borderRadius: 'md',
                  bg: 'bg.default',
                  color: 'fg.default',
                  fontSize: 'sm',
                  cursor: 'pointer',
                  _focus: {
                    outline: 'none',
                    borderColor: 'colorPalette.default',
                    ringWidth: '2px',
                    ringColor: 'colorPalette.default'
                  }
                })}
              >
                {availableQRPresets.length === 0 && (
                  <option value="">Loading styles...</option>
                )}
                {availableQRPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </Box>

            
            {/* Text Size Control */}
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Text Size: {textSize}px
              </label>
              <input
                type="range"
                min="8"
                max="40"
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
                className={css({
                  w: 'full',
                  h: 2,
                  bg: 'gray.200',
                  borderRadius: 'lg',
                  appearance: 'none',
                  cursor: 'pointer'
                })}
              />
            </Box>
            
            {/* Horizontal Distance Control (Left/Right) */}
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Left/Right Distance: {textDistance}px
              </label>
              <input
                type="range"
                min="5"
                max="120"
                value={textDistance}
                onChange={(e) => setTextDistance(Number(e.target.value))}
                className={css({
                  w: 'full',
                  h: 2,
                  bg: 'gray.200',
                  borderRadius: 'lg',
                  appearance: 'none',
                  cursor: 'pointer',
                })}
              />
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Controls left and right text distance
              </p>
            </Box>
            
            {/* Vertical Distance Control (Top/Bottom) */}
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Top/Bottom Distance: {verticalDistance}px
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={verticalDistance}
                onChange={(e) => setVerticalDistance(Number(e.target.value))}
                className={css({
                  w: 'full',
                  h: 2,
                  bg: 'gray.200',
                  borderRadius: 'lg',
                  appearance: 'none',
                  cursor: 'pointer',
                })}
              />
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Controls top and bottom text distance
              </p>
            </Box>
            
            {/* QR Code Size Control */}
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                QR Code Size: {qrWidth}px
              </label>
              <input
                type="range"
                min="40"
                max="400"
                value={qrWidth}
                onChange={(e) => {
                  const size = Number(e.target.value)
                  setQrWidth(size)
                  setQrHeight(size)
                }}
                className={css({
                  w: 'full',
                  h: 2,
                  bg: 'gray.200',
                  borderRadius: 'lg',
                  appearance: 'none',
                  cursor: 'pointer',
                })}
              />
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Adjusts QR code size (square)
              </p>
            </Box>
          </Stack>
        </Box>
        
        {/* QR Layout Preview */}
        <Box flex="1">
          
          {/* SVG Preview */}
          <Box mx="auto" maxW="420px">
            <p className={css({ fontSize: 'sm', color: 'fg.muted', textAlign: 'center', mb: 2 })}>
              Preview
            </p>
            <Box
                bg="white"
                borderWidth="2px"
                borderColor="border.default"
                borderStyle="solid"
                width="420px"
                height="420px"
                overflow="visible"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="420"
                  height="420"
                  viewBox="0 0 420 420"
                  style={{ width: '100%', height: '100%' }}
                >
                  <rect width="420" height="420" fill="white"/>

                  {/* Top Text */}
                  <text
                    x="210"
                    y={verticalDistance * 0.75 + textSize * 0.75}
                    textAnchor="middle"
                    fontFamily="Arial"
                    fontWeight="bold"
                    fontSize={textSize}
                    fill="black"
                    style={{ textTransform: 'uppercase' }}
                  >
                    {wordTop}
                  </text>

                  {/* Bottom Text */}
                  <text
                    x="210"
                    y={420 - verticalDistance * 0.75}
                    textAnchor="middle"
                    fontFamily="Arial"
                    fontWeight="bold"
                    fontSize={textSize}
                    fill="black"
                    style={{ textTransform: 'uppercase' }}
                  >
                    {wordBottom}
                  </text>

                  {/* Left Text (Rotated) */}
                  <text
                    x={textDistance}
                    y="210"
                    textAnchor="middle"
                    fontFamily="Arial"
                    fontWeight="bold"
                    fontSize={textSize}
                    fill="black"
                    style={{ textTransform: 'uppercase' }}
                    transform={`rotate(-90 ${textDistance} 210)`}
                  >
                    {wordLeft}
                  </text>

                  {/* Right Text (Rotated) */}
                  <text
                    x={420 - textDistance}
                    y="210"
                    textAnchor="middle"
                    fontFamily="Arial"
                    fontWeight="bold"
                    fontSize={textSize}
                    fill="black"
                    style={{ textTransform: 'uppercase' }}
                    transform={`rotate(90 ${420 - textDistance} 210)`}
                  >
                    {wordRight}
                  </text>

                  {/* QR Code - SVG Only */}
                  {qrCodeDataURL ? (
                    <image
                      x={210 - qrWidth/2}
                      y={210 - qrHeight/2}
                      width={qrWidth}
                      height={qrHeight}
                      href={qrCodeDataURL}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  ) : (
                    <>
                      <rect
                        x={210 - qrWidth/2}
                        y={210 - qrHeight/2}
                        width={qrWidth}
                        height={qrHeight}
                        fill="#f0f0f0"
                        stroke="#000"
                        strokeWidth="2"
                      />
                      <text
                        x="210"
                        y="210"
                        textAnchor="middle"
                        fontFamily="Arial"
                        fontSize="12"
                        fill="#666"
                      >
                        NO QR URL
                      </text>
                    </>
                  )}
                </svg>
              </Box>
          </Box>
          
          {/* Output Size Selector */}
          <Box mt={4} maxW="300px" mx="auto">
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2, textAlign: 'center' })}>
              Output Size
            </label>
            <Box mb={3}>
              <input
                type="checkbox"
                id="customSizeToggle"
                checked={useCustomSize}
                onChange={(e) => setUseCustomSize(e.target.checked)}
                className={css({ mr: 2 })}
              />
              <label htmlFor="customSizeToggle" className={css({ fontSize: 'sm', color: 'fg.default' })}>
                Custom size
              </label>
            </Box>

            {!useCustomSize ? (
              <select
                value={outputSize}
                onChange={(e) => setOutputSize(e.target.value)}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  borderRadius: 'md',
                  bg: 'bg.default',
                  color: 'fg.default',
                  fontSize: 'sm',
                  cursor: 'pointer',
                  _focus: {
                    outline: 'none',
                    borderColor: 'colorPalette.default',
                    ringWidth: '2px',
                    ringColor: 'colorPalette.default'
                  }
                })}
              >
                <option value="25">25mm × 25mm (Small)</option>
                <option value="50">50mm × 50mm (Medium)</option>
                <option value="75">75mm × 75mm (Large)</option>
                <option value="100">100mm × 100mm (Extra Large)</option>
              </select>
            ) : (
              <Flex gap={2}>
                <Box flex="1">
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    placeholder="Width"
                    min="10"
                    max="300"
                    className={css({
                      w: 'full',
                      px: 3,
                      py: 2,
                      borderWidth: '1px',
                      borderColor: 'border.default',
                      borderRadius: 'md',
                      bg: 'bg.default',
                      color: 'fg.default',
                      fontSize: 'sm',
                      _focus: {
                        outline: 'none',
                        borderColor: 'colorPalette.default',
                        ringWidth: '2px',
                        ringColor: 'colorPalette.default'
                      }
                    })}
                  />
                </Box>
                <span className={css({ alignSelf: 'center', fontSize: 'sm', color: 'fg.muted' })}>×</span>
                <Box flex="1">
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    placeholder="Height"
                    min="10"
                    max="300"
                    className={css({
                      w: 'full',
                      px: 3,
                      py: 2,
                      borderWidth: '1px',
                      borderColor: 'border.default',
                      borderRadius: 'md',
                      bg: 'bg.default',
                      color: 'fg.default',
                      fontSize: 'sm',
                      _focus: {
                        outline: 'none',
                        borderColor: 'colorPalette.default',
                        ringWidth: '2px',
                        ringColor: 'colorPalette.default'
                      }
                    })}
                  />
                </Box>
                <span className={css({ alignSelf: 'center', fontSize: 'sm', color: 'fg.muted' })}>mm</span>
              </Flex>
            )}

            <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 2, textAlign: 'center' })}>
              Final output size: {getOutputDimensions().width}mm × {getOutputDimensions().height}mm
            </p>
          </Box>

          {/* Download Buttons */}
          <Flex mt={4} direction="column" gap={2} align="center">
            <button
              onClick={handleDownloadSVG}
              disabled={downloading}
              className={css({
                colorPalette: 'mint',
                px: 6,
                py: 3,
                fontSize: 'sm',
                fontWeight: 'bold',
                color: 'colorPalette.fg',
                bg: 'colorPalette.default',
                borderRadius: '0',
                cursor: 'pointer',
                w: '200px',
                _hover: {
                  bg: 'colorPalette.emphasized',
                },
                _disabled: {
                  opacity: 'disabled',
                  cursor: 'not-allowed',
                },
              })}
            >
              {downloading ? 'Generating...' : 'Download Sticker (SVG)'}
            </button>
            
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className={css({
                colorPalette: 'blue',
                px: 6,
                py: 3,
                fontSize: 'sm',
                fontWeight: 'bold',
                color: 'colorPalette.fg',
                bg: 'colorPalette.default',
                borderRadius: '0',
                cursor: 'pointer',
                w: '200px',
                _hover: {
                  bg: 'colorPalette.emphasized',
                },
                _disabled: {
                  opacity: 'disabled',
                  cursor: 'not-allowed',
                },
              })}
            >
              {downloadingPDF ? 'Generating...' : 'Download Sticker (PDF)'}
            </button>
          </Flex>
        </Box>
      </Flex>
    </Box>
  )
}