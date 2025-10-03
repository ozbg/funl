'use client'

/**
 * Pass Configuration Panel Component
 *
 * Provides a comprehensive interface for configuring Apple Wallet Pass appearance and behavior
 */

import { useState, useEffect } from 'react'
import type { WalletPassConfig } from '@/lib/types'

interface PassConfigurationPanelProps {
  funnelId: string
  initialConfig?: Partial<WalletPassConfig>
  onConfigChange: (config: Partial<WalletPassConfig>) => void
  onSave: (config: Partial<WalletPassConfig>) => Promise<void>
  disabled?: boolean
}

export function PassConfigurationPanel({
  funnelId,
  initialConfig,
  onConfigChange,
  onSave,
  disabled = false
}: PassConfigurationPanelProps) {
  const [config, setConfig] = useState<Partial<WalletPassConfig>>({
    enabled: true,
    backgroundColor: '#ffffff',
    foregroundColor: '#000000',
    showPriceHistory: false,
    showPropertyFeatures: true,
    showOpenHouseTimes: true,
    maxDescriptionLength: 200,
    autoUpdateEnabled: true,
    ...initialConfig
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    onConfigChange(config)
    setHasChanges(true)
  }, [config, onConfigChange])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(config)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateConfig = (updates: Partial<WalletPassConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="space-y-6 p-6 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Pass Configuration
        </h3>
        <button
          onClick={handleSave}
          disabled={disabled || isLoading || !hasChanges}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-colors
            ${!disabled && hasChanges
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Visual Appearance */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Visual Appearance</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={config.backgroundColor || '#ffffff'}
                onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                disabled={disabled}
                className="w-10 h-10 border border-gray-300 rounded-md disabled:opacity-50"
              />
              <input
                type="text"
                value={config.backgroundColor || '#ffffff'}
                onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                disabled={disabled}
                placeholder="#ffffff"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={config.foregroundColor || '#000000'}
                onChange={(e) => updateConfig({ foregroundColor: e.target.value })}
                disabled={disabled}
                className="w-10 h-10 border border-gray-300 rounded-md disabled:opacity-50"
              />
              <input
                type="text"
                value={config.foregroundColor || '#000000'}
                onChange={(e) => updateConfig({ foregroundColor: e.target.value })}
                disabled={disabled}
                placeholder="#000000"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL (optional)
            </label>
            <input
              type="url"
              value={config.logoUrl || ''}
              onChange={(e) => updateConfig({ logoUrl: e.target.value })}
              disabled={disabled}
              placeholder="https://example.com/logo.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Strip Image URL (optional)
            </label>
            <input
              type="url"
              value={config.stripImageUrl || ''}
              onChange={(e) => updateConfig({ stripImageUrl: e.target.value })}
              disabled={disabled}
              placeholder="https://example.com/strip.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Content Options */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Content Options</h4>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.showPropertyFeatures || false}
              onChange={(e) => updateConfig({ showPropertyFeatures: e.target.checked })}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded disabled:opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Show property features</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.showPriceHistory || false}
              onChange={(e) => updateConfig({ showPriceHistory: e.target.checked })}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded disabled:opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Show price history</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.showOpenHouseTimes || false}
              onChange={(e) => updateConfig({ showOpenHouseTimes: e.target.checked })}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded disabled:opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Show open house times</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description Length Limit
          </label>
          <input
            type="number"
            min="50"
            max="1000"
            value={config.maxDescriptionLength || 200}
            onChange={(e) => updateConfig({ maxDescriptionLength: parseInt(e.target.value) })}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:bg-gray-50"
          />
          <p className="mt-1 text-xs text-gray-500">
            Maximum characters for pass description (50-1000)
          </p>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Advanced Options</h4>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.autoUpdateEnabled || false}
              onChange={(e) => updateConfig({ autoUpdateEnabled: e.target.checked })}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded disabled:opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Enable automatic updates</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiration Date (optional)
            </label>
            <input
              type="datetime-local"
              value={config.expirationDate ? new Date(config.expirationDate).toISOString().slice(0, 16) : ''}
              onChange={(e) => updateConfig({ expirationDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Downloads (optional)
            </label>
            <input
              type="number"
              min="1"
              value={config.maxDownloads || ''}
              onChange={(e) => updateConfig({ maxDownloads: e.target.value ? parseInt(e.target.value) : undefined })}
              disabled={disabled}
              placeholder="Unlimited"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            You have unsaved changes. Click "Save Configuration" to apply them.
          </p>
        </div>
      )}
    </div>
  )
}