'use client'

import React from 'react'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'

interface TestimonialConfig {
  enabled: boolean
  display_count: number
  display_style: 'carousel' | 'grid' | 'list'
  position: 'top' | 'bottom' | 'sidebar'
  minimum_rating: number
  show_featured_only: boolean
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
      custom_message?: string
    }
  }
  businessName?: string
  contactName?: string
  testimonialConfig?: TestimonialConfig | null
}

export default function FunnelPreview({ formData, businessName = 'Your Business', contactName, testimonialConfig }: FunnelPreviewProps) {
  // Helper function to determine if this is a property-related funnel
  const isPropertyType = formData.type === 'property-listing' || formData.type === 'property'

  // Helper function to determine if this is a video-related funnel
  const isVideoType = formData.type === 'video-showcase' || formData.type === 'video'

  // Helper function to determine if this is a menu/service type
  const isMenuType = formData.type === 'menu-display'

  // Helper function to determine if this is an appointment type
  const isAppointmentType = formData.type === 'appointment-booking'

  // Helper function to determine if this is a testimonial type
  const isTestimonialType = formData.type === 'testimonial'

  // Sample testimonials for preview
  const sampleTestimonials = [
    {
      name: "Sarah M",
      suburb: "Bondi Beach",
      comment: "Amazing service! Really professional and went above and beyond my expectations.",
      rating: 5
    },
    {
      name: "Mike T",
      suburb: "Surry Hills",
      comment: "Quick response and great quality work. Highly recommend!",
      rating: 5
    },
    {
      name: "Lisa K",
      suburb: "Manly",
      comment: "Very satisfied with the service. Will definitely use again.",
      rating: 4
    }
  ]

  // Testimonial Preview Component
  const TestimonialPreview = ({ position }: { position: 'top' | 'bottom' | 'sidebar' }) => {
    if (!testimonialConfig?.enabled) return null

    const testimonialsToShow = sampleTestimonials.slice(0, Math.min(testimonialConfig.display_count, 3))

    return (
      <Box mb={4} p={3} bg="bg.subtle">
        <Box mb={2} textAlign="center">
          <span className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
            Customer Reviews
          </span>
        </Box>

        {testimonialConfig.display_style === 'carousel' && (
          <Box>
            <Box p={3} bg="bg.default" mb={2}>
              <Box mb={1}>
                <span className={css({ fontSize: '2xs', color: 'yellow.default' })}>
                  {'★'.repeat(testimonialsToShow[0]?.rating || 5)}
                </span>
              </Box>
              <p className={css({ fontSize: '2xs', color: 'fg.default', mb: 1 })}>
                &ldquo;{testimonialsToShow[0]?.comment}&rdquo;
              </p>
              <p className={css({ fontSize: '2xs', color: 'fg.muted' })}>
                - {testimonialsToShow[0]?.name}, {testimonialsToShow[0]?.suburb}
              </p>
            </Box>
            {testimonialsToShow.length > 1 && (
              <Box textAlign="center">
                <span className={css({ fontSize: '2xs', color: 'fg.muted' })}>
                  • • • (showing 1 of {testimonialsToShow.length})
                </span>
              </Box>
            )}
          </Box>
        )}

        {testimonialConfig.display_style === 'grid' && (
          <Stack gap={2}>
            {testimonialsToShow.map((testimonial, index) => (
              <Box key={index} p={2} bg="bg.default">
                <Box mb={1}>
                  <span className={css({ fontSize: '2xs', color: 'yellow.default' })}>
                    {'★'.repeat(testimonial.rating)}
                  </span>
                </Box>
                <p className={css({ fontSize: '2xs', color: 'fg.default', mb: 1 })}>
                  &ldquo;{testimonial.comment.length > 50 ? testimonial.comment.substring(0, 50) + '...' : testimonial.comment}&rdquo;
                </p>
                <p className={css({ fontSize: '2xs', color: 'fg.muted' })}>
                  - {testimonial.name}, {testimonial.suburb}
                </p>
              </Box>
            ))}
          </Stack>
        )}

        {testimonialConfig.display_style === 'list' && (
          <Stack gap={1}>
            {testimonialsToShow.map((testimonial, index) => (
              <Box key={index} p={2} bg="bg.default" display="flex" gap={2}>
                <span className={css({ fontSize: '2xs', color: 'yellow.default', flexShrink: 0 })}>
                  {'★'.repeat(testimonial.rating)}
                </span>
                <Box flex={1}>
                  <p className={css({ fontSize: '2xs', color: 'fg.default' })}>
                    &ldquo;{testimonial.comment.length > 40 ? testimonial.comment.substring(0, 40) + '...' : testimonial.comment}&rdquo; - {testimonial.name}
                  </p>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    )
  }

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
              {/* Top Testimonials */}
              {testimonialConfig?.enabled && testimonialConfig.position === 'top' && (
                <Box px={3} pt={4}>
                  <TestimonialPreview position="top" />
                </Box>
              )}

              {/* Header */}
              <Box px={3} py={6} textAlign="center">
                <h1 className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                  {businessName}
                </h1>
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 6 })}>
                  {contactName || 'Contact Name'}
                </p>
                
                {isPropertyType && formData.content?.state && (
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

              {/* Content Section */}
              <Box px={3} pb={4}>
                {!isTestimonialType ? (
                  <>
                    {/* Primary CTAs for non-testimonial types */}
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

                    {/* Testimonial Button for non-testimonial funnels */}
                    {testimonialConfig?.enabled && (
                      <Box mb={4}>
                        <Box
                          w="full"
                          colorPalette="blue"
                          bg="colorPalette.default"
                          color="colorPalette.fg"
                          fontWeight="semibold"
                          py={2}
                          px={3}
                          textAlign="center"
                          fontSize="xs"
                        >
                          💬 Share Your Experience
                        </Box>
                      </Box>
                    )}

                    {/* Custom Message */}
                    {formData.content?.custom_message && (
                      <Box mb={5} p={3} bg="bg.subtle">
                        <p className={css({ color: 'fg.muted', fontSize: 'xs' })}>
                          {formData.content.custom_message}
                        </p>
                      </Box>
                    )}
                  </>
                ) : (
                  <>
                    {/* Testimonial Form Preview */}
                    <Box mb={5}>
                      <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 3, textAlign: 'center' })}>
                        Share Your Experience
                      </h3>
                      <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 4, textAlign: 'center' })}>
                        We&apos;d love to hear about your experience with {businessName}
                      </p>

                      {/* Custom Message for testimonials */}
                      {formData.content?.custom_message && (
                        <Box mb={4} p={3} bg="bg.subtle">
                          <p className={css({ color: 'fg.muted', fontSize: 'xs', textAlign: 'center' })}>
                            {formData.content.custom_message}
                          </p>
                        </Box>
                      )}
                    </Box>
                  </>
                )}

                {/* Property Link - Show if property type selected */}
                {isPropertyType && (
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
                {isVideoType && (
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

                {/* Menu Display - Show if menu type selected */}
                {isMenuType && (
                  <Box mb={4}>
                    <Box
                      w="full"
                      colorPalette="blue"
                      bg="colorPalette.default"
                      color="colorPalette.fg"
                      fontWeight="semibold"
                      py={2}
                      px={3}
                      textAlign="center"
                      fontSize="sm"
                    >
                      📋 View Menu
                    </Box>
                  </Box>
                )}

                {/* Appointment Booking - Show if appointment type selected */}
                {isAppointmentType && (
                  <Box mb={4}>
                    <Box
                      w="full"
                      colorPalette="purple"
                      bg="colorPalette.default"
                      color="colorPalette.fg"
                      fontWeight="semibold"
                      py={2}
                      px={3}
                      textAlign="center"
                      fontSize="sm"
                    >
                      📅 Book Appointment
                    </Box>
                  </Box>
                )}

                {/* Form Preview */}
                <Box mt={5} borderTopWidth="1px" borderColor="border.default" pt={4}>
                  <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 3 })}>
                    {isTestimonialType ? 'Testimonial Form' :
                     isAppointmentType ? 'Book an Appointment' :
                     isVideoType ? 'Contact for More Information' :
                     isMenuType ? 'Get in Touch' :
                     isPropertyType ? 'Request Property Information' :
                     'Request a Callback'}
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
                      {isTestimonialType ? 'Your name *' : 'Your name'}
                    </Box>
                    {isTestimonialType ? (
                      <>
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
                          Suburb/Location *
                        </Box>
                        <Box
                          w="full"
                          px={2}
                          py={6}
                          borderWidth="1px"
                          borderColor="border.default"
                          bg="bg.default"
                          color="fg.muted"
                          fontSize="xs"
                        >
                          Tell us about your experience... *
                        </Box>
                        {/* Star Rating Preview */}
                        <Box textAlign="center">
                          <Box mb={2}>
                            <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>Rating (optional)</span>
                          </Box>
                          <Box>
                            <span className={css({ fontSize: 'sm', color: 'yellow.default' })}>★★★★★</span>
                          </Box>
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
                          Email (optional)
                        </Box>
                      </>
                    ) : (
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
                    )}
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
                      {isTestimonialType ? 'Submit Testimonial' :
                       isAppointmentType ? 'Book Appointment' :
                       isVideoType ? 'Contact Me' :
                       isMenuType ? 'Contact Us' :
                       isPropertyType ? 'Get Property Info' :
                       'Request Callback'}
                    </Box>
                  </Stack>
                </Box>

                {/* Bottom Testimonials */}
                {testimonialConfig?.enabled && testimonialConfig.position === 'bottom' && (
                  <TestimonialPreview position="bottom" />
                )}
              </Box>
            </Box>

            {/* Sidebar Testimonials */}
            {testimonialConfig?.enabled && testimonialConfig.position === 'sidebar' && (
              <Box px={4} pb={4}>
                <TestimonialPreview position="sidebar" />
              </Box>
            )}

            {/* Footer */}
            <Box textAlign="center" mt={6}>
              <p className={css({ fontSize: '2xs', color: 'fg.muted' })}>
                Powered by funl.au
              </p>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}