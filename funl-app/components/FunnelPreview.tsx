'use client'

import React from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import PublicFunnelWithTestimonials from './PublicFunnelWithTestimonials'
import { Funnel, Business } from '@/lib/types'
import { generateVCard } from '@/lib/qr'

interface TestimonialConfig {
  enabled: boolean
  display_count: number
  display_style: 'carousel' | 'grid' | 'list'
  position: 'top' | 'bottom' | 'sidebar'
  minimum_rating: number
  show_featured_only: boolean
  show_share_button: boolean
}

interface FunnelPreviewProps {
  formData: {
    name: string
    type: string
    content: {
      state?: string
      price?: string
      property_url?: string
      video_url?: string
      video_autoplay?: boolean
      custom_message?: string
      property_address?: string
      open_house_time?: string
    }
  }
  businessName?: string
  contactName?: string
  accentColor?: string
  testimonialConfig?: TestimonialConfig | null
}

export default function FunnelPreview({ formData, businessName = 'Your Business', contactName, accentColor, testimonialConfig }: FunnelPreviewProps) {
  // Use a default config with share button enabled when no config is provided
  const effectiveTestimonialConfig = testimonialConfig === null ? {
    enabled: false,
    display_count: 3,
    display_style: 'carousel' as const,
    position: 'bottom' as const,
    minimum_rating: 3,
    show_featured_only: false,
    show_share_button: true
  } : testimonialConfig;
  // Create mock data structures that match the real component's expectations
  // IMPORTANT: Map top-level columns (property_address, open_house_time) correctly
  const mockFunnel: Funnel = {
    id: 'preview-funnel',
    business_id: 'preview-business',
    name: formData.name || 'Preview Funnel',
    type: formData.type as 'contact' | 'property' | 'video' | 'testimonial',
    status: 'active',
    short_url: 'preview',
    content: {
      state: formData.content.state as 'for_sale' | 'sold' | 'coming_soon' | undefined,
      price: formData.content.price,
      property_url: formData.content.property_url,
      video_url: formData.content.video_url,
      video_autoplay: formData.content.video_autoplay,
      custom_message: formData.content.custom_message
    },
    // Map top-level columns from form data
    property_address: formData.content.property_address,
    open_house_time: formData.content.open_house_time,
    wallet_pass_enabled: false, // Preview doesn't need wallet pass
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const mockBusiness: Business = {
    id: 'preview-business',
    email: 'preview@example.com',
    name: businessName || 'Your Business',
    type: 'individual',
    phone: '+61 400 000 000',
    website: 'https://example.com',
    accent_color: accentColor || '#10b981',
    vcard_data: {
      firstName: contactName?.split(' ')[0] || 'John',
      lastName: contactName?.split(' ').slice(1).join(' ') || 'Doe',
      organization: businessName || 'Your Business',
      phone: '+61 400 000 000',
      email: 'preview@example.com',
      website: 'https://example.com'
    },
    subscription_status: 'active',
    subscription_tier: 'pro',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Generate vCard data using the same function as real funnels
  const vCardData = generateVCard({
    firstName: mockBusiness.vcard_data.firstName,
    lastName: mockBusiness.vcard_data.lastName,
    organization: mockBusiness.name,
    phone: mockBusiness.phone || '',
    email: mockBusiness.email,
    website: mockBusiness.website,
  })

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

        {/* Phone Screen - Contains the ACTUAL funnel component */}
        <Box
          w="full"
          h="full"
          overflow="auto"
          position="relative"
          borderRadius="lg"
          className={css({
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none'
          })}
        >
          {/* Render the exact same component that users see */}
          <PublicFunnelWithTestimonials
            funnel={mockFunnel}
            business={mockBusiness}
            vCardData={vCardData}
            previewTestimonialConfig={effectiveTestimonialConfig}
          />
        </Box>
      </Box>
    </Box>
  )
}