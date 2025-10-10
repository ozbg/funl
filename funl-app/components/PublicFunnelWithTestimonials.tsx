'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTracking } from '@/hooks/useTracking'
import VCardDownload from './VCardDownload'
import TestimonialDisplay from './testimonials/TestimonialDisplay'
import TestimonialSubmissionForm from './testimonials/TestimonialSubmissionForm'
import { VideoPlayer } from './VideoPlayer'
import { Funnel, Business } from '@/lib/types'
import type { DisplayStyle, DisplayPosition } from '@/lib/database.types'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'

interface FunnelTestimonialConfig {
  enabled: boolean
  display_count: number
  display_style: DisplayStyle
  position: DisplayPosition
  minimum_rating: number
  show_featured_only: boolean
  show_share_button: boolean
  theme_override?: {
    background_color?: string
    text_color?: string
    accent_color?: string
    border_radius?: number
    font_size?: string
  }
}

interface TestimonialSettings {
  require_email: boolean
  require_rating: boolean
  min_comment_length: number
  max_comment_length: number
}

interface PublicFunnelWithTestimonialsProps {
  funnel: Funnel
  business: Business
  vCardData: string
  previewTestimonialConfig?: FunnelTestimonialConfig | null
}

export default function PublicFunnelWithTestimonials({
  funnel,
  business,
  vCardData,
  previewTestimonialConfig
}: PublicFunnelWithTestimonialsProps) {
  const { track } = useTracking(funnel.id)
  const [testimonialConfig, setTestimonialConfig] = useState<FunnelTestimonialConfig | null>(previewTestimonialConfig !== undefined ? previewTestimonialConfig : null)
  const [testimonialSettings, setTestimonialSettings] = useState<TestimonialSettings | null>(null)
  const [showTestimonialForm, setShowTestimonialForm] = useState(false)

  // Track page view on mount
  useEffect(() => {
    track('view')
  }, [track])

  // Fetch testimonial configuration (skip if preview config provided)
  useEffect(() => {
    // Skip fetching if we have preview config
    if (previewTestimonialConfig !== undefined) {
      return
    }

    const fetchTestimonialConfig = async () => {
      try {
        console.log('Fetching testimonial config for funnel:', funnel.id)

        // Fetch funnel testimonial config
        const configResponse = await fetch(`/api/funnels/${funnel.id}/testimonials?public=true`)
        console.log('Config response status:', configResponse.status)

        if (configResponse.ok) {
          const configData = await configResponse.json()
          console.log('Testimonial config data:', configData)
          setTestimonialConfig(configData.data)
        }

        // Fetch testimonial settings for the business
        const settingsResponse = await fetch(`/api/testimonials/settings?business_id=${business.id}`)
        console.log('Settings response status:', settingsResponse.status)

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          console.log('Testimonial settings data:', settingsData)
          setTestimonialSettings(settingsData.data)
        }
      } catch (error) {
        console.error('Error fetching testimonial config:', error)
      }
    }

    // Always fetch testimonial config for all funnels to check if testimonials are enabled
    fetchTestimonialConfig()
  }, [funnel.id, business.id, previewTestimonialConfig])

  const handleVCardDownload = () => {
    track('vcard_download')
  }

  const handleCallClick = () => {
    track('link_click', { link_type: 'phone' })
  }

  const handlePropertyClick = () => {
    track('link_click', { link_type: 'property' })
  }

  const handleVideoClick = () => {
    track('link_click', { link_type: 'video' })
  }

  const handleTestimonialClick = () => {
    track('link_click', { link_type: 'testimonial_form' })
    setShowTestimonialForm(true)
  }

  const handleTestimonialSuccess = () => {
    track('testimonial_submit')
    setShowTestimonialForm(false)
  }

  const handleCallbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const formDataObj = {
      funnelId: funnel.id,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      preferred_time: formData.get('preferred_time') as string,
      message: formData.get('message') as string,
    }

    try {
      const response = await fetch('/api/callback-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataObj)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit callback request')
      }

      // Track successful submission
      track('callback_request')

      // Reset form
      if (e.currentTarget) {
        e.currentTarget.reset()
      }
      alert('Callback request submitted! We\'ll be in touch soon.')

    } catch (error) {
      console.error('Failed to submit callback request:', error)
      alert('Sorry, there was an error submitting your request. Please try again.')
    }
  }

  // If this is a testimonial funnel, show only the testimonial form
  if (funnel.type === 'testimonial') {
    return (
      <Box minH="100vh" bg="bg.default">
        <Box maxW="md" mx="auto" pt={8} pb={16} px={4}>
          <Box bg="bg.default" overflow="hidden" p={6}>
            <TestimonialSubmissionForm
              businessId={business.id}
              funnelId={funnel.id}
              onSuccess={handleTestimonialSuccess}
              settings={testimonialSettings || undefined}
            />
          </Box>

          {/* Footer */}
          <Box textAlign="center" mt={8}>
            <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
              Powered by{' '}
              <Link
                href="/"
                className={css({
                  colorPalette: 'mint',
                  color: 'colorPalette.default',
                  _hover: { color: 'colorPalette.emphasized' }
                })}
              >
                funl.au
              </Link>
            </p>
          </Box>
        </Box>
      </Box>
    )
  }

  // Regular funnel with testimonials integration
  // Debug logging
  console.log('PublicFunnel render - testimonialConfig:', testimonialConfig)
  console.log('PublicFunnel render - testimonialSettings:', testimonialSettings)

  // Get business accent color for dynamic styling
  const accentColor = business.accent_color || '#10b981'

  return (
    <Box minH="100vh" bg="bg.default">
      <Box maxW="md" mx="auto" pt={8} pb={16}>
        <Box bg="bg.default" overflow="hidden">
          {/* Top Testimonials */}
          {testimonialConfig?.enabled && testimonialConfig.position === 'top' && (
            <TestimonialDisplay
              businessId={business.id}
              config={testimonialConfig}
            />
          )}

          {/* Header */}
          <Box px={6} py={8} textAlign="center">
            <h1 className={css({ fontSize: 'xl', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
              {business.name}
            </h1>
            <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 4 })}>
              {business.vcard_data?.firstName} {business.vcard_data?.lastName}
            </p>

            {(funnel.type === 'property' || funnel.type === 'property-listing') && funnel.content?.state && (
              <Box display="inline-flex" alignItems="center" px={4} py={1.5} borderRadius="full" fontSize="lg" fontWeight="semibold" colorPalette="mint" bg="colorPalette.muted" color="colorPalette.text" mb={3}>
                {funnel.content.state === 'for_sale' && 'For Sale'}
                {funnel.content.state === 'sold' && 'SOLD'}
                {funnel.content.state === 'coming_soon' && 'Coming Soon'}
              </Box>
            )}

            {(funnel.type === 'property' || funnel.type === 'property-listing') && funnel.content?.property_address && (
              <p className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
                {funnel.content.property_address}
              </p>
            )}

            {funnel.content?.price && (
              <p className={css({ fontSize: 'md', color: 'fg.muted', mb: 3 })}>{funnel.content.price}</p>
            )}
          </Box>

          {/* Contact Section */}
          <Box px={6} pb={6}>
            <Stack gap={6}>
              <VCardDownload
                businessName={business.name}
                vCardData={vCardData}
                className={css({
                  w: 'full',
                  fontWeight: 'semibold',
                  py: 4,
                  px: 6,
                  fontSize: 'lg',
                  textAlign: 'center',
                  transition: 'colors',
                  color: 'white'
                })}
                style={{
                  backgroundColor: accentColor,
                }}
                onClick={handleVCardDownload}
              >
                Save {business.vcard_data?.firstName}&apos;s Contact
              </VCardDownload>

              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  onClick={handleCallClick}
                  className={css({
                    w: 'full',
                    display: 'block',
                    fontWeight: 'semibold',
                    py: 4,
                    px: 6,
                    fontSize: 'lg',
                    textAlign: 'center',
                    transition: 'colors',
                    color: 'white'
                  })}
                  style={{
                    backgroundColor: accentColor,
                  }}
                >
                  Call {business.vcard_data?.firstName}
                </a>
              )}

              {/* Property Link */}
              {(funnel.type === 'property' || funnel.type === 'property-listing') && funnel.content?.property_url && (
                <a
                  href={funnel.content.property_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handlePropertyClick}
                  className={css({
                    w: 'full',
                    display: 'block',
                    fontWeight: 'semibold',
                    py: 4,
                    px: 6,
                    fontSize: 'lg',
                    textAlign: 'center',
                    transition: 'colors',
                    color: 'white'
                  })}
                  style={{
                    backgroundColor: accentColor,
                  }}
                >
                  View Property Details
                </a>
              )}

              {/* Apple Wallet Pass */}
              {(funnel.type === 'property-listing') && funnel.wallet_pass_enabled && (
                <a
                  href={`/api/passkit/generate?funnelId=${funnel.id}`}
                  onClick={(e) => {
                    track('wallet_pass_download')
                  }}
                  className={css({
                    w: 'full',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    fontWeight: 'semibold',
                    py: 4,
                    px: 6,
                    fontSize: 'lg',
                    textAlign: 'center',
                    transition: 'colors',
                    color: 'white',
                    textDecoration: 'none'
                  })}
                  style={{
                    backgroundColor: '#000',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.5 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM12.5 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.33 13 8.5 13 7 12.33 7 11.5zM14.5 10c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"/>
                  </svg>
                  Add to Apple Wallet
                </a>
              )}

              {/* Video Player */}
              {(funnel.type === 'video' || funnel.type === 'video-showcase' || funnel.type === 'property' || funnel.type === 'property-listing') && funnel.content?.video_url && (
                <VideoPlayer
                  videoUrl={funnel.content.video_url}
                  autoPlay={funnel.content.video_autoplay}
                  accentColor={accentColor}
                  onPlay={handleVideoClick}
                />
              )}

              {/* Testimonial Button (only show if testimonials are available and share button is enabled) */}
              {testimonialSettings && testimonialConfig?.show_share_button && (
                <button
                  onClick={handleTestimonialClick}
                  className={css({
                    w: 'full',
                    fontWeight: 'semibold',
                    py: 4,
                    px: 6,
                    fontSize: 'lg',
                    transition: 'colors',
                    color: 'white'
                  })}
                  style={{
                    backgroundColor: accentColor,
                  }}
                >
                  💬 Share Your Experience
                </button>
              )}
            </Stack>

            {/* Testimonial Form Modal */}
            {showTestimonialForm && (
              <Box
                position="fixed"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bg="rgba(0, 0, 0, 0.5)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                p={4}
                zIndex={50}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowTestimonialForm(false)
                  }
                }}
              >
                <Box
                  bg="bg.default"
                  maxW="md"
                  w="full"
                  maxH="90vh"
                  overflowY="auto"
                  p={6}
                  position="relative"
                >
                  <button
                    onClick={() => setShowTestimonialForm(false)}
                    className={css({
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      p: 2,
                      borderRadius: 'full',
                      _hover: { bg: 'bg.muted' }
                    })}
                  >
                    ✕
                  </button>
                  <TestimonialSubmissionForm
                    businessId={business.id}
                    funnelId={funnel.id}
                    onSuccess={handleTestimonialSuccess}
                    settings={testimonialSettings || undefined}
                  />
                </Box>
              </Box>
            )}

            {/* Custom Message */}
            {funnel.content?.custom_message && (
              <Box mb={6} p={4} bg="bg.subtle">
                <p className={css({ color: 'fg.muted', fontSize: 'sm' })}>{funnel.content.custom_message}</p>
              </Box>
            )}



            {/* Middle Testimonials */}
            {testimonialConfig?.enabled && testimonialConfig.position === 'bottom' && (
              <Box mb={6}>
                <TestimonialDisplay
                  businessId={business.id}
                  config={testimonialConfig}
                />
              </Box>
            )}

            {/* Callback Request Form */}
            {/* Callback Request Form - always shown for non-testimonial funnels */}
            <Box mt={6} borderTopWidth="1px" borderColor="border.default" pt={6}>
                <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 4 })}>Request a Callback</h3>
                <form onSubmit={handleCallbackSubmit}>
                  <Stack gap={4}>
                    <Box>
                      <input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        required
                        className={css({
                          w: 'full',
                          px: 3,
                          py: 2,
                          borderWidth: '1px',
                          borderColor: 'border.default',
                          bg: 'bg.default',
                          color: 'fg.default',
                          _focus: {
                            outline: 'none',
                            ringWidth: '2',
                            ringColor: 'mint.default'
                          }
                        })}
                      />
                    </Box>
                    <Box>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Your phone number"
                        required
                        className={css({
                          w: 'full',
                          px: 3,
                          py: 2,
                          borderWidth: '1px',
                          borderColor: 'border.default',
                          bg: 'bg.default',
                          color: 'fg.default',
                          _focus: {
                            outline: 'none',
                            ringWidth: '2',
                            ringColor: 'mint.default'
                          }
                        })}
                      />
                    </Box>
                    <Box>
                      <select
                        name="preferred_time"
                        className={css({
                          w: 'full',
                          px: 3,
                          py: 2.5,
                          borderWidth: '1px',
                          borderColor: 'border.default',
                          bg: 'bg.default',
                          color: 'fg.default',
                          h: '42px',
                          _focus: {
                            outline: 'none',
                            ringWidth: '2',
                            ringColor: 'mint.default'
                          }
                        })}
                      >
                        <option value="">Best time to call</option>
                        <option value="morning">Morning (9AM - 12PM)</option>
                        <option value="afternoon">Afternoon (12PM - 5PM)</option>
                        <option value="evening">Evening (5PM - 8PM)</option>
                      </select>
                    </Box>
                    <Box>
                      <textarea
                        name="message"
                        placeholder="Message (optional)"
                        rows={3}
                        className={css({
                          w: 'full',
                          px: 3,
                          py: 2,
                          borderWidth: '1px',
                          borderColor: 'border.default',
                          bg: 'bg.default',
                          color: 'fg.default',
                          _focus: {
                            outline: 'none',
                            ringWidth: '2',
                            ringColor: 'mint.default'
                          }
                        })}
                      />
                    </Box>
                    <button
                      type="submit"
                      className={css({
                        w: 'full',
                        fontWeight: 'semibold',
                        py: 4,
                        px: 6,
                        fontSize: 'lg',
                        transition: 'colors',
                        color: 'white'
                      })}
                      style={{
                        backgroundColor: accentColor,
                      }}
                    >
                      Request Callback
                    </button>
                  </Stack>
                </form>
              </Box>
          </Box>

          {/* Sidebar Testimonials */}
          {testimonialConfig?.enabled && testimonialConfig.position === 'sidebar' && (
            <Box px={6} pb={6}>
              <TestimonialDisplay
                businessId={business.id}
                config={testimonialConfig}
              />
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box textAlign="center" mt={8}>
          <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
            Powered by{' '}
            <Link
              href="/"
              className={css({
                _hover: { opacity: 0.8 }
              })}
              style={{ color: accentColor }}
            >
              funl.au
            </Link>
          </p>
        </Box>
      </Box>
    </Box>
  )
}