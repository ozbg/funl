'use client'

import React from 'react'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'

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
  contactName?: string
}

export default function FunnelPreview({ formData, businessName = 'Your Business', contactName }: FunnelPreviewProps) {
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
          w="60px"
          h="8px"
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
              <Box px={3} py={6} textAlign="center">
                <h1 className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                  {businessName}
                </h1>
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 6 })}>
                  {contactName || 'Contact Name'}
                </p>
                
                {formData.type === 'property' && formData.content?.state && (
                  <Box display="inline-flex" alignItems="center" px={2} py={1} fontSize="xs" fontWeight="medium" colorPalette="mint" bg="colorPalette.muted" color="colorPalette.text">
                    {formData.content.state === 'for_sale' && '🏠 For Sale'}
                    {formData.content.state === 'sold' && '✅ SOLD'}
                    {formData.content.state === 'coming_soon' && '🔜 Coming Soon'}
                  </Box>
                )}
                
                {formData.content?.price && (
                  <p className={css({ fontSize: 'sm', fontWeight: 'semibold', mt: 1 })}>
                    {formData.content.price}
                  </p>
                )}
              </Box>

              {/* Contact Section */}
              <Box px={3} pb={4}>
                {/* Primary CTAs */}
                <Stack gap={4} mb={4}>
                  <Box
                    w="full"
                    colorPalette="mint"
                    bg="colorPalette.default"
                    color="colorPalette.fg"
                    fontWeight="semibold"
                    py={2}
                    px={3}
                    textAlign="center"
                    fontSize="xs"
                  >
                    Save {contactName?.split(' ')[0] || 'Contact'}&apos;s Contact
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
                    fontSize="xs"
                  >
                    Call {contactName?.split(' ')[0] || 'Contact'}
                  </Box>
                </Stack>

                {/* Custom Message */}
                {formData.content?.custom_message && (
                  <Box mb={5} p={3} bg="bg.subtle">
                    <p className={css({ color: 'fg.muted', fontSize: 'xs' })}>
                      {formData.content.custom_message}
                    </p>
                  </Box>
                )}

                {/* Property Link - Show if property type selected */}
                {formData.type === 'property' && (
                  <Box mb={4}>
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
                  <Box mb={4}>
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
                <Box mt={5} borderTopWidth="1px" borderColor="border.default" pt={4}>
                  <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 3 })}>
                    Request a Callback
                  </h3>
                  <Stack gap={3}>
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
            <Box textAlign="center" mt={6}>
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