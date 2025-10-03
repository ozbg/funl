/**
 * PassKit Service
 *
 * Core service for generating and signing Apple Wallet passes (.pkpass files)
 * This service handles the complete pass generation pipeline including:
 * - Pass.json creation from templates
 * - Asset management (images, icons)
 * - Cryptographic signing with Apple certificates
 * - .pkpass file assembly and delivery
 */

import forge from 'node-forge'
import archiver from 'archiver'
import crypto from 'crypto'
import { Buffer } from 'buffer'
import { getPassKitConfig, type PassKitConfig } from './config'
import { loadCertificates, validateCertificates, type CertificateData } from './certificates'
import type {
  ApplePassJson,
  WalletPassConfig,
  PassGenerationRequest,
  PassGenerationResponse,
  PropertyPassData
} from '../types'

export interface PassKitService {
  generatePass(request: PassGenerationRequest): Promise<PassGenerationResponse>
  signPass(passData: ApplePassJson, assets: Record<string, Buffer>): Promise<Buffer>
  validatePassData(passData: ApplePassJson): Promise<{ valid: boolean; errors: string[] }>
}

export class PassKitServiceImpl implements PassKitService {
  private config: PassKitConfig
  private certificates?: CertificateData

  constructor(config?: PassKitConfig) {
    this.config = config || getPassKitConfig()
  }

  /**
   * Initialize the service by loading and validating certificates
   */
  private async initializeCertificates(): Promise<void> {
    if (this.certificates) return

    try {
      this.certificates = await loadCertificates(this.config)
      const validation = await validateCertificates(this.certificates)

      if (!validation.valid) {
        throw new Error(`Certificate validation failed: ${validation.errors.join(', ')}`)
      }
    } catch (error) {
      throw new Error(`Failed to initialize PassKit certificates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generates a complete .pkpass file for a funnel
   */
  async generatePass(request: PassGenerationRequest): Promise<PassGenerationResponse> {
    try {
      await this.initializeCertificates()

      // Generate unique serial number
      const serialNumber = this.generateSerialNumber()
      const authenticationToken = this.generateAuthenticationToken()

      // Create pass.json structure
      const passData = await this.createPassData(request, serialNumber, authenticationToken)

      // Validate pass data
      const validation = await this.validatePassData(passData)
      if (!validation.valid) {
        return {
          success: false,
          error: `Pass validation failed: ${validation.errors.join(', ')}`
        }
      }

      // Collect pass assets (icons, images, etc.)
      const assets = await this.collectPassAssets(request)

      // Sign and create .pkpass file
      const pkpassBuffer = await this.signPass(passData, assets)

      // Generate temporary URL or save to storage
      const passUrl = await this.storePassFile(pkpassBuffer, serialNumber)

      return {
        success: true,
        passUrl,
        serialNumber
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during pass generation'
      }
    }
  }

  /**
   * Creates the pass.json data structure based on funnel content
   */
  private async createPassData(
    request: PassGenerationRequest,
    serialNumber: string,
    authenticationToken: string
  ): Promise<ApplePassJson> {
    const customization = request.customization || {}

    // Base pass structure
    const passData: ApplePassJson = {
      formatVersion: 1,
      passTypeIdentifier: this.config.passTypeIdentifier,
      serialNumber,
      teamIdentifier: this.config.teamIdentifier,
      organizationName: this.config.organizationName,
      description: 'Property Information Pass',
      authenticationToken,
      webServiceURL: this.config.webServiceURL,

      // Visual styling
      backgroundColor: customization.backgroundColor || this.config.defaultBackgroundColor,
      foregroundColor: customization.foregroundColor || this.config.defaultForegroundColor,
      labelColor: this.config.defaultLabelColor,

      // Pass structure for property listing
      generic: {
        headerFields: [],
        primaryFields: [],
        secondaryFields: [],
        auxiliaryFields: [],
        backFields: []
      },

      // QR code for funnel URL
      barcodes: [{
        message: `https://funl.app/f/${request.funnelId}`,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: 'Scan to view property details'
      }],

      // Expiration
      expirationDate: customization.expirationDate,

      // User info for custom data
      userInfo: {
        funnelId: request.funnelId,
        generatedAt: new Date().toISOString()
      }
    }

    return passData
  }

  /**
   * Collects all assets needed for the pass (icons, images, etc.)
   */
  private async collectPassAssets(request: PassGenerationRequest): Promise<Record<string, Buffer>> {
    const assets: Record<string, Buffer> = {}

    // Default pass icons (these would be actual icon files in production)
    // For now, we'll create placeholder content
    const iconSizes = ['icon.png', 'icon@2x.png', 'icon@3x.png']

    for (const iconName of iconSizes) {
      // In production, load actual icon files
      // For now, create minimal PNG placeholder
      assets[iconName] = await this.createPlaceholderIcon()
    }

    // Logo and strip images if provided
    const customization = request.customization || {}
    if (customization.logoUrl) {
      // In production, fetch and process the logo image
      assets['logo.png'] = await this.createPlaceholderIcon()
      assets['logo@2x.png'] = await this.createPlaceholderIcon()
    }

    if (customization.stripImageUrl) {
      // In production, fetch and process the strip image
      assets['strip.png'] = await this.createPlaceholderIcon()
      assets['strip@2x.png'] = await this.createPlaceholderIcon()
    }

    return assets
  }

  /**
   * Creates a minimal placeholder icon (production should use actual icons)
   */
  private async createPlaceholderIcon(): Promise<Buffer> {
    // Create a minimal 1x1 transparent PNG
    const png = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // Width: 1
      0x00, 0x00, 0x00, 0x01, // Height: 1
      0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: RGBA, Compression: 0, Filter: 0, Interlace: 0
      0x1F, 0x15, 0xC4, 0x89, // CRC
      0x00, 0x00, 0x00, 0x0D, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, // Compressed image data
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ])
    return png
  }

  /**
   * Signs the pass and creates a .pkpass file
   */
  async signPass(passData: ApplePassJson, assets: Record<string, Buffer>): Promise<Buffer> {
    if (!this.certificates) {
      throw new Error('Certificates not initialized')
    }

    // Create pass.json
    const passJson = JSON.stringify(passData, null, 2)
    const passJsonBuffer = Buffer.from(passJson, 'utf8')

    // Create manifest with SHA1 hashes
    const manifest: Record<string, string> = {}
    manifest['pass.json'] = crypto.createHash('sha1').update(passJsonBuffer).digest('hex')

    for (const [filename, buffer] of Object.entries(assets)) {
      manifest[filename] = crypto.createHash('sha1').update(buffer).digest('hex')
    }

    const manifestJson = JSON.stringify(manifest, null, 2)
    const manifestBuffer = Buffer.from(manifestJson, 'utf8')

    // Sign the manifest
    const signature = await this.signManifest(manifestBuffer)

    // Create .pkpass archive
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const archive = archiver('zip', { store: true })

      archive.on('data', (chunk) => chunks.push(chunk))
      archive.on('end', () => resolve(Buffer.concat(chunks)))
      archive.on('error', reject)

      // Add files to archive
      archive.append(passJsonBuffer, { name: 'pass.json' })
      archive.append(manifestBuffer, { name: 'manifest.json' })
      archive.append(signature, { name: 'signature' })

      // Add assets
      for (const [filename, buffer] of Object.entries(assets)) {
        archive.append(buffer, { name: filename })
      }

      archive.finalize()
    })
  }

  /**
   * Signs the manifest using Apple certificates
   */
  private async signManifest(manifestBuffer: Buffer): Promise<Buffer> {
    if (!this.certificates) {
      throw new Error('Certificates not initialized')
    }

    try {
      // Parse certificates
      const passCert = forge.pki.certificateFromPem(this.certificates.certificate.toString())
      const privateKey = forge.pki.privateKeyFromPem(this.certificates.privateKey.toString())
      const wwdrCert = forge.pki.certificateFromPem(this.certificates.wwdrCertificate.toString())

      // Create PKCS#7 signature
      const p7 = forge.pkcs7.createSignedData()
      p7.content = forge.util.createBuffer(manifestBuffer.toString('binary'))

      // Add certificates
      p7.addCertificate(passCert)
      p7.addCertificate(wwdrCert)

      // Add signer
      p7.addSigner({
        key: privateKey,
        certificate: passCert,
        digestAlgorithm: forge.pki.oids.sha1,
        authenticatedAttributes: []
      })

      // Sign
      p7.sign({ detached: true })

      // Convert to DER format
      const der = forge.asn1.toDer(p7.toAsn1()).getBytes()
      return Buffer.from(der, 'binary')

    } catch (error) {
      throw new Error(`Failed to sign manifest: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validates pass data structure
   */
  async validatePassData(passData: ApplePassJson): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Required fields validation
    if (!passData.passTypeIdentifier) errors.push('passTypeIdentifier is required')
    if (!passData.serialNumber) errors.push('serialNumber is required')
    if (!passData.teamIdentifier) errors.push('teamIdentifier is required')
    if (!passData.organizationName) errors.push('organizationName is required')
    if (!passData.description) errors.push('description is required')
    if (!passData.authenticationToken) errors.push('authenticationToken is required')

    // Format validation
    if (passData.teamIdentifier && passData.teamIdentifier.length !== 10) {
      errors.push('teamIdentifier must be exactly 10 characters')
    }

    if (passData.formatVersion !== 1) {
      errors.push('formatVersion must be 1')
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Generates a unique serial number for the pass
   */
  private generateSerialNumber(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `${timestamp}-${random}`.toUpperCase()
  }

  /**
   * Generates a secure authentication token
   */
  private generateAuthenticationToken(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  /**
   * Stores the generated pass file and returns a download URL
   */
  private async storePassFile(pkpassBuffer: Buffer, serialNumber: string): Promise<string> {
    // In production, this would upload to cloud storage (S3, etc.)
    // For now, return a placeholder URL
    return `https://your-domain.com/api/passes/${serialNumber}.pkpass`
  }
}

/**
 * Factory function to create a PassKit service instance
 */
export const createPassKitService = (config?: PassKitConfig): PassKitService => {
  return new PassKitServiceImpl(config)
}