/**
 * PassKit Service Tests
 *
 * Unit tests for the core PassKit service functionality
 */

import { PassKitServiceImpl } from '../service'
import { createPassContentMapper } from '../mapper'
import type { PassGenerationRequest, Funnel, Business } from '../../types'

// Mock data
const mockFunnel: Funnel = {
  id: 'test-funnel-id',
  business_id: 'test-business-id',
  name: 'Test Property Listing',
  type: 'property-listing',
  status: 'active',
  template_id: null,
  qr_code_url: 'https://example.com/qr',
  short_url: 'https://funl.app/f/test',
  content: {
    state: 'for_sale',
    price: '$750,000',
    property_url: 'https://example.com/property',
    custom_message: 'Beautiful family home with modern amenities'
  },
  wallet_pass_enabled: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockBusiness: Business = {
  id: 'test-business-id',
  email: 'test@example.com',
  name: 'Test Real Estate Agency',
  type: 'agency',
  phone: '+1-555-123-4567',
  website: 'https://testrealestate.com',
  vcard_data: {
    firstName: 'John',
    lastName: 'Doe',
    organization: 'Test Real Estate Agency',
    phone: '+1-555-123-4567',
    email: 'john.doe@testrealestate.com',
    website: 'https://testrealestate.com'
  },
  accent_color: '#0066cc',
  subscription_status: 'active',
  subscription_tier: 'pro',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Mock certificates for testing
const mockCertificates = {
  certificate: Buffer.from('mock-certificate'),
  privateKey: Buffer.from('mock-private-key'),
  wwdrCertificate: Buffer.from('mock-wwdr-certificate')
}

// Mock PassKit configuration
const mockConfig = {
  teamIdentifier: 'TEST123456',
  passTypeIdentifier: 'pass.com.test.property',
  organizationName: 'Test Organization',
  certificatePath: 'test/cert.pem',
  keyPath: 'test/key.pem',
  wwdrCertificatePath: 'test/wwdr.pem',
  webServiceURL: 'https://test.com/api/passkit',
  defaultBackgroundColor: '#ffffff',
  defaultForegroundColor: '#000000',
  defaultLabelColor: '#666666',
  maxPassLifetimeDays: 365,
  allowPassUpdates: true,
  enablePushNotifications: true
}

describe('PassKitService', () => {
  let service: PassKitServiceImpl

  beforeEach(() => {
    service = new PassKitServiceImpl(mockConfig)
  })

  describe('validatePassData', () => {
    it('should validate required fields', async () => {
      const validPassData = {
        formatVersion: 1,
        passTypeIdentifier: 'pass.com.test.property',
        serialNumber: 'TEST123',
        teamIdentifier: 'TEST123456',
        organizationName: 'Test Organization',
        description: 'Test Pass',
        authenticationToken: 'test-token'
      }

      const result = await service.validatePassData(validPassData)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid pass data', async () => {
      const invalidPassData = {
        formatVersion: 1,
        // Missing required fields
      }

      const result = await service.validatePassData(invalidPassData as any)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate team identifier format', async () => {
      const invalidTeamId = {
        formatVersion: 1,
        passTypeIdentifier: 'pass.com.test.property',
        serialNumber: 'TEST123',
        teamIdentifier: 'INVALID', // Too short
        organizationName: 'Test Organization',
        description: 'Test Pass',
        authenticationToken: 'test-token'
      }

      const result = await service.validatePassData(invalidTeamId)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('teamIdentifier must be exactly 10 characters')
    })
  })

  describe('generateSerialNumber', () => {
    it('should generate unique serial numbers', () => {
      const serial1 = (service as any).generateSerialNumber()
      const serial2 = (service as any).generateSerialNumber()

      expect(serial1).toBeDefined()
      expect(serial2).toBeDefined()
      expect(serial1).not.toBe(serial2)
      expect(typeof serial1).toBe('string')
      expect(serial1.length).toBeGreaterThan(10)
    })
  })

  describe('generateAuthenticationToken', () => {
    it('should generate secure authentication tokens', () => {
      const token1 = (service as any).generateAuthenticationToken()
      const token2 = (service as any).generateAuthenticationToken()

      expect(token1).toBeDefined()
      expect(token2).toBeDefined()
      expect(token1).not.toBe(token2)
      expect(typeof token1).toBe('string')
      expect(token1.length).toBe(32) // 16 bytes as hex
    })
  })

  describe('createPassData', () => {
    it('should create valid pass data structure', async () => {
      const request: PassGenerationRequest = {
        funnelId: 'test-funnel-id',
        customization: {
          backgroundColor: '#ff0000',
          foregroundColor: '#ffffff'
        }
      }

      const serialNumber = 'TEST123'
      const authToken = 'test-auth-token'

      const passData = await (service as any).createPassData(request, serialNumber, authToken)

      expect(passData.formatVersion).toBe(1)
      expect(passData.serialNumber).toBe(serialNumber)
      expect(passData.authenticationToken).toBe(authToken)
      expect(passData.backgroundColor).toBe('#ff0000')
      expect(passData.foregroundColor).toBe('#ffffff')
      expect(passData.barcodes).toBeDefined()
      expect(passData.barcodes![0].message).toContain(request.funnelId)
    })
  })

  describe('createPlaceholderIcon', () => {
    it('should create valid PNG buffer', async () => {
      const iconBuffer = await (service as any).createPlaceholderIcon()

      expect(iconBuffer).toBeInstanceOf(Buffer)
      expect(iconBuffer.length).toBeGreaterThan(0)

      // Check PNG signature
      const pngSignature = iconBuffer.subarray(0, 8)
      const expectedSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
      expect(pngSignature.equals(expectedSignature)).toBe(true)
    })
  })
})

describe('PassContentMapper', () => {
  let mapper: any

  beforeEach(() => {
    mapper = createPassContentMapper()
  })

  describe('mapFunnelToPassData', () => {
    it('should map property listing funnel correctly', async () => {
      const passData = await mapper.mapFunnelToPassData(mockFunnel, mockBusiness)

      expect(passData.description).toContain(mockBusiness.name)
      expect(passData.organizationName).toBe(mockBusiness.name)
      expect(passData.barcodes).toBeDefined()
      expect(passData.barcodes![0].message).toContain(mockFunnel.id)
      expect(passData.userInfo?.funnelId).toBe(mockFunnel.id)
      expect(passData.userInfo?.funnelType).toBe(mockFunnel.type)
    })

    it('should handle contact card funnel type', async () => {
      const contactFunnel = { ...mockFunnel, type: 'contact-card' as const }
      const passData = await mapper.mapFunnelToPassData(contactFunnel, mockBusiness)

      expect(passData.generic?.primaryFields).toBeDefined()
      expect(passData.generic?.headerFields).toBeDefined()
    })
  })

  describe('mapPropertyListingFields', () => {
    it('should map property content to pass fields', () => {
      const fields = mapper.mapPropertyListingFields(mockFunnel.content, mockBusiness)

      expect(fields).toBeInstanceOf(Array)
      expect(fields.length).toBeGreaterThan(0)

      const priceField = fields.find((f: any) => f.key === 'price')
      expect(priceField?.value).toBe(mockFunnel.content.price)

      const statusField = fields.find((f: any) => f.key === 'status')
      expect(statusField?.value).toBe('For Sale')
    })
  })

  describe('mapContactCardFields', () => {
    it('should map business contact data to pass fields', () => {
      const fields = mapper.mapContactCardFields(mockBusiness)

      expect(fields).toBeInstanceOf(Array)
      expect(fields.length).toBeGreaterThan(0)

      const nameField = fields.find((f: any) => f.key === 'name')
      expect(nameField?.value).toBe('John Doe')

      const phoneField = fields.find((f: any) => f.key === 'phone')
      expect(phoneField?.value).toBe(mockBusiness.vcard_data.phone)
    })
  })

  describe('formatPassField', () => {
    it('should format pass fields correctly', () => {
      const field = mapper.formatPassField('test_key', 'Test Label', 'Test Value')

      expect(field.key).toBe('test_key')
      expect(field.label).toBe('Test Label')
      expect(field.value).toBe('Test Value')
      expect(field.textAlignment).toBe('PKTextAlignmentLeft')
    })
  })
})

// Test utilities
export const createMockPassData = (overrides = {}) => ({
  formatVersion: 1,
  passTypeIdentifier: 'pass.com.test.property',
  serialNumber: 'TEST123',
  teamIdentifier: 'TEST123456',
  organizationName: 'Test Organization',
  description: 'Test Pass',
  authenticationToken: 'test-token',
  backgroundColor: '#ffffff',
  foregroundColor: '#000000',
  ...overrides
})

export const createMockGenerationRequest = (overrides = {}): PassGenerationRequest => ({
  funnelId: 'test-funnel-id',
  forceRegenerate: false,
  ...overrides
})