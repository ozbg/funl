import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface PricingRequest {
  quantity: number
  size: string
}

/**
 * POST /api/products/[slug]/pricing
 * Calculate pricing for a product based on quantity and size
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const { quantity, size }: PricingRequest = await request.json()
  const supabase = await createClient()

  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
  }

  const { data: product, error } = await supabase
    .from('sellable_products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Check inventory if tracked
  if (product.tracks_inventory && product.current_stock < quantity) {
    return NextResponse.json(
      { error: `Insufficient stock. Available: ${product.current_stock}` },
      { status: 400 }
    )
  }

  // Check quantity limits
  if (product.min_purchase_quantity && quantity < product.min_purchase_quantity) {
    return NextResponse.json(
      { error: `Minimum order quantity is ${product.min_purchase_quantity}` },
      { status: 400 }
    )
  }

  if (product.max_purchase_quantity && quantity > product.max_purchase_quantity) {
    return NextResponse.json(
      { error: `Maximum order quantity is ${product.max_purchase_quantity}` },
      { status: 400 }
    )
  }

  // Find applicable pricing tier
  const pricingTiers = product.pricing_tiers || []
  const tier = pricingTiers.find(
    (t: { min_quantity: number; max_quantity: number | null }) =>
      quantity >= t.min_quantity && (t.max_quantity === null || quantity <= t.max_quantity)
  )

  if (!tier) {
    return NextResponse.json({ error: 'No pricing tier found for quantity' }, { status: 400 })
  }

  // Get size multiplier
  const sizePricing = product.size_pricing || {}
  const sizeMultiplier = sizePricing[size] || 1.0

  // Calculate pricing
  const unitPrice = tier.unit_price * sizeMultiplier
  const subtotal = unitPrice * quantity
  const tax = subtotal * 0.1 // 10% GST (configurable)
  const shipping = 0 // Free shipping for now (configurable)
  const total = subtotal + tax + shipping

  return NextResponse.json({
    unit_price: unitPrice,
    subtotal,
    tax,
    shipping,
    total,
    quantity,
    size,
    tier: {
      min_quantity: tier.min_quantity,
      max_quantity: tier.max_quantity,
      base_price: tier.unit_price,
    },
    size_multiplier: sizeMultiplier,
  })
}
