'use client'

import { useEffect } from 'react'
import { useTracking } from '@/hooks/useTracking'
import VCardDownload from './VCardDownload'
import { Funnel, Business } from '@/lib/types'

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
    
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      preferred_time: formData.get('preferred_time') as string,
      message: formData.get('message') as string,
    }

    // TODO: Submit to API
    track('callback_request')
    
    // Reset form
    e.currentTarget.reset()
    alert('Callback request submitted! We\'ll be in touch soon.')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto pt-8 pb-16">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8 text-center text-white">
            {funnel.content?.headline ? (
              <h1 className="text-xl font-bold mb-2">{funnel.content.headline}</h1>
            ) : (
              <h1 className="text-xl font-bold mb-2">Get in Touch</h1>
            )}
            
            {funnel.type === 'property' && funnel.content?.state && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20">
                {funnel.content.state === 'for_sale' && '🏠 For Sale'}
                {funnel.content.state === 'sold' && '✅ SOLD'}
                {funnel.content.state === 'coming_soon' && '🔜 Coming Soon'}
              </div>
            )}
            
            {funnel.content?.price && (
              <p className="text-lg font-semibold mt-2">{funnel.content.price}</p>
            )}
          </div>

          {/* Contact Section */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {business.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{business.name}</h2>
              {business.phone && (
                <p className="text-gray-600 mt-1">{business.phone}</p>
              )}
            </div>

            {/* Primary CTA */}
            <div className="space-y-3 mb-6">
              <VCardDownload
                businessName={business.name}
                vCardData={vCardData}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                onClick={handleVCardDownload}
              >
                📱 Add Contact to Phone
              </VCardDownload>
              
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  onClick={handleCallClick}
                  className="w-full block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
                >
                  📞 Call Now
                </a>
              )}
            </div>

            {/* Custom Message */}
            {funnel.content?.custom_message && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 text-sm">{funnel.content.custom_message}</p>
              </div>
            )}

            {/* Property Link */}
            {funnel.type === 'property' && funnel.content?.property_url && (
              <div className="mb-6">
                <a
                  href={funnel.content.property_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handlePropertyClick}
                  className="w-full block bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg text-center transition-colors"
                >
                  🏠 View Property Details
                </a>
              </div>
            )}

            {/* Video Link */}
            {funnel.type === 'video' && funnel.content?.video_url && (
              <div className="mb-6">
                <a
                  href={funnel.content.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleVideoClick}
                  className="w-full block bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
                >
                  ▶️ Watch Video
                </a>
              </div>
            )}

            {/* Callback Request Form */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request a Callback</h3>
              <form onSubmit={handleCallbackSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Your phone number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <select 
                    name="preferred_time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Best time to call</option>
                    <option value="morning">Morning (9AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 5PM)</option>
                    <option value="evening">Evening (5PM - 8PM)</option>
                  </select>
                </div>
                <div>
                  <textarea
                    name="message"
                    placeholder="Message (optional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                >
                  Request Callback
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Powered by{' '}
            <a href="/" className="text-blue-600 hover:text-blue-500">
              FunL.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}