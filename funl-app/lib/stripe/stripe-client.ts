import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

/**
 * Server-side Stripe client
 * Used for creating Payment Intents, managing products, and processing webhooks
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
  appInfo: {
    name: 'FunL QR Stickers',
    version: '1.0.0',
  },
})

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
