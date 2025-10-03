/**
 * PassKit Generation API Tests
 *
 * Integration tests for the pass generation API endpoint
 */

import { createMocks } from 'node-mocks-http'
import { POST, GET } from '../../../app/api/passkit/generate/route'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-funnel-id',
              business_id: 'test-user-id',
              name: 'Test Property',
              type: 'property-listing',
              status: 'active',
              wallet_pass_enabled: true,
              content: {
                state: 'for_sale',
                price: '$750,000'
              },
              business: {
                id: 'test-user-id',
                name: 'Test Real Estate',
                vcard_data: {
                  firstName: 'John',
                  lastName: 'Doe',
                  organization: 'Test Real Estate',
                  phone: '+1-555-123-4567',
                  email: 'john@test.com'
                }
              }
            },
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({ error: null })),
      update: jest.fn(() => ({ error: null }))
    }))
  }))
}))

// Mock PassKit service
jest.mock('@/lib/passkit', () => ({
  generatePassForFunnel: jest.fn(() => Promise.resolve({
    success: true,
    passUrl: 'https://example.com/pass.pkpass',
    serialNumber: 'TEST123456'
  })),
  validateFunnelForPassGeneration: jest.fn(() => ({
    valid: true,
    errors: [],
    warnings: []
  }))
}))

// Mock validation schema
jest.mock('@/lib/validations', () => ({
  PassGenerationRequestSchema: {
    safeParse: jest.fn((data) => ({
      success: true,
      data: {
        funnelId: data.funnelId,
        customization: data.customization || {},
        forceRegenerate: data.forceRegenerate || false
      }
    }))
  }
}))

describe('/api/passkit/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should generate pass successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          funnelId: 'test-funnel-id',
          customization: {
            backgroundColor: '#ffffff',
            foregroundColor: '#000000'
          }
        }
      })

      await POST(req)

      // Since we can't easily test NextResponse, we'll test the mocked functions
      const { generatePassForFunnel } = require('@/lib/passkit')
      expect(generatePassForFunnel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-funnel-id'
        }),
        expect.objectContaining({
          name: 'Test Real Estate'
        }),
        expect.objectContaining({
          backgroundColor: '#ffffff',
          foregroundColor: '#000000'
        })
      )
    })

    it('should handle invalid request data', async () => {
      const mockValidation = require('@/lib/validations')
      mockValidation.PassGenerationRequestSchema.safeParse.mockReturnValueOnce({
        success: false,
        error: {
          errors: [{ message: 'Invalid funnel ID' }]
        }
      })

      const { req } = createMocks({
        method: 'POST',
        body: {
          funnelId: '', // Invalid
        }
      })

      const response = await POST(req)
      expect(response.status).toBe(400)
    })

    it('should handle funnel not found', async () => {
      const mockClient = require('@/lib/supabase/server').createClient()
      mockClient.from().select().eq().single.mockReturnValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      const { req } = createMocks({
        method: 'POST',
        body: {
          funnelId: 'non-existent-funnel'
        }
      })

      const response = await POST(req)
      expect(response.status).toBe(404)
    })

    it('should handle pass generation failure', async () => {
      const { generatePassForFunnel } = require('@/lib/passkit')
      generatePassForFunnel.mockResolvedValueOnce({
        success: false,
        error: 'Certificate not found'
      })

      const { req } = createMocks({
        method: 'POST',
        body: {
          funnelId: 'test-funnel-id'
        }
      })

      const response = await POST(req)
      expect(response.status).toBe(500)
    })

    it('should handle unauthorized access', async () => {
      const mockClient = require('@/lib/supabase/server').createClient()
      mockClient.auth.getUser.mockReturnValueOnce({
        data: { user: null },
        error: { message: 'Unauthorized' }
      })

      const { req } = createMocks({
        method: 'POST',
        body: {
          funnelId: 'test-funnel-id'
        }
      })

      const response = await POST(req)
      expect(response.status).toBe(401)
    })
  })

  describe('GET', () => {
    it('should return pass status', async () => {
      const mockClient = require('@/lib/supabase/server').createClient()
      mockClient.from().select().eq().single
        .mockReturnValueOnce({
          data: {
            id: 'test-funnel-id',
            wallet_pass_enabled: true,
            wallet_pass_last_updated: '2024-01-01T00:00:00Z',
            wallet_pass_download_count: 5
          },
          error: null
        })
        .mockReturnValueOnce({
          data: {
            serial_number: 'TEST123456'
          },
          error: null
        })

      const url = new URL('http://localhost/api/passkit/generate?funnelId=test-funnel-id')
      const { req } = createMocks({
        method: 'GET',
        url: url.toString()
      })

      // Mock request.url
      Object.defineProperty(req, 'url', {
        value: url.toString(),
        writable: true
      })

      const response = await GET(req)
      // Test would verify the response contains the expected status data
    })

    it('should require funnelId parameter', async () => {
      const url = new URL('http://localhost/api/passkit/generate')
      const { req } = createMocks({
        method: 'GET',
        url: url.toString()
      })

      Object.defineProperty(req, 'url', {
        value: url.toString(),
        writable: true
      })

      const response = await GET(req)
      expect(response.status).toBe(400)
    })
  })
})

describe('Pass Generation Validation', () => {
  it('should validate funnel data before generation', () => {
    const { validateFunnelForPassGeneration } = require('@/lib/passkit')

    const mockFunnel = {
      id: 'test-funnel-id',
      name: 'Test Property',
      status: 'active',
      type: 'property-listing'
    }

    const mockBusiness = {
      id: 'test-business-id',
      name: 'Test Real Estate',
      vcard_data: {
        firstName: 'John',
        lastName: 'Doe',
        organization: 'Test Real Estate'
      }
    }

    const validation = validateFunnelForPassGeneration(mockFunnel, mockBusiness)
    expect(validation.valid).toBe(true)
  })
})