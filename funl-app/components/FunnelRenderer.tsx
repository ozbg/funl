'use client'

import Link from 'next/link'
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

interface FunnelRendererProps {
  funnel: Funnel
  business: Business
  vCardData: string
  testimonialConfig: FunnelTestimonialConfig | null
  testimonialSettings: TestimonialSettings | null
  showTestimonialForm: boolean
  isPreview?: boolean
  onVCardDownload: () => void
  onCallClick: () => void
  onPropertyClick: () => void
  onVideoClick: () => void
  onTestimonialClick: () => void
  onTestimonialSuccess: () => void
  onTestimonialFormClose: () => void
  onCallbackSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

export default function FunnelRenderer({
  funnel,
  business,
  vCardData,
  testimonialConfig,
  testimonialSettings,
  showTestimonialForm,
  isPreview = false,
  onVCardDownload,
  onCallClick,
  onPropertyClick,
  onVideoClick,
  onTestimonialClick,
  onTestimonialSuccess,
  onTestimonialFormClose,
  onCallbackSubmit
}: FunnelRendererProps) {
  // Get business accent color for dynamic styling
  const accentColor = business.accent_color || '#10b981'

  // If this is a testimonial funnel, show only the testimonial form
  if (funnel.type === 'testimonial') {
    return (
      <Box minH="100vh" bg="bg.default">
        <Box maxW="md" mx="auto" pt={8} pb={16} px={4}>
          <Box bg="bg.default" overflow="hidden" p={6}>
            <TestimonialSubmissionForm
              businessId={business.id}
              funnelId={funnel.id}
              onSuccess={onTestimonialSuccess}
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

            {(funnel.type === 'property' || funnel.type === 'property-listing') && funnel.property_address && (
              <p className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
                {funnel.property_address}
              </p>
            )}

            {funnel.content?.price && (
              <p className={css({ fontSize: 'md', color: 'fg.muted', mb: 3 })}>{funnel.content.price}</p>
            )}

            {(funnel.type === 'property' || funnel.type === 'property-listing') && funnel.open_house_time && (
              <p className={css({ fontSize: 'sm', color: 'fg.subtle', mb: 3 })}>
                Open House {new Date(funnel.open_house_time).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
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
                onClick={onVCardDownload}
              >
                Save {business.vcard_data?.firstName}&apos;s Contact
              </VCardDownload>

              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  onClick={onCallClick}
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
                  onClick={onPropertyClick}
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
              {(funnel.type === 'property-listing') && funnel.wallet_pass_enabled && !isPreview && (
                <a
                  href={`/api/passkit/generate?funnelId=${funnel.id}`}
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
                  onPlay={onVideoClick}
                />
              )}

              {/* Testimonial Button (only show if testimonials are available and share button is enabled) */}
              {testimonialSettings && testimonialConfig?.show_share_button && !isPreview && (
                <button
                  onClick={onTestimonialClick}
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
            {showTestimonialForm && !isPreview && (
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
                    onTestimonialFormClose()
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
                    onClick={onTestimonialFormClose}
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
                    onSuccess={onTestimonialSuccess}
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
            <Box mt={6} borderTopWidth="1px" borderColor="border.default" pt={6}>
              <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 4 })}>Request a Callback</h3>
              <form onSubmit={onCallbackSubmit}>
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
