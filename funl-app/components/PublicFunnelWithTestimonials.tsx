'use client'

import { useEffect, useState } from 'react'
import { useTracking } from '@/hooks/useTracking'
import FunnelRenderer from './FunnelRenderer'
import { Funnel, Business } from '@/lib/types'
import type { DisplayStyle, DisplayPosition } from '@/lib/database.types'

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

  // Debug logging
  console.log('PublicFunnel render - testimonialConfig:', testimonialConfig)
  console.log('PublicFunnel render - testimonialSettings:', testimonialSettings)

  return (
    <FunnelRenderer
      funnel={funnel}
      business={business}
      vCardData={vCardData}
      testimonialConfig={testimonialConfig}
      testimonialSettings={testimonialSettings}
      showTestimonialForm={showTestimonialForm}
      isPreview={previewTestimonialConfig !== undefined}
      onVCardDownload={handleVCardDownload}
      onCallClick={handleCallClick}
      onPropertyClick={handlePropertyClick}
      onVideoClick={handleVideoClick}
      onTestimonialClick={handleTestimonialClick}
      onTestimonialSuccess={handleTestimonialSuccess}
      onTestimonialFormClose={() => setShowTestimonialForm(false)}
      onCallbackSubmit={handleCallbackSubmit}
    />
  )
}