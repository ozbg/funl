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
            overflow="hidden"
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
                top="20px"
                left="50%"
                transform="translateX(-50%)"
                className={css({
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: 'lg',
                  color: 'black',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  textAlign: 'center'
                })}
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
              >
                {qrCodeUrl && (
                  <Image
                    src={qrCodeUrl}
                    alt={`QR Code for ${funnelName}`}
                    width={120}
                    height={120}
                    className={css({
                      borderWidth: '2px',
                      borderColor: 'border.default',
                      borderStyle: 'solid'
                    })}
                  />
                )}
              </Box>

              {/* Left Text (Rotated) */}
              <Box
                position="absolute"
                top="50%"
                left="30px"
                transform="translate(-50%, -50%) rotate(-90deg)"
                className={css({
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: 'lg',
                  color: 'black',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                })}
              >
                {wordLeft}
              </Box>

              {/* Right Text (Rotated) */}
              <Box
                position="absolute"
                top="50%"
                right="30px"
                transform="translate(50%, -50%) rotate(90deg)"
                className={css({
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: 'lg',
                  color: 'black',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                })}
              >
                {wordRight}
              </Box>

              {/* Bottom Text */}
              <Box
                position="absolute"
                bottom="20px"
                left="50%"
                transform="translateX(-50%)"
                className={css({
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: 'lg',
                  color: 'black',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  textAlign: 'center'
                })}
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