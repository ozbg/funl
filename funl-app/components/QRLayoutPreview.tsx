'use client'

import React, { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Stack, Flex } from '@/styled-system/jsx'
import { createClient } from '@/lib/supabase/client'

interface QRLayoutPreviewProps {
  qrCodeUrl: string
  funnelName: string
  funnelId: string
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
  }
}

export default function QRLayoutPreview({ qrCodeUrl, funnelName, funnelId, initialStickerSettings }: QRLayoutPreviewProps) {
  const [wordTop, setWordTop] = useState(initialStickerSettings?.wordTop ?? 'TOP TEXT')
  const [wordBottom, setWordBottom] = useState(initialStickerSettings?.wordBottom ?? 'BOTTOM TEXT')
  const [wordLeft, setWordLeft] = useState(initialStickerSettings?.wordLeft ?? 'LEFT')
  const [wordRight, setWordRight] = useState(initialStickerSettings?.wordRight ?? 'RIGHT')
  const [textSize, setTextSize] = useState(initialStickerSettings?.textSize ?? 18) // Font size in pixels
  const [textDistance, setTextDistance] = useState(initialStickerSettings?.textDistance ?? 30) // Distance from edges for left/right in pixels
  const [verticalDistance, setVerticalDistance] = useState(initialStickerSettings?.verticalDistance ?? 20) // Distance from edges for top/bottom in pixels
  const [qrWidth, setQrWidth] = useState(initialStickerSettings?.qrWidth ?? 120) // QR code width in pixels
  const [qrHeight, setQrHeight] = useState(initialStickerSettings?.qrHeight ?? 120) // QR code height in pixels
  const [downloading, setDownloading] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const supabase = createClient()

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
          qrHeight
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
  }, [wordTop, wordBottom, wordLeft, wordRight, textSize, textDistance, verticalDistance, qrWidth, qrHeight, funnelId, supabase])


  const handleDownloadSVG = async () => {
    setDownloading(true)
    try {
      // Create SVG representation of the current layout
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="296" height="420" viewBox="0 0 296 420">
          <rect width="296" height="420" fill="white" stroke="#ccc" stroke-width="2"/>
          
          <!-- Top Text -->
          <text x="148" y="${verticalDistance * 0.75 + textSize * 0.75}" text-anchor="middle" 
                font-family="Arial" font-weight="bold" font-size="${textSize}" 
                fill="black" style="text-transform: uppercase;">${wordTop}</text>
          
          <!-- Bottom Text -->
          <text x="148" y="${420 - verticalDistance * 0.75}" text-anchor="middle" 
                font-family="Arial" font-weight="bold" font-size="${textSize}" 
                fill="black" style="text-transform: uppercase;">${wordBottom}</text>
          
          <!-- Left Text (Rotated) -->
          <text x="${textDistance}" y="210" text-anchor="middle" 
                font-family="Arial" font-weight="bold" font-size="${textSize}" 
                fill="black" style="text-transform: uppercase;" 
                transform="rotate(-90 ${textDistance} 210)">${wordLeft}</text>
          
          <!-- Right Text (Rotated) -->
          <text x="${296 - textDistance}" y="210" text-anchor="middle" 
                font-family="Arial" font-weight="bold" font-size="${textSize}" 
                fill="black" style="text-transform: uppercase;" 
                transform="rotate(90 ${296 - textDistance} 210)">${wordRight}</text>
          
          <!-- QR Code Image -->
          ${qrCodeUrl ? `<image x="${148 - qrWidth/2}" y="${210 - qrHeight/2}" width="${qrWidth}" height="${qrHeight}" xlink:href="${qrCodeUrl}" preserveAspectRatio="none"/>` : `<rect x="${148 - qrWidth/2}" y="${210 - qrHeight/2}" width="${qrWidth}" height="${qrHeight}" fill="#f0f0f0" stroke="#000" stroke-width="2"/><text x="148" y="210" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">QR CODE</text>`}
        </svg>
      `
      
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
      // Generate the same SVG content as used for SVG download
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="296" height="420" viewBox="0 0 296 420">
          <rect width="296" height="420" fill="white" stroke="#ccc" stroke-width="2"/>
          
          <!-- Top Text -->
          <text x="148" y="${verticalDistance * 0.75 + textSize * 0.75}" text-anchor="middle" 
                font-family="Arial" font-weight="bold" font-size="${textSize}" 
                fill="black" style="text-transform: uppercase;">${wordTop}</text>
          
          <!-- Bottom Text -->
          <text x="148" y="${420 - verticalDistance * 0.75}" text-anchor="middle" 
                font-family="Arial" font-weight="bold" font-size="${textSize}" 
                fill="black" style="text-transform: uppercase;">${wordBottom}</text>
          
          <!-- Left Text (Rotated) -->
          <text x="${textDistance}" y="210" text-anchor="middle" 
                font-family="Arial" font-weight="bold" font-size="${textSize}" 
                fill="black" style="text-transform: uppercase;" 
                transform="rotate(-90 ${textDistance} 210)">${wordLeft}</text>
          
          <!-- Right Text (Rotated) -->
          <text x="${296 - textDistance}" y="210" text-anchor="middle" 
                font-family="Arial" font-weight="bold" font-size="${textSize}" 
                fill="black" style="text-transform: uppercase;" 
                transform="rotate(90 ${296 - textDistance} 210)">${wordRight}</text>
          
          <!-- QR Code Image -->
          ${qrCodeUrl ? `<image x="${148 - qrWidth/2}" y="${210 - qrHeight/2}" width="${qrWidth}" height="${qrHeight}" xlink:href="${qrCodeUrl}" preserveAspectRatio="none"/>` : `<rect x="${148 - qrWidth/2}" y="${210 - qrHeight/2}" width="${qrWidth}" height="${qrHeight}" fill="#f0f0f0" stroke="#000" stroke-width="2"/><text x="148" y="210" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">QR CODE</text>`}
        </svg>
      `

      // Use svg2pdf.js to properly convert SVG to PDF as vectors
      const [{ jsPDF }, { svg2pdf }] = await Promise.all([
        import('jspdf'),
        import('svg2pdf.js')
      ])
      
      // Create PDF with exact sticker dimensions  
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [296, 420] // Use exact SVG dimensions
      })
      
      // Parse SVG and convert to PDF as vectors
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
      const svgElement = svgDoc.documentElement
      
      await svg2pdf(svgElement, pdf, {
        xOffset: 0,
        yOffset: 0,
        scale: 1 // 1:1 scale - no conversion needed
      })
      
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
      <h2 className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'fg.default', mb: 4 })}>
        Create Sticker
      </h2>
      
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
                    ringColor: 'colorPalette.default',
                    ringOpacity: 0.2
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
                    ringColor: 'colorPalette.default',
                    ringOpacity: 0.2
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
                    ringColor: 'colorPalette.default',
                    ringOpacity: 0.2
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
                    ringColor: 'colorPalette.default',
                    ringOpacity: 0.2
                  }
                })}
                placeholder="Enter right text"
              />
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
                  cursor: 'pointer',
                  _webkitSliderThumb: {
                    appearance: 'none',
                    h: 4,
                    w: 4,
                    bg: 'blue.500',
                    borderRadius: 'full',
                    cursor: 'pointer'
                  }
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
                  _webkitSliderThumb: {
                    appearance: 'none',
                    h: 4,
                    w: 4,
                    bg: 'green.500',
                    borderRadius: 'full',
                    cursor: 'pointer'
                  }
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
                  _webkitSliderThumb: {
                    appearance: 'none',
                    h: 4,
                    w: 4,
                    bg: 'orange.500',
                    borderRadius: 'full',
                    cursor: 'pointer'
                  }
                })}
              />
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Controls top and bottom text distance
              </p>
            </Box>
            
            {/* QR Code Width Control */}
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                QR Code Width: {qrWidth}px
              </label>
              <input
                type="range"
                min="40"
                max="400"
                value={qrWidth}
                onChange={(e) => setQrWidth(Number(e.target.value))}
                className={css({
                  w: 'full',
                  h: 2,
                  bg: 'gray.200',
                  borderRadius: 'lg',
                  appearance: 'none',
                  cursor: 'pointer',
                  _webkitSliderThumb: {
                    appearance: 'none',
                    h: 4,
                    w: 4,
                    bg: 'purple.500',
                    borderRadius: 'full',
                    cursor: 'pointer'
                  }
                })}
              />
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Makes QR code wider or narrower
              </p>
            </Box>
            
            {/* QR Code Height Control */}
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                QR Code Height: {qrHeight}px
              </label>
              <input
                type="range"
                min="40"
                max="400"
                value={qrHeight}
                onChange={(e) => setQrHeight(Number(e.target.value))}
                className={css({
                  w: 'full',
                  h: 2,
                  bg: 'gray.200',
                  borderRadius: 'lg',
                  appearance: 'none',
                  cursor: 'pointer',
                  _webkitSliderThumb: {
                    appearance: 'none',
                    h: 4,
                    w: 4,
                    bg: 'pink.500',
                    borderRadius: 'full',
                    cursor: 'pointer'
                  }
                })}
              />
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Makes QR code taller or shorter
              </p>
            </Box>
          </Stack>
        </Box>
        
        {/* QR Layout Preview */}
        <Box flex="1">
          
          {/* SVG Preview */}
          <Box mx="auto" maxW="296px">
            <p className={css({ fontSize: 'sm', color: 'fg.muted', textAlign: 'center', mb: 2 })}>
              Preview
            </p>
            <Box
                bg="white"
                borderWidth="2px"
                borderColor="border.default"
                borderStyle="solid"
                width="296px"
                height="420px"
                overflow="visible"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="296"
                  height="420"
                  viewBox="0 0 296 420"
                  style={{ width: '100%', height: '100%' }}
                >
                  <rect width="296" height="420" fill="white" stroke="#ccc" strokeWidth="2"/>
                  
                  {/* Top Text */}
                  <text 
                    x="148" 
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
                    x="148" 
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
                    x={296 - textDistance} 
                    y="210" 
                    textAnchor="middle" 
                    fontFamily="Arial" 
                    fontWeight="bold" 
                    fontSize={textSize} 
                    fill="black" 
                    style={{ textTransform: 'uppercase' }}
                    transform={`rotate(90 ${296 - textDistance} 210)`}
                  >
                    {wordRight}
                  </text>
                  
                  {/* QR Code */}
                  {qrCodeUrl ? (
                    <image 
                      x={148 - qrWidth/2} 
                      y={210 - qrHeight/2} 
                      width={qrWidth} 
                      height={qrHeight} 
                      xlinkHref={qrCodeUrl}
                      preserveAspectRatio="none"
                      style={{ border: '2px solid #ccc' }}
                    />
                  ) : (
                    <>
                      <rect 
                        x={148 - qrWidth/2} 
                        y={210 - qrHeight/2} 
                        width={qrWidth} 
                        height={qrHeight} 
                        fill="#f0f0f0" 
                        stroke="#000" 
                        strokeWidth="2"
                      />
                      <text 
                        x="148" 
                        y="210" 
                        textAnchor="middle" 
                        fontFamily="Arial" 
                        fontSize="12" 
                        fill="#666"
                      >
                        QR CODE
                      </text>
                    </>
                  )}
                </svg>
              </Box>
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