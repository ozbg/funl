/**
 * PassKit Configuration
 *
 * This module handles Apple Wallet PassKit configuration including:
 * - Apple Developer certificate management
 * - Pass type identifiers
 * - Team identifiers
 * - Cryptographic signing configuration
 */

export interface PassKitConfig {
  // Apple Developer Configuration
  teamIdentifier: string
  passTypeIdentifier: string
  organizationName: string

  // Certificate Paths (relative to project root)
  certificatePath: string
  keyPath: string
  wwdrCertificatePath: string // Apple Worldwide Developer Relations Certificate

  // Web Service Configuration (for pass updates)
  webServiceURL: string

  // Default Pass Settings
  defaultBackgroundColor: string
  defaultForegroundColor: string
  defaultLabelColor: string

  // Pass Generation Settings
  maxPassLifetimeDays: number
  allowPassUpdates: boolean
  enablePushNotifications: boolean
}

/**
 * Environment-specific PassKit configuration
 */
export const getPassKitConfig = (): PassKitConfig => {
  const config: PassKitConfig = {
    // These will be set via environment variables in production
    teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER || 'DEVELOPMENT',
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER || 'pass.com.funl.property',
    organizationName: process.env.APPLE_ORGANIZATION_NAME || 'FunL.app',

    // Certificate paths (will be configured during deployment)
    certificatePath: process.env.PASSKIT_CERTIFICATE_PATH || 'lib/passkit/certificates/pass_certificate.pem',
    keyPath: process.env.PASSKIT_PRIVATE_KEY_PATH || 'lib/passkit/certificates/pass_private_key.pem',
    wwdrCertificatePath: process.env.PASSKIT_WWDR_CERTIFICATE_PATH || 'lib/passkit/certificates/wwdr_certificate.pem',

    // Web service URL for pass updates
    webServiceURL: process.env.PASSKIT_WEB_SERVICE_URL || 'https://your-domain.com/api/passkit',

    // Default visual styling
    defaultBackgroundColor: '#FFFFFF',
    defaultForegroundColor: '#000000',
    defaultLabelColor: '#666666',

    // Pass lifecycle settings
    maxPassLifetimeDays: 365, // 1 year default
    allowPassUpdates: true,
    enablePushNotifications: true,
  }

  return config
}

/**
 * Validates PassKit configuration to ensure all required values are present
 */
export const validatePassKitConfig = (config: PassKitConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!config.teamIdentifier || config.teamIdentifier === 'DEVELOPMENT') {
    errors.push('Apple Team Identifier is required and must be set via APPLE_TEAM_IDENTIFIER environment variable')
  }

  if (!config.passTypeIdentifier || config.passTypeIdentifier.includes('DEVELOPMENT')) {
    errors.push('Pass Type Identifier is required and must be set via APPLE_PASS_TYPE_IDENTIFIER environment variable')
  }

  if (!config.organizationName) {
    errors.push('Organization Name is required')
  }

  if (!config.webServiceURL || config.webServiceURL.includes('your-domain.com')) {
    errors.push('Web Service URL must be configured via PASSKIT_WEB_SERVICE_URL environment variable')
  }

  // Validate team identifier format (should be 10 alphanumeric characters)
  if (config.teamIdentifier.length !== 10 && config.teamIdentifier !== 'DEVELOPMENT') {
    errors.push('Apple Team Identifier must be exactly 10 characters')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Pass type specific configurations
 */
export const PASS_TYPES = {
  PROPERTY_LISTING: 'property-listing',
  CONTACT_CARD: 'contact-card',
  EVENT: 'event',
  GENERIC: 'generic'
} as const

export type PassType = typeof PASS_TYPES[keyof typeof PASS_TYPES]

/**
 * Default pass field configurations for different pass types
 */
export const DEFAULT_PASS_FIELDS = {
  [PASS_TYPES.PROPERTY_LISTING]: {
    headerFields: ['property_address'],
    primaryFields: ['price', 'status'],
    secondaryFields: ['bedrooms', 'bathrooms', 'land_size'],
    auxiliaryFields: ['agent_name', 'agent_phone'],
    backFields: ['property_description', 'agent_email', 'agency_name']
  },
  [PASS_TYPES.CONTACT_CARD]: {
    headerFields: ['organization'],
    primaryFields: ['name'],
    secondaryFields: ['title'],
    auxiliaryFields: ['phone', 'email'],
    backFields: ['website', 'address']
  }
} as const