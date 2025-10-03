/**
 * PassKit Hooks Tests
 *
 * Unit tests for PassKit React hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { usePassKit, usePassKitSystem } from '../../hooks/usePassKit'

// Mock fetch
global.fetch = jest.fn()

describe('usePassKit', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePassKit({
      funnelId: 'test-funnel-id',
      autoFetch: false
    }))

    expect(result.current.status).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.config).toEqual({})
  })

  it('should fetch status on mount when autoFetch is true', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          passEnabled: true,
          hasActivePass: true,
          lastUpdated: '2024-01-01T00:00:00Z',
          downloadCount: 5,
          serialNumber: 'TEST123',
          passUrl: '/api/passkit/passes/TEST123.pkpass'
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          passKitEnabled: true,
          setupValid: true
        })
      } as Response)

    const { result } = renderHook(() => usePassKit({
      funnelId: 'test-funnel-id',
      autoFetch: true
    }))

    await waitFor(() => {
      expect(result.current.status).not.toBeNull()
    })

    expect(result.current.status).toEqual({
      enabled: true,
      hasActivePass: true,
      lastUpdated: '2024-01-01T00:00:00Z',
      downloadCount: 5,
      serialNumber: 'TEST123',
      passUrl: '/api/passkit/passes/TEST123.pkpass'
    })
  })

  it('should handle fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => usePassKit({
      funnelId: 'test-funnel-id',
      autoFetch: true
    }))

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })

    expect(result.current.status).toBeNull()
  })

  it('should toggle PassKit successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response)

    // Mock successful status fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        passEnabled: true,
        hasActivePass: false,
        downloadCount: 0
      })
    } as Response)

    const { result } = renderHook(() => usePassKit({
      funnelId: 'test-funnel-id',
      autoFetch: false
    }))

    await act(async () => {
      await result.current.togglePassKit(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/passkit/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ funnelId: 'test-funnel-id', enabled: true })
    })
  })

  it('should handle toggle errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Unauthorized' })
    } as Response)

    const { result } = renderHook(() => usePassKit({
      funnelId: 'test-funnel-id',
      autoFetch: false
    }))

    await expect(
      act(async () => {
        await result.current.togglePassKit(true)
      })
    ).rejects.toThrow('Unauthorized')

    expect(result.current.error).toBe('Unauthorized')
  })

  it('should update configuration', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response)

    const { result } = renderHook(() => usePassKit({
      funnelId: 'test-funnel-id',
      autoFetch: false
    }))

    const newConfig = {
      backgroundColor: '#ff0000',
      foregroundColor: '#ffffff'
    }

    await act(async () => {
      await result.current.updateConfig(newConfig)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/passkit/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funnelId: 'test-funnel-id',
        config: newConfig
      })
    })

    expect(result.current.config).toEqual(expect.objectContaining(newConfig))
  })

  it('should generate pass successfully', async () => {
    // Mock the status fetch first
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        passEnabled: true,
        hasActivePass: false
      })
    } as Response)

    // Mock successful generation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        passUrl: '/api/passkit/passes/TEST123.pkpass',
        serialNumber: 'TEST123'
      })
    } as Response)

    // Mock status refresh after generation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        passEnabled: true,
        hasActivePass: true,
        serialNumber: 'TEST123'
      })
    } as Response)

    const { result } = renderHook(() => usePassKit({
      funnelId: 'test-funnel-id',
      autoFetch: false
    }))

    let generationResult
    await act(async () => {
      generationResult = await result.current.generatePass(false)
    })

    expect(generationResult).toEqual({
      success: true,
      passUrl: '/api/passkit/passes/TEST123.pkpass',
      serialNumber: 'TEST123'
    })
  })

  it('should handle generation errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        success: false,
        error: 'Certificate not found'
      })
    } as Response)

    const { result } = renderHook(() => usePassKit({
      funnelId: 'test-funnel-id',
      autoFetch: false
    }))

    let generationResult
    await act(async () => {
      generationResult = await result.current.generatePass(false)
    })

    expect(generationResult).toEqual({
      success: false,
      error: 'Certificate not found'
    })
  })

  it('should fetch analytics', async () => {
    const mockAnalytics = {
      summary: {
        totalEvents: 10,
        totalDownloads: 5,
        activePassCount: 2
      },
      eventCounts: {
        'download_completed': 5,
        'add_to_wallet': 3
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAnalytics)
    } as Response)

    const { result } = renderHook(() => usePassKit({
      funnelId: 'test-funnel-id',
      autoFetch: false
    }))

    await act(async () => {
      await result.current.fetchAnalytics('30d')
    })

    expect(result.current.analytics).toEqual(mockAnalytics)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/passkit/analytics?funnelId=test-funnel-id&timeRange=30d'
    )
  })

  it('should refresh status manually', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        passEnabled: true,
        hasActivePass: true,
        downloadCount: 10
      })
    } as Response)

    const { result } = renderHook(() => usePassKit({
      funnelId: 'test-funnel-id',
      autoFetch: false
    }))

    await act(async () => {
      await result.current.refreshStatus()
    })

    expect(result.current.status?.downloadCount).toBe(10)
  })
})

describe('usePassKitSystem', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('should fetch system configuration on mount', async () => {
    const mockSystemConfig = {
      passKitEnabled: true,
      setupValid: true,
      setupErrors: [],
      setupWarnings: ['Development mode'],
      supportedPassTypes: ['property-listing', 'contact-card'],
      features: {
        pushNotifications: true,
        passUpdates: true,
        analytics: true
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSystemConfig)
    } as Response)

    const { result } = renderHook(() => usePassKitSystem())

    await waitFor(() => {
      expect(result.current.systemConfig).not.toBeNull()
    })

    expect(result.current.systemConfig).toEqual(mockSystemConfig)
    expect(mockFetch).toHaveBeenCalledWith('/api/passkit/config')
  })

  it('should handle system config fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => usePassKitSystem())

    await waitFor(() => {
      expect(result.current.error).toBe('Server error')
    })

    expect(result.current.systemConfig).toBeNull()
  })

  it('should refresh system config', async () => {
    const mockSystemConfig = {
      passKitEnabled: true,
      setupValid: false,
      setupErrors: ['Certificate expired']
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ passKitEnabled: false })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSystemConfig)
      } as Response)

    const { result } = renderHook(() => usePassKitSystem())

    await waitFor(() => {
      expect(result.current.systemConfig).not.toBeNull()
    })

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.systemConfig).toEqual(mockSystemConfig)
  })
})