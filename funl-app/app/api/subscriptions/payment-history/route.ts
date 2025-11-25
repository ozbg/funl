import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null

/**
 * GET /api/subscriptions/payment-history
 * Get user's payment history from Stripe
 */
export async function GET(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business with stripe_customer_id
    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!business?.stripe_customer_id) {
      return NextResponse.json({ payments: [] })
    }

    // Get payment history from Stripe
    const charges = await stripe.charges.list({
      customer: business.stripe_customer_id,
      limit: 50,
    })

    const payments = charges.data.map(charge => ({
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      created: charge.created * 1000, // Convert to milliseconds
      receipt_url: charge.receipt_url,
      description: charge.description,
    }))

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
