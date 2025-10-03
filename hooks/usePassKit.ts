'use client'

/**
 * PassKit React Hook
 *
 * Custom hook for managing PassKit state and operations
 */

import { useState, useEffect, useCallback } from 'react'
import type { WalletPassConfig } from '@/lib/types'

interface PassKitStatus {
  enabled: boolean
  hasActivePass: boolean
  lastUpdated?: string
  downloadCount: number
  serialNumber?: string
  passUrl?: string
}

interface UsePassKitOptions {
  funnelId: string
  autoFetch?: boolean
}

interface UsePassKitReturn {
  status: PassKitStatus | null
  isLoading: boolean
  error: string | null
  config: Partial<WalletPassConfig>

  // Actions
  togglePassKit: (enabled: boolean) => Promise<void>
  updateConfig: (config: Partial<WalletPassConfig>) => Promise<void>
  generatePass: (forceRegenerate?: boolean) => Promise<{ success: boolean; passUrl?: string; error?: string }>
  refreshStatus: () => Promise<void>

  // Analytics
  analytics: any
  fetchAnalytics: (timeRange?: string) => Promise<void>
}

export function usePassKit({ funnelId, autoFetch = true }: UsePassKitOptions): UsePassKitReturn {
  const [status, setStatus] = useState<PassKitStatus | null>(null)
  const [config, setConfig] = useState<Partial<WalletPassConfig>>({})
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch pass status
  const fetchStatus = useCallback(async () => {
    if (!funnelId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/passkit/generate?funnelId=${funnelId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch pass status')
      }

      const data = await response.json()
      setStatus({
        enabled: data.passEnabled,
        hasActivePass: data.hasActivePass,
        lastUpdated: data.lastUpdated,
        downloadCount: data.downloadCount,
        serialNumber: data.serialNumber,
        passUrl: data.passUrl
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [funnelId])

  // Fetch system configuration
  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/passkit/config')

      if (!response.ok) {
        throw new Error('Failed to fetch configuration')
      }

      const data = await response.json()
      // Set default config based on system capabilities
      setConfig({
        enabled: false,
        backgroundColor: '#ffffff',
        foregroundColor: '#000000',
        showPropertyFeatures: true,
        showPriceHistory: false,
        showOpenHouseTimes: true,
        maxDescriptionLength: 200,
        autoUpdateEnabled: true
      })
    } catch (err) {
      console.error('Failed to fetch config:', err)
    }
  }, [])

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (timeRange = '30d') => {
    if (!funnelId) return

    try {
      const response = await fetch(`/api/passkit/analytics?funnelId=${funnelId}&timeRange=${timeRange}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    }
  }, [funnelId])

  // Toggle PassKit enabled/disabled
  const togglePassKit = useCallback(async (enabled: boolean) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/passkit/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelId, enabled })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle PassKit')
      }

      // Update local status
      setStatus(prev => prev ? { ...prev, enabled } : null)

      // Refresh full status
      await fetchStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [funnelId, fetchStatus])

  // Update pass configuration
  const updateConfig = useCallback(async (newConfig: Partial<WalletPassConfig>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/passkit/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnelId,
          config: newConfig
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update configuration')
      }

      setConfig(prev => ({ ...prev, ...newConfig }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [funnelId])

  // Generate pass
  const generatePass = useCallback(async (forceRegenerate = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/passkit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnelId,
          customization: config,
          forceRegenerate
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate pass')
      }

      // Refresh status after successful generation
      await fetchStatus()

      return result
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error'
      setError(error)
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }, [funnelId, config, fetchStatus])

  // Refresh status (public method)
  const refreshStatus = useCallback(() => fetchStatus(), [fetchStatus])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && funnelId) {
      fetchStatus()
      fetchConfig()
    }
  }, [autoFetch, funnelId, fetchStatus, fetchConfig])

  return {
    status,
    isLoading,
    error,
    config,
    togglePassKit,
    updateConfig,
    generatePass,
    refreshStatus,
    analytics,
    fetchAnalytics
  }
}

/**
 * Hook for PassKit system configuration and capabilities
 */
export function usePassKitSystem() {
  const [systemConfig, setSystemConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSystemConfig = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/passkit/config')

      if (!response.ok) {
        throw new Error('Failed to fetch system configuration')
      }

      const data = await response.json()
      setSystemConfig(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSystemConfig()
  }, [fetchSystemConfig])

  return {
    systemConfig,
    isLoading,
    error,
    refresh: fetchSystemConfig
  }
}