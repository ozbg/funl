import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/products/[slug]
 * Get product details by slug
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()

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

  // Calculate pricing info
  const pricingTiers = product.pricing_tiers || []
  const lowestPrice = pricingTiers.length > 0
    ? Math.min(...pricingTiers.map((tier: { unit_price: number }) => tier.unit_price))
    : 0

  const productWithInfo = {
    ...product,
    lowest_price: lowestPrice,
    in_stock: product.tracks_inventory ? product.current_stock > 0 : true,
    low_stock: product.tracks_inventory ? product.current_stock <= product.low_stock_threshold : false,
  }

  return NextResponse.json({ product: productWithInfo })
}
