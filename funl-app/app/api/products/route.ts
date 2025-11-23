import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/products
 * Fetch all active sellable products
 */
export async function GET() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('sellable_products')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Parse JSONB fields and calculate pricing info
  const productsWithPricing = products.map((product) => {
    const pricingTiers = product.pricing_tiers || []
    const lowestPrice = pricingTiers.length > 0
      ? Math.min(...pricingTiers.map((tier: { unit_price: number }) => tier.unit_price))
      : 0

    return {
      ...product,
      lowest_price: lowestPrice,
      in_stock: product.tracks_inventory ? product.current_stock > 0 : true,
      low_stock: product.tracks_inventory ? product.current_stock <= product.low_stock_threshold : false,
    }
  })

  return NextResponse.json({ products: productsWithPricing })
}
