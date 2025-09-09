'use client'

import React from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack } from '@/styled-system/jsx'

interface FunnelPreviewProps {
  formData: {
    name: string
    type: 'contact' | 'property' | 'video'
    content: {
      state?: string
      price?: string
      property_url?: string
      video_url?: string
      custom_message?: string
    }
  }
  businessName?: string
}

export default function FunnelPreview({ formData, businessName = 'Your Business' }: FunnelPreviewProps) {
  return (
    <Box>
      <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 4 })}>
        Mobile Preview
      </h3>
      
      {/* Mobile Phone Frame */}
      <Box
        mx="auto"
        w="360px"
        h="640px"
        bg="border.default"
        p={1}
        position="relative"
        borderRadius="xl"
        boxShadow="sm"
      >
        {/* Phone Notch */}
        <Box
          position="absolute"
          top={0.5}
          left="50%"
          transform="translateX(-50%)"
          w="100px"
          h="16px"
          bg="fg.muted"
          borderRadius="full"
          zIndex={1}
        />
        
        {/* Phone Screen */}
        <Box
          w="full"
          h="full"
          bg="bg.subtle"
          overflow="auto"
          position="relative"
          borderRadius="lg"
        >
          {/* Funnel Content */}
          <Box p={4}>
            <Box bg="bg.default" boxShadow="lg" overflow="hidden">
              {/* Header */}
              <Box 
                bgGradient="to-r" 
                gradientFrom="mint.default" 
                gradientTo="mint.emphasized" 
                px={4} 
                py={6} 
                textAlign="center" 
                colorPalette="mint"
                color="colorPalette.fg"
              >
                <h1 className={css({ fontSize: 'lg', fontWeight: 'bold', mb: 2 })}>
                  Get in Touch
                </h1>
                
                {formData.type === 'property' && formData.content?.state && (
                  <Box display="inline-flex" alignItems="center" px={2} py={1} fontSize="xs" fontWeight="medium" colorPalette="mint" bg="colorPalette.muted" color="colorPalette.text">
                    {formData.content.state === 'for_sale' && '🏠 For Sale'}
                    {formData.content.state === 'sold' && '✅ SOLD'}
                    {formData.content.state === 'coming_soon' && '🔜 Coming Soon'}
                  </Box>
                )}
                
                {formData.content?.price && (
                  <p className={css({ fontSize: 'md', fontWeight: 'semibold', mt: 2 })}>
                    {formData.content.price}
                  </p>
                )}
              </Box>

              {/* Contact Section */}
              <Box p={4}>
                <Box textAlign="center" mb={4}>
                  <Flex 
                    w={12} 
                    h={12} 
                    mx="auto" 
                    mb={2} 
                    colorPalette="mint"
                    bg="colorPalette.subtle" 
                    borderRadius="full" 
                    align="center" 
                    justify="center"
                  >
                    <span className={css({ colorPalette: 'mint', fontSize: 'lg', fontWeight: 'bold', color: 'colorPalette.text' })}>
                      {businessName.charAt(0).toUpperCase()}
                    </span>
                  </Flex>
                  <h2 className={css({ fontSize: 'md', fontWeight: 'semibold', color: 'fg.default' })}>
                    {businessName}
                  </h2>
                </Box>

                {/* Primary CTAs */}
                <Stack gap={2} mb={4}>
                  <Box
                    w="full"
                    colorPalette="mint"
                    bg="colorPalette.default"
                    color="colorPalette.fg"
                    fontWeight="semibold"
                    py={2}
                    px={3}
                    textAlign="center"
                    fontSize="sm"
                  >
                    📱 Add Contact to Phone
                  </Box>
                  
                  <Box
                    w="full"
                    colorPalette="mint"
                    bg="colorPalette.default"
                    color="colorPalette.fg"
                    fontWeight="semibold"
                    py={2}
                    px={3}
                    textAlign="center"
                    fontSize="sm"
                  >
                    📞 Call Now
                  </Box>
                </Stack>

                {/* Custom Message */}
                {formData.content?.custom_message && (
                  <Box mb={4} p={3} bg="bg.subtle">
                    <p className={css({ color: 'fg.muted', fontSize: 'xs' })}>
                      {formData.content.custom_message}
                    </p>
                  </Box>
                )}

                {/* Property Link - Show if property type selected */}
                {formData.type === 'property' && (
                  <Box mb={3}>
                    <Box
                      w="full"
                      bg="bg.muted"
                      color="fg.default"
                      fontWeight="medium"
                      py={2}
                      px={3}
                      textAlign="center"
                      fontSize="sm"
                    >
                      🏠 View Property Details
                    </Box>
                  </Box>
                )}

                {/* Video Link - Show if video type selected */}
                {formData.type === 'video' && (
                  <Box mb={3}>
                    <Box
                      w="full"
                      colorPalette="red"
                      bg="colorPalette.default"
                      color="colorPalette.fg"
                      fontWeight="semibold"
                      py={2}
                      px={3}
                      textAlign="center"
                      fontSize="sm"
                    >
                      ▶️ Watch Video
                    </Box>
                  </Box>
                )}

                {/* Callback Form Preview */}
                <Box borderTopWidth="1px" borderColor="border.default" pt={3}>
                  <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                    Request a Callback
                  </h3>
                  <Stack gap={2}>
                    <Box
                      w="full"
                      px={2}
                      py={1}
                      borderWidth="1px"
                      borderColor="border.default"
                      bg="bg.default"
                      color="fg.muted"
                      fontSize="xs"
                    >
                      Your name
                    </Box>
                    <Box
                      w="full"
                      px={2}
                      py={1}
                      borderWidth="1px"
                      borderColor="border.default"
                      bg="bg.default"
                      color="fg.muted"
                      fontSize="xs"
                    >
                      Your phone number
                    </Box>
                    <Box
                      w="full"
                      colorPalette="mint"
                      bg="colorPalette.default"
                      color="colorPalette.fg"
                      fontWeight="semibold"
                      py={1}
                      px={2}
                      textAlign="center"
                      fontSize="xs"
                    >
                      Request Callback
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Box>

            {/* Footer */}
            <Box textAlign="center" mt={4}>
              <p className={css({ fontSize: '2xs', color: 'fg.muted' })}>
                Powered by FunL.app
              </p>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}