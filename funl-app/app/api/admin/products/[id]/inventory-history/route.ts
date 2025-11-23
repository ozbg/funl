import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/products/[id]/inventory-history
 * View all inventory adjustments for a product
 *
 * Returns:
 * - Product details
 * - All inventory adjustments (chronological)
 * - Summary stats (total received, removed, sold)
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
    .select('id, name, current_stock, tracks_inventory')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Get all inventory adjustments
  const { data: adjustments, error: adjustmentsError } = await serviceClient
    .from('inventory_adjustments')
    .select(`
      id,
      created_at,
      adjustment_type,
      quantity_change,
      quantity_before,
      quantity_after,
      admin_id,
      admin_email,
      reason,
      notes,
      batch_id,
      order_id,
      batch:qr_code_batches(batch_number, name),
      order:purchase_orders(order_number)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (adjustmentsError) {
    console.error('Error fetching inventory adjustments:', adjustmentsError)
    return NextResponse.json({ error: adjustmentsError.message }, { status: 500 })
  }

  // Calculate stats
  const stats = {
    total_received: 0,
    total_removed: 0,
    total_sold: 0,
  }

  adjustments?.forEach((adj) => {
    if (adj.quantity_change > 0) {
      stats.total_received += adj.quantity_change
    } else if (adj.quantity_change < 0) {
      stats.total_removed += Math.abs(adj.quantity_change)
      if (adj.adjustment_type === 'order_fulfilled') {
        stats.total_sold += Math.abs(adj.quantity_change)
      }
    }
  })

  return NextResponse.json({
    product: {
      id: product.id,
      name: product.name,
      current_stock: product.current_stock,
      tracks_inventory: product.tracks_inventory,
    },
    adjustments: adjustments || [],
    stats,
  })
}
