'use client'

/**
 * Pass Preview Component
 *
 * Displays a visual preview of what the Apple Wallet pass will look like
 */

import { useState, useEffect } from 'react'
import type { Funnel, Business, WalletPassConfig } from '@/lib/types'

interface PassPreviewProps {
  funnel: Funnel
  business: Business
  config: Partial<WalletPassConfig>
  className?: string
}

export function PassPreview({ funnel, business, config, className = '' }: PassPreviewProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Mock pass data based on funnel type and config
  const getPassData = () => {
    const backgroundColor = config.backgroundColor || '#ffffff'
    const foregroundColor = config.foregroundColor || '#000000'

    const baseData = {
      backgroundColor,
      foregroundColor,
      organizationName: business.name,
      description: `Property information from ${business.name}`
    }

    switch (funnel.type) {
      case 'property':
      case 'property-listing':
        return {
          ...baseData,
          headerFields: [{ label: 'Organization', value: business.name }],
          primaryFields: [
            { label: 'Price', value: funnel.content?.price || 'Contact for price' },
            { label: 'Status', value: funnel.content?.state || 'Available' }
          ],
          secondaryFields: [
            { label: 'Agent', value: `${business.vcard_data.firstName} ${business.vcard_data.lastName}` }
          ],
          auxiliaryFields: [
            { label: 'Phone', value: business.vcard_data.phone || 'Not provided' }
          ]
        }

      case 'contact':
      case 'contact-card':
        return {
          ...baseData,
          headerFields: [{ label: 'Organization', value: business.vcard_data.organization }],
          primaryFields: [
            { label: 'Name', value: `${business.vcard_data.firstName} ${business.vcard_data.lastName}` }
          ],
          secondaryFields: [
            { label: 'Phone', value: business.vcard_data.phone || 'Not provided' }
          ],
          auxiliaryFields: [
            { label: 'Email', value: business.vcard_data.email || 'Not provided' }
          ]
        }

      default:
        return {
          ...baseData,
          headerFields: [{ label: 'Business', value: business.name }],
          primaryFields: [
            { label: 'Campaign', value: funnel.name }
          ],
          secondaryFields: [
            { label: 'Contact', value: business.vcard_data.phone || 'Not provided' }
          ],
          auxiliaryFields: []
        }
    }
  }

  const passData = getPassData()

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Pass Preview</h3>
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" clipRule="evenodd" />
          </svg>
          Apple Wallet
        </div>
      </div>

      {/* Pass Preview Container */}
      <div className="max-w-sm mx-auto">
        {/* Pass Card */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-300"
          style={{
            backgroundColor: passData.backgroundColor,
            color: passData.foregroundColor,
            minHeight: '200px'
          }}
        >
          {/* Pass Header */}
          <div className="px-4 py-3 border-b border-gray-200 border-opacity-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Logo placeholder */}
                <div className="w-8 h-8 bg-gray-400 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  {passData.headerFields.map((field, index) => (
                    <div key={index} className="text-sm font-medium">
                      {field.value}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-xs opacity-75">
                Wallet
              </div>
            </div>
          </div>

          {/* Pass Content */}
          <div className="p-4 space-y-3">
            {/* Primary Fields */}
            <div className="space-y-2">
              {passData.primaryFields.map((field, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm opacity-75">{field.label}</span>
                  <span className="text-lg font-semibold">{field.value}</span>
                </div>
              ))}
            </div>

            {/* Secondary Fields */}
            {passData.secondaryFields.length > 0 && (
              <div className="border-t border-gray-200 border-opacity-30 pt-3 space-y-1">
                {passData.secondaryFields.map((field, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs opacity-75">{field.label}</span>
                    <span className="text-sm">{field.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Auxiliary Fields */}
            {passData.auxiliaryFields.length > 0 && (
              <div className="border-t border-gray-200 border-opacity-30 pt-3 space-y-1">
                {passData.auxiliaryFields.map((field, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs opacity-75">{field.label}</span>
                    <span className="text-sm">{field.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* QR Code Placeholder */}
            <div className="border-t border-gray-200 border-opacity-30 pt-3 flex justify-center">
              <div className="w-16 h-16 bg-gray-300 rounded-md flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pass Footer */}
          <div className="px-4 py-2 border-t border-gray-200 border-opacity-30 bg-black bg-opacity-5">
            <div className="text-xs opacity-75 text-center">
              Tap to view property details
            </div>
          </div>
        </div>

        {/* Pass Info */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {passData.description}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Updates automatically when property information changes
          </p>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>Background: {config.backgroundColor || '#ffffff'}</div>
          <div>Text Color: {config.foregroundColor || '#000000'}</div>
          <div>Auto Updates: {config.autoUpdateEnabled ? 'Enabled' : 'Disabled'}</div>
          <div>Max Length: {config.maxDescriptionLength || 200} chars</div>
        </div>
      </div>
    </div>
  )
}