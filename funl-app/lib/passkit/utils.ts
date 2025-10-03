/**
 * PassKit Utility Functions
 *
 * High-level utility functions that combine PassKit services
 * for common operations like generating passes for funnels
 */

import { createPassKitService } from './service'
import { createPassContentMapper } from './mapper'
import { checkCertificateSetup } from './certificates'
import { validatePassKitConfig, getPassKitConfig } from './config'
import type {
  Funnel,
  Business,
  PassGenerationRequest,
  PassGenerationResponse,
  WalletPassConfig
} from '../types'

/**
 * High-level function to generate a pass for a funnel
 * Combines service, mapper, and database operations
 */
export async function generatePassForFunnel(
  funnel: Funnel,
  business: Business,
  customization?: Partial<WalletPassConfig>
): Promise<PassGenerationResponse> {
  try {
    // Validate setup
    const setupValidation = await validatePassSetup()
    if (!setupValidation.valid) {
      return {
        success: false,
        error: `PassKit setup validation failed: ${setupValidation.errors.join(', ')}`
      }
    }

    // Create services
    const passKitService = createPassKitService()
    const contentMapper = createPassContentMapper()

    // Map funnel content to pass data
    const passData = await contentMapper.mapFunnelToPassData(funnel, business)

    // Create generation request with mapped pass data
    const request: PassGenerationRequest = {
      funnelId: funnel.id,
      customization: customization || funnel.wallet_pass_config as Partial<WalletPassConfig>,
      forceRegenerate: false,
      passData  // Include the mapped pass data
    }

    // Generate the pass
    const result = await passKitService.generatePass(request)

    return result

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Validates that PassKit is properly set up and configured
 */
export async function validatePassSetup(): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
}> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Validate configuration
    const config = getPassKitConfig()
    const configValidation = validatePassKitConfig(config)

    if (!configValidation.valid) {
      errors.push(...configValidation.errors)
    }

    // Check certificate setup
    const certSetup = await checkCertificateSetup()
    if (!certSetup.configured) {
      errors.push(...certSetup.issues)
      warnings.push(...certSetup.recommendations)
    }

    // Environment checks
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.APPLE_TEAM_IDENTIFIER) {
        errors.push('APPLE_TEAM_IDENTIFIER environment variable is required in production')
      }
      if (!process.env.APPLE_PASS_TYPE_IDENTIFIER) {
        errors.push('APPLE_PASS_TYPE_IDENTIFIER environment variable is required in production')
      }
      if (!process.env.PASSKIT_WEB_SERVICE_URL) {
        errors.push('PASSKIT_WEB_SERVICE_URL environment variable is required in production')
      }
    } else {
      warnings.push('Running in development mode - ensure production environment variables are set before deployment')
    }

  } catch (error) {
    errors.push(`Setup validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Creates a secure download URL for a pass
 */
export function createPassDownloadUrl(serialNumber: string, authToken?: string): string {
  const baseUrl = process.env.PASSKIT_WEB_SERVICE_URL || 'https://your-domain.com'
  const url = new URL(`/api/passkit/passes/${serialNumber}.pkpass`, baseUrl)

  if (authToken) {
    url.searchParams.set('auth', authToken)
  }

  return url.toString()
}

/**
 * Validates pass generation prerequisites for a funnel
 */
export function validateFunnelForPassGeneration(funnel: Funnel, business: Business): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Funnel validation
  if (!funnel.id) {
    errors.push('Funnel ID is required')
  }

  if (!funnel.name || funnel.name.trim().length === 0) {
    errors.push('Funnel name is required')
  }

  if (funnel.status !== 'active') {
    warnings.push('Funnel is not active - passes may not function correctly')
  }

  // Business validation
  if (!business.id) {
    errors.push('Business ID is required')
  }

  if (!business.name || business.name.trim().length === 0) {
    errors.push('Business name is required')
  }

  if (!business.vcard_data) {
    errors.push('Business vCard data is required')
  } else {
    if (!business.vcard_data.firstName || !business.vcard_data.lastName) {
      errors.push('Business contact name is required')
    }
    if (!business.vcard_data.organization) {
      errors.push('Business organization name is required')
    }
  }

  // Content validation for property listings
  if (funnel.type === 'property' || funnel.type === 'property-listing') {
    if (!funnel.content?.state) {
      warnings.push('Property status is not set - pass may be incomplete')
    }
    if (!funnel.content?.price) {
      warnings.push('Property price is not set - pass may be incomplete')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Generates a test pass for development and validation
 */
export async function generateTestPass(): Promise<PassGenerationResponse> {
  // Create test data
  const testFunnel: Partial<Funnel> = {
    id: 'test-funnel-id',
    name: 'Test Property Listing',
    type: 'property-listing',
    status: 'active',
    content: {
      state: 'for_sale',
      price: '$750,000',
      custom_message: 'Beautiful family home with modern amenities'
    }
  }

  const testBusiness: Partial<Business> = {
    id: 'test-business-id',
    name: 'Test Real Estate Agency',
    vcard_data: {
      firstName: 'John',
      lastName: 'Doe',
      organization: 'Test Real Estate Agency',
      phone: '+1-555-123-4567',
      email: 'john.doe@testrealestate.com',
      website: 'https://testrealestate.com'
    }
  }

  return generatePassForFunnel(
    testFunnel as Funnel,
    testBusiness as Business
  )
}

/**
 * Estimates the pass file size based on content and assets
 */
export function estimatePassSize(
  hasLogo: boolean = false,
  hasStripImage: boolean = false,
  hasBackgroundImage: boolean = false
): number {
  let estimatedSize = 2048 // Base size for pass.json, manifest, signature

  // Icon files
  estimatedSize += 3 * 4096 // icon.png, icon@2x.png, icon@3x.png

  // Optional images
  if (hasLogo) {
    estimatedSize += 2 * 8192 // logo.png, logo@2x.png
  }

  if (hasStripImage) {
    estimatedSize += 2 * 16384 // strip.png, strip@2x.png
  }

  if (hasBackgroundImage) {
    estimatedSize += 2 * 32768 // background.png, background@2x.png
  }

  return estimatedSize
}

/**
 * Sanitizes text content for pass fields
 */
export function sanitizePassText(text: string, maxLength: number = 100): string {
  return text
    .replace(/[\r\n\t]/g, ' ') // Replace line breaks and tabs with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
    .substring(0, maxLength)
}