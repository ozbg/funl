/**
 * PassKit Certificate Management
 *
 * This module handles Apple Developer certificate operations including:
 * - Certificate validation and loading from files (local) or env vars (production)
 * - Private key management
 * - WWDR certificate handling
 * - Cryptographic signing preparation
 */

import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { getPassKitConfig, type PassKitConfig } from './config'

export interface CertificateData {
  certificate: Buffer
  privateKey: Buffer
  wwdrCertificate: Buffer
  passphrase?: string
}

export interface CertificateValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Determines if running in production (Vercel/cloud) environment
 */
const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}

/**
 * Loads certificates from environment variables (production/Vercel)
 */
const loadCertificatesFromEnv = (): CertificateData => {
  const certificate = process.env.PASSKIT_CERTIFICATE_PEM
  const privateKey = process.env.PASSKIT_PRIVATE_KEY_PEM
  const wwdrCertificate = process.env.PASSKIT_WWDR_CERTIFICATE_PEM

  if (!certificate) {
    throw new Error('PASSKIT_CERTIFICATE_PEM environment variable is required in production')
  }

  if (!privateKey) {
    throw new Error('PASSKIT_PRIVATE_KEY_PEM environment variable is required in production')
  }

  if (!wwdrCertificate) {
    throw new Error('PASSKIT_WWDR_CERTIFICATE_PEM environment variable is required in production')
  }

  return {
    certificate: Buffer.from(certificate, 'utf-8'),
    privateKey: Buffer.from(privateKey, 'utf-8'),
    wwdrCertificate: Buffer.from(wwdrCertificate, 'utf-8'),
    passphrase: process.env.PASSKIT_PRIVATE_KEY_PASSPHRASE
  }
}

/**
 * Loads certificates from filesystem (local development)
 */
const loadCertificatesFromFiles = async (config: PassKitConfig): Promise<CertificateData> => {
  // Convert relative paths to absolute paths
  const certificatePath = path.resolve(config.certificatePath)
  const keyPath = path.resolve(config.keyPath)
  const wwdrPath = path.resolve(config.wwdrCertificatePath)

  // Check if all certificate files exist
  if (!existsSync(certificatePath)) {
    throw new Error(`Pass certificate not found at: ${certificatePath}`)
  }

  if (!existsSync(keyPath)) {
    throw new Error(`Private key not found at: ${keyPath}`)
  }

  if (!existsSync(wwdrPath)) {
    throw new Error(`WWDR certificate not found at: ${wwdrPath}`)
  }

  // Load certificate files
  const [certificate, privateKey, wwdrCertificate] = await Promise.all([
    readFile(certificatePath),
    readFile(keyPath),
    readFile(wwdrPath)
  ])

  return {
    certificate,
    privateKey,
    wwdrCertificate,
    passphrase: process.env.PASSKIT_PRIVATE_KEY_PASSPHRASE
  }
}

/**
 * Loads Apple Developer certificates
 * - In production (Vercel): Load from environment variables
 * - In local dev: Load from filesystem
 */
export const loadCertificates = async (config?: PassKitConfig): Promise<CertificateData> => {
  try {
    // Production: Load from environment variables
    if (isProduction()) {
      return loadCertificatesFromEnv()
    }

    // Local development: Load from files
    const passKitConfig = config || getPassKitConfig()
    return await loadCertificatesFromFiles(passKitConfig)
  } catch (error) {
    throw new Error(`Failed to load certificates: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validates certificate files and their contents
 */
export const validateCertificates = async (certificates: CertificateData): Promise<CertificateValidation> => {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Basic buffer validation
    if (!certificates.certificate || certificates.certificate.length === 0) {
      errors.push('Pass certificate is empty or invalid')
    }

    if (!certificates.privateKey || certificates.privateKey.length === 0) {
      errors.push('Private key is empty or invalid')
    }

    if (!certificates.wwdrCertificate || certificates.wwdrCertificate.length === 0) {
      errors.push('WWDR certificate is empty or invalid')
    }

    // Check certificate format (PEM format expected)
    const certificateStr = certificates.certificate.toString()
    if (!certificateStr.includes('-----BEGIN CERTIFICATE-----')) {
      errors.push('Pass certificate does not appear to be in PEM format')
    }

    const privateKeyStr = certificates.privateKey.toString()
    if (!privateKeyStr.includes('-----BEGIN PRIVATE KEY-----') &&
        !privateKeyStr.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      errors.push('Private key does not appear to be in PEM format')
    }

    const wwdrStr = certificates.wwdrCertificate.toString()
    if (!wwdrStr.includes('-----BEGIN CERTIFICATE-----')) {
      errors.push('WWDR certificate does not appear to be in PEM format')
    }

    // Note: Advanced certificate validation (expiry, chain validation, etc.)
    // would require additional crypto libraries and is handled by the signing process

    if (errors.length === 0) {
      warnings.push('Certificate validation passed basic checks. Full validation occurs during signing.')
    }

  } catch (error) {
    errors.push(`Certificate validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Checks if certificates are properly configured and accessible
 */
export const checkCertificateSetup = async (): Promise<{
  configured: boolean
  issues: string[]
  recommendations: string[]
}> => {
  const issues: string[] = []
  const recommendations: string[] = []

  try {
    // Production: Check environment variables
    if (isProduction()) {
      if (!process.env.PASSKIT_CERTIFICATE_PEM) {
        issues.push('PASSKIT_CERTIFICATE_PEM environment variable is required in production')
      }
      if (!process.env.PASSKIT_PRIVATE_KEY_PEM) {
        issues.push('PASSKIT_PRIVATE_KEY_PEM environment variable is required in production')
      }
      if (!process.env.PASSKIT_WWDR_CERTIFICATE_PEM) {
        issues.push('PASSKIT_WWDR_CERTIFICATE_PEM environment variable is required in production')
      }

      if (issues.length > 0) {
        recommendations.push('Set certificate environment variables in Vercel dashboard')
        recommendations.push('Include full PEM content with -----BEGIN/END----- markers')
      }

      return { configured: issues.length === 0, issues, recommendations }
    }

    // Local development: Check files
    const config = getPassKitConfig()

    // Check if paths are configured
    if (!config.certificatePath || config.certificatePath === 'lib/passkit/certificates/pass_certificate.pem') {
      issues.push('Pass certificate path not configured. Set PASSKIT_CERTIFICATE_PATH environment variable.')
    }

    if (!config.keyPath || config.keyPath === 'lib/passkit/certificates/pass_private_key.pem') {
      issues.push('Private key path not configured. Set PASSKIT_PRIVATE_KEY_PATH environment variable.')
    }

    if (!config.wwdrCertificatePath || config.wwdrCertificatePath === 'lib/passkit/certificates/wwdr_certificate.pem') {
      issues.push('WWDR certificate path not configured. Set PASSKIT_WWDR_CERTIFICATE_PATH environment variable.')
    }

    // Check if files exist
    const certificatePath = path.resolve(config.certificatePath)
    const keyPath = path.resolve(config.keyPath)
    const wwdrPath = path.resolve(config.wwdrCertificatePath)

    if (!existsSync(certificatePath)) {
      issues.push(`Pass certificate file not found: ${certificatePath}`)
    }

    if (!existsSync(keyPath)) {
      issues.push(`Private key file not found: ${keyPath}`)
    }

    if (!existsSync(wwdrPath)) {
      issues.push(`WWDR certificate file not found: ${wwdrPath}`)
    }

    // Provide setup recommendations
    if (issues.length > 0) {
      recommendations.push('Download your Pass Type ID certificate from Apple Developer Portal')
      recommendations.push('Export the certificate and private key as separate PEM files')
      recommendations.push('Download the Apple Worldwide Developer Relations (WWDR) certificate')
      recommendations.push('Set the appropriate environment variables pointing to these files')

      if (!process.env.PASSKIT_PRIVATE_KEY_PASSPHRASE) {
        recommendations.push('Set PASSKIT_PRIVATE_KEY_PASSPHRASE if your private key is password protected')
      }
    }

  } catch (error) {
    issues.push(`Certificate setup check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    configured: issues.length === 0,
    issues,
    recommendations
  }
}
