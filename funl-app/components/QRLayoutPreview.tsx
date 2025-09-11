'use client'

import React, { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Stack, Flex } from '@/styled-system/jsx'
import Image from 'next/image'

interface QRLayoutPreviewProps {
  qrCodeUrl: string
  funnelName: string
}

export default function QRLayoutPreview({ qrCodeUrl, funnelName }: QRLayoutPreviewProps) {
  const [wordTop, setWordTop] = useState('TOP TEXT')
  const [wordBottom, setWordBottom] = useState('BOTTOM TEXT')
  const [wordLeft, setWordLeft] = useState('LEFT')
  const [wordRight, setWordRight] = useState('RIGHT')
  const [textSize, setTextSize] = useState(18) // Font size in pixels
  const [textDistance, setTextDistance] = useState(30) // Distance from edges for left/right in pixels
  const [verticalDistance, setVerticalDistance] = useState(20) // Distance from edges for top/bottom in pixels
  const [qrWidth, setQrWidth] = useState(120) // QR code width in pixels
  const [qrHeight, setQrHeight] = useState(120) // QR code height in pixels

  return (
    <Box bg="bg.default" boxShadow="sm" p={6}>
      <h2 className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'fg.default', mb: 4 })}>
        QR Layout Preview
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
                min="60"
                max="300"
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
                min="60"
                max="300"
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
          <h3 className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
            Preview (A5 Size)
          </h3>
          
          {/* A5 Paper Preview Container */}
          <Box
            position="relative"
            bg="white"
            borderWidth="2px"
            borderColor="border.default"
            borderStyle="solid"
            width="296px"  // A5 width scaled down (148mm -> ~296px at 2px/mm)
            height="420px" // A5 height scaled down (210mm -> ~420px at 2px/mm)
            mx="auto"
            overflow="visible" // Changed from hidden to visible
          >
            {/* Layout Container */}
            <Box
              position="absolute"
              inset="0"
              p={4}
            >
              {/* Top Text */}
              <Box
                position="absolute"
                left="50%"
                style={{
                  top: `${verticalDistance}px`, // Uses separate vertical control
                  transform: 'translateX(-50%)',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: `${textSize}px`,
                  color: 'black',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  textAlign: 'center'
                }}
              >
                {wordTop}
              </Box>

              {/* QR Code Center */}
              <Box 
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                minWidth={`${qrWidth}px`}
                minHeight={`${qrHeight}px`}
              >
                {qrCodeUrl && (
                  <Image
                    src={qrCodeUrl}
                    alt={`QR Code for ${funnelName}`}
                    width={qrWidth}
                    height={qrHeight}
                    className={css({
                      borderWidth: '2px',
                      borderColor: 'border.default',
                      borderStyle: 'solid'
                    })}
                    style={{
                      width: `${qrWidth}px`,
                      height: `${qrHeight}px`,
                      objectFit: 'stretch', // This allows distortion to make it rectangular
                      maxWidth: 'none', // Override any max-width constraints
                      maxHeight: 'none' // Override any max-height constraints
                    }}
                  />
                )}
              </Box>

              {/* Left Text (Rotated) */}
              <Box
                position="absolute"
                top="50%"
                style={{
                  left: `${textDistance}px`, // Same spacing as top/bottom
                  transform: 'translate(-50%, -50%) rotate(-90deg)',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: `${textSize}px`,
                  color: 'black',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {wordLeft}
              </Box>

              {/* Right Text (Rotated) */}
              <Box
                position="absolute"
                top="50%"
                style={{
                  right: `${textDistance}px`, // Same spacing as top/bottom
                  transform: 'translate(50%, -50%) rotate(90deg)',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: `${textSize}px`,
                  color: 'black',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {wordRight}
              </Box>

              {/* Bottom Text */}
              <Box
                position="absolute"
                left="50%"
                style={{
                  bottom: `${verticalDistance}px`, // Uses separate vertical control
                  transform: 'translateX(-50%)',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: `${textSize}px`,
                  color: 'black',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  textAlign: 'center'
                }}
              >
                {wordBottom}
              </Box>
            </Box>
          </Box>
        </Box>
      </Flex>
    </Box>
  )
}