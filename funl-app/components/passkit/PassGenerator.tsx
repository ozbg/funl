'use client'

/**
 * Pass Generator Component
 *
 * Main component that orchestrates pass generation, preview, and download
 */

import { useState, useCallback } from 'react'
import { PassKitToggle } from './PassKitToggle'
import { PassConfigurationPanel } from './PassConfigurationPanel'
import { PassPreview } from './PassPreview'
import { PassAnalytics } from './PassAnalytics'
import type { Funnel, Business, WalletPassConfig } from '@/lib/types'

interface PassGeneratorProps {
  funnel: Funnel
  business: Business
  onUpdate?: (funnel: Partial<Funnel>) => void
}

export function PassGenerator({ funnel, business, onUpdate }: PassGeneratorProps) {
  const [config, setConfig] = useState<Partial<WalletPassConfig>>(
    funnel.wallet_pass_config as Partial<WalletPassConfig> || {}
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<{
    success: boolean
    passUrl?: string
    serialNumber?: string
    error?: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'configure' | 'analytics'>('configure')

  const handleTogglePassKit = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/passkit/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelId: funnel.id, enabled })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle PassKit')
      }

      const result = await response.json()

      if (onUpdate) {
        onUpdate({ wallet_pass_enabled: enabled })
      }

      // If enabling PassKit for the first time, switch to configuration tab
      if (enabled) {
        setActiveTab('configure')
      }
    } catch (error) {
      console.error('Failed to toggle PassKit:', error)
      throw error
    }
  }

  const handleConfigChange = useCallback((newConfig: Partial<WalletPassConfig>) => {
    setConfig(newConfig)
  }, [])

  const handleSaveConfig = async (newConfig: Partial<WalletPassConfig>) => {
    try {
      const response = await fetch('/api/passkit/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnelId: funnel.id,
          config: newConfig
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      const result = await response.json()

      if (onUpdate) {
        onUpdate({ wallet_pass_config: newConfig })
      }

      setConfig(newConfig)
    } catch (error) {
      console.error('Failed to save configuration:', error)
      throw error
    }
  }

  const handleGeneratePass = async (forceRegenerate = false) => {
    setIsGenerating(true)
    setGenerationResult(null)

    try {
      const response = await fetch('/api/passkit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnelId: funnel.id,
          customization: config,
          forceRegenerate
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate pass')
      }

      setGenerationResult(result)

      if (onUpdate && result.success) {
        onUpdate({
          wallet_pass_last_updated: new Date().toISOString(),
          wallet_pass_download_count: 0
        })
      }
    } catch (error) {
      setGenerationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPass = () => {
    if (generationResult?.passUrl) {
      window.open(generationResult.passUrl, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* PassKit Toggle */}
      <PassKitToggle
        funnel={funnel}
        onToggle={handleTogglePassKit}
        disabled={isGenerating}
      />

      {/* Only show configuration and preview if PassKit is enabled */}
      {funnel.wallet_pass_enabled && (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('configure')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'configure'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Configuration
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'configure' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuration Panel */}
              <div className="space-y-6">
                <PassConfigurationPanel
                  funnelId={funnel.id}
                  initialConfig={config}
                  onConfigChange={handleConfigChange}
                  onSave={handleSaveConfig}
                  disabled={isGenerating}
                />

                {/* Generation Controls */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Generate Pass
                  </h3>

                  <div className="space-y-4">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleGeneratePass(false)}
                        disabled={isGenerating}
                        className={`
                          flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors
                          ${!isGenerating
                            ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        {isGenerating ? 'Generating...' : 'Generate Pass'}
                      </button>

                      <button
                        onClick={() => handleGeneratePass(true)}
                        disabled={isGenerating}
                        className={`
                          px-4 py-2 text-sm font-medium rounded-md border transition-colors
                          ${!isGenerating
                            ? 'border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500'
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        Force Regenerate
                      </button>
                    </div>

                    {/* Generation Result */}
                    {generationResult && (
                      <div className={`p-4 rounded-lg ${
                        generationResult.success
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        {generationResult.success ? (
                          <div>
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-green-800 font-medium">
                                Pass generated successfully!
                              </span>
                            </div>
                            <p className="text-green-700 text-sm mb-3">
                              Serial Number: {generationResult.serialNumber}
                            </p>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleDownloadPass}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              >
                                Download Pass
                              </button>
                              <button
                                onClick={() => navigator.clipboard.writeText(generationResult.passUrl!)}
                                className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200"
                              >
                                Copy Link
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span className="text-red-800 font-medium">
                                Generation failed
                              </span>
                            </div>
                            <p className="text-red-700 text-sm">
                              {generationResult.error}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Instructions */}
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">
                        <strong>Generate Pass:</strong> Create a new pass or use existing one
                      </p>
                      <p>
                        <strong>Force Regenerate:</strong> Create a new pass even if one exists
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div>
                <PassPreview
                  funnel={funnel}
                  business={business}
                  config={config}
                />
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <PassAnalytics funnelId={funnel.id} />
          )}
        </>
      )}

      {/* Setup Instructions (when PassKit is disabled) */}
      {!funnel.wallet_pass_enabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Apple Wallet Pass Setup
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">
                  Enable Apple Wallet Pass to allow your customers to save property information
                  directly to their iPhone or Apple Watch.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Instant access to property details</li>
                  <li>QR code for easy sharing</li>
                  <li>Automatic updates when information changes</li>
                  <li>Professional, branded experience</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}