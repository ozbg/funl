'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useTracking } from '@/hooks/useTracking'
import VCardDownload from './VCardDownload'
import { Funnel, Business } from '@/lib/types'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'

interface PublicFunnelClientProps {
  funnel: Funnel
  business: Business
  vCardData: string
}

export default function PublicFunnelClient({ 
  funnel, 
  business, 
  vCardData 
}: PublicFunnelClientProps) {
  const { track } = useTracking(funnel.id)

  // Track page view on mount
  useEffect(() => {
    track('view')
  }, [track])

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

      const result = await response.json()
      
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

  return (
    <Box minH="100vh" bg="bg.subtle">
      <Box maxW="md" mx="auto" pt={8} pb={16}>
        <Box bg="bg.default" boxShadow="lg" overflow="hidden">
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
            {/* Primary CTA */}
            <Stack gap={6}>
              <VCardDownload
                businessName={business.name}
                vCardData={vCardData}
                className={css({
                  colorPalette: 'mint',
                  w: 'full',
                  bg: 'colorPalette.default',
                  color: 'colorPalette.fg',
                  fontWeight: 'semibold',
                  py: 4,
                  px: 6,
                  fontSize: 'lg',
                  textAlign: 'center',
                  transition: 'colors',
                  _hover: {
                    bg: 'colorPalette.emphasized'
                  }
                })}
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
                    colorPalette: 'mint',
                    bg: 'colorPalette.default',
                    color: 'colorPalette.fg',
                    fontWeight: 'semibold',
                    py: 4,
                    px: 6,
                    fontSize: 'lg',
                    textAlign: 'center',
                    transition: 'colors',
                    _hover: {
                      bg: 'colorPalette.emphasized'
                    }
                  })}
                >
                  Call {business.vcard_data?.firstName}
                </a>
              )}
            </Stack>

            {/* Custom Message */}
            {funnel.content?.custom_message && (
              <Box mb={6} p={4} bg="bg.subtle">
                <p className={css({ color: 'fg.muted', fontSize: 'sm' })}>{funnel.content.custom_message}</p>
              </Box>
            )}

            {/* Property Link */}
            {(funnel.type === 'property' || funnel.type === 'property-listing') && funnel.content?.property_url && (
              <Box mb={6}>
                <a
                  href={funnel.content.property_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handlePropertyClick}
                  className={css({
                    w: 'full',
                    display: 'block',
                    bg: 'bg.muted',
                    color: 'fg.default',
                    fontWeight: 'medium',
                    py: 3,
                    px: 4,
                      textAlign: 'center',
                    transition: 'colors',
                    _hover: {
                      bg: 'bg.emphasized'
                    }
                  })}
                >
                  🏠 View Property Details
                </a>
              </Box>
            )}

            {/* Video Link */}
            {funnel.type === 'video' && funnel.content?.video_url && (
              <Box mb={6}>
                <a
                  href={funnel.content.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleVideoClick}
                  className={css({
                    w: 'full',
                    display: 'block',
                    colorPalette: 'red',
                    bg: 'colorPalette.default',
                    color: 'colorPalette.fg',
                    fontWeight: 'semibold',
                    py: 3,
                    px: 4,
                      textAlign: 'center',
                    transition: 'colors',
                    _hover: {
                      bg: 'colorPalette.emphasized'
                    }
                  })}
                >
                  ▶️ Watch Video
                </a>
              </Box>
            )}

            {/* Callback Request Form */}
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
                      colorPalette: 'mint',
                      w: 'full',
                      bg: 'colorPalette.default',
                      color: 'colorPalette.fg',
                      fontWeight: 'semibold',
                      py: 2,
                      px: 4,
                      transition: 'colors',
                      _hover: {
                        bg: 'colorPalette.emphasized'
                      }
                    })}
                  >
                    Request Callback
                  </button>
                </Stack>
              </form>
            </Box>
          </Box>
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