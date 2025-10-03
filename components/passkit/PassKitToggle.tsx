'use client'

/**
 * PassKit Toggle Component
 *
 * Provides a toggle switch to enable/disable Apple Wallet Pass generation for a funnel
 */

import { useState } from 'react'
import type { Funnel } from '@/lib/types'

interface PassKitToggleProps {
  funnel: Funnel
  onToggle: (enabled: boolean) => Promise<void>
  disabled?: boolean
}

export function PassKitToggle({ funnel, onToggle, disabled = false }: PassKitToggleProps) {
  const [isEnabled, setIsEnabled] = useState(funnel.wallet_pass_enabled || false)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    if (disabled || isLoading) return

    setIsLoading(true)
    try {
      const newState = !isEnabled
      await onToggle(newState)
      setIsEnabled(newState)
    } catch (error) {
      console.error('Failed to toggle PassKit:', error)
      // Could show a toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">
          Apple Wallet Pass
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Allow users to add this property to their Apple Wallet for quick access
        </p>
        {isEnabled && (
          <div className="mt-2 flex items-center text-sm text-green-600">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Wallet passes enabled
          </div>
        )}
      </div>

      <div className="flex items-center ml-4">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled || isLoading}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${isEnabled
              ? 'bg-blue-600'
              : 'bg-gray-200'
            }
            ${disabled || isLoading
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
            }
          `}
        >
          <span className="sr-only">
            {isEnabled ? 'Disable' : 'Enable'} Apple Wallet Pass
          </span>
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>

        {isLoading && (
          <div className="ml-2">
            <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}