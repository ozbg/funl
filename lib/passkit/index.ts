/**
 * PassKit Module
 *
 * Main entry point for Apple Wallet PassKit functionality
 * Provides a unified interface for pass generation, signing, and management
 */

// Core services
export { PassKitServiceImpl, createPassKitService, type PassKitService } from './service'
export { PassContentMapperImpl, createPassContentMapper, type PassContentMapper } from './mapper'

// Configuration and setup
export {
  getPassKitConfig,
  validatePassKitConfig,
  PASS_TYPES,
  DEFAULT_PASS_FIELDS,
  type PassKitConfig,
  type PassType
} from './config'

// Certificate management
export {
  loadCertificates,
  validateCertificates,
  checkCertificateSetup,
  type CertificateData,
  type CertificateValidation
} from './certificates'

// Utility functions
export {
  generatePassForFunnel,
  validatePassSetup,
  createPassDownloadUrl
} from './utils'