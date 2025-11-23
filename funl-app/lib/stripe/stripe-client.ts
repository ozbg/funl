import Stripe from 'stripe'

/**
 * Server-side Stripe client
 * Used for creating Payment Intents, managing products, and processing webhooks
 * Returns null if STRIPE_SECRET_KEY is not configured
 */
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
      appInfo: {
        name: 'FunL QR Stickers',
        version: '1.0.0',
      },
    })
  : null

/**
 * Helper to ensure Stripe is configured
 * Throws error if used when Stripe is not initialized
 */
export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.')
  }
  return stripe
}

/**
 * Stripe configuration constants
 */
export const STRIPE_CONFIG = {
  currency: 'aud',
  automaticPaymentMethods: {
    enabled: true,
  },
  /**
   * Minimum charge amount in cents (Stripe requirement)
   * For AUD, minimum is $0.50 = 50 cents
   */
  minimumCharge: 50,
}

/**
 * Helper function to convert dollars to cents
 */
export function dollarsToCents(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Helper function to convert cents to dollars
 */
export function centsToDollars(amount: number): number {
  return amount / 100
}

/**
 * Validate amount meets Stripe minimum
 */
export function validateAmount(amountInDollars: number): boolean {
  const cents = dollarsToCents(amountInDollars)
  return cents >= STRIPE_CONFIG.minimumCharge
}
