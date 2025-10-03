/**
 * PassKit Service - Using passkit-generator library
 *
 * Core service for generating and signing Apple Wallet passes (.pkpass files)
 * Uses the battle-tested passkit-generator library instead of custom implementation
 */

import { PKPass } from 'passkit-generator'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { getPassKitConfig, type PassKitConfig } from './config'
import type {
  ApplePassJson,
  PassGenerationRequest,
  PassGenerationResponse
} from '../types'

export interface PassKitService {
  generatePass(request: PassGenerationRequest): Promise<PassGenerationResponse>
}

export class PassKitServiceImpl implements PassKitService {
  private config: PassKitConfig

  constructor(config?: PassKitConfig) {
    this.config = config || getPassKitConfig()
  }

  /**
   * Generates a complete .pkpass file using passkit-generator
   */
  async generatePass(request: PassGenerationRequest): Promise<PassGenerationResponse> {
    try {
      // Generate unique identifiers
      const serialNumber = this.generateSerialNumber()
      const authenticationToken = this.generateAuthenticationToken()

      // Load certificates
      const certificates = {
        wwdr: fs.readFileSync(this.config.wwdrCertificatePath),
        signerCert: fs.readFileSync(this.config.certificatePath),
        signerKey: fs.readFileSync(this.config.keyPath)
      }

      // Get template path - use process.cwd() for Next.js app directory
      const templatePath = path.join(process.cwd(), 'lib', 'passkit', 'templates', 'property-listing.pass')

      // Create pass from template (without webService/authToken for now)
      const pass = await PKPass.from({
        model: templatePath,
        certificates
      }, {
        serialNumber,
        description: request.passData?.description || 'Property Information Pass',
        organizationName: request.passData?.organizationName || this.config.organizationName
        // NOTE: Removed authenticationToken and webServiceURL - they require a working web service
        // which causes iOS to reject the pass if the service isn't running
      })

      // Add barcode if provided
      if (request.passData?.barcodes && request.passData.barcodes.length > 0) {
        const barcode = request.passData.barcodes[0]
        pass.setBarcodes(barcode.message)
      }

      // Add header fields (strip textAlignment as passkit-generator handles it)
      if (request.passData?.generic?.headerFields) {
        for (const field of request.passData.generic.headerFields) {
          const { textAlignment, ...cleanField } = field as any
          pass.headerFields.push(cleanField)
        }
      }

      // Add primary fields
      if (request.passData?.generic?.primaryFields) {
        for (const field of request.passData.generic.primaryFields) {
          const { textAlignment, ...cleanField } = field as any
          pass.primaryFields.push(cleanField)
        }
      }

      // Add secondary fields
      if (request.passData?.generic?.secondaryFields) {
        for (const field of request.passData.generic.secondaryFields) {
          const { textAlignment, ...cleanField } = field as any
          pass.secondaryFields.push(cleanField)
        }
      }

      // Add auxiliary fields
      if (request.passData?.generic?.auxiliaryFields) {
        for (const field of request.passData.generic.auxiliaryFields) {
          const { textAlignment, ...cleanField } = field as any
          pass.auxiliaryFields.push(cleanField)
        }
      }

      // Add back fields
      if (request.passData?.generic?.backFields) {
        for (const field of request.passData.generic.backFields) {
          const { textAlignment, ...cleanField } = field as any
          pass.backFields.push(cleanField)
        }
      }

      // Generate the .pkpass buffer
      const pkpassBuffer = pass.getAsBuffer()

      // Generate pass URL
      const passUrl = `/api/passkit/passes/${serialNumber}.pkpass`

      return {
        success: true,
        passUrl,
        serialNumber,
        passBuffer: pkpassBuffer
      }

    } catch (error) {
      console.error('PassKit generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Generates a unique serial number for the pass
   */
  private generateSerialNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = crypto.randomBytes(3).toString('hex').toUpperCase()
    return `MGAL${timestamp}-${random}`
  }

  /**
   * Generates an authentication token for pass updates
   */
  private generateAuthenticationToken(): string {
    return crypto.randomBytes(16).toString('hex')
  }
}

/**
 * Factory function to create a PassKitService instance
 */
export function createPassKitService(config?: PassKitConfig): PassKitService {
  return new PassKitServiceImpl(config)
}
