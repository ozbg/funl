import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/products/[id]/pricing-history
 * View pricing changes over time for a product
 *
 * Returns:
 * - Product details
 * - All pricing changes from product_audit_log
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await context.params
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin privileges
  const { data: adminCheck } = await authClient
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  const serviceClient = await createServiceClient()

  // Get product details
  const { data: product, error: productError } = await serviceClient
    .from('sellable_products')
    .select('id, name')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Get pricing change audit logs
  const { data: changes, error: changesError } = await serviceClient
    .from('product_audit_log')
    .select('*')
    .eq('product_id', productId)
    .or('action.eq.price_changed,action.eq.updated')
    .order('created_at', { ascending: false })

  if (changesError) {
    console.error('Error fetching pricing history:', changesError)
    return NextResponse.json({ error: changesError.message }, { status: 500 })
  }

  // Filter to only include changes that affected pricing
  const pricingChanges = changes?.filter((change) => {
    const oldValues = change.old_values || {}
    const newValues = change.new_values || {}

    // Check if pricing_tiers or size_pricing changed
    return (
      JSON.stringify(oldValues.pricing_tiers) !== JSON.stringify(newValues.pricing_tiers) ||
      JSON.stringify(oldValues.size_pricing) !== JSON.stringify(newValues.size_pricing)
    )
  }).map((change) => {
    const oldValues = change.old_values || {}
    const newValues = change.new_values || {}

    return {
      id: change.id,
      created_at: change.created_at,
      admin_email: change.admin_email,
      reason: change.reason,
      notes: change.notes,
      old_pricing_tiers: oldValues.pricing_tiers || [],
      new_pricing_tiers: newValues.pricing_tiers || [],
      old_size_pricing: oldValues.size_pricing || {},
      new_size_pricing: newValues.size_pricing || {},
    }
  }) || []

  return NextResponse.json({
    product: {
      id: product.id,
      name: product.name,
    },
    changes: pricingChanges,
  })
}
