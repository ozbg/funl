import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/inventory/alerts
 * Get inventory alerts for low stock, out of stock, and batch depletion
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminCheck } = await authClient
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceClient = await createServiceClient()

  // Get query parameters
  const searchParams = request.nextUrl.searchParams
  const alertType = searchParams.get('type') // 'low_stock', 'out_of_stock', 'batch_depleting', 'all'

  const alerts: Array<{
    type: string
    severity: string
    product_id: string
    product_name: string
    current_stock: number | null
    threshold: number | null
    batch_id?: string
    batch_name?: string
    message: string
  }> = []

  // 1. Check products tracking inventory for low stock
  const { data: products } = await serviceClient
    .from('sellable_products')
    .select('id, name, current_stock, low_stock_threshold, tracks_inventory')
    .eq('tracks_inventory', true)
    .eq('is_active', true)
    .is('deleted_at', null)

  for (const product of products || []) {
    if (product.current_stock === null) continue

    // Out of stock
    if (product.current_stock === 0 && (!alertType || alertType === 'out_of_stock' || alertType === 'all')) {
      alerts.push({
        type: 'out_of_stock',
        severity: 'critical',
        product_id: product.id,
        product_name: product.name,
        current_stock: 0,
        threshold: product.low_stock_threshold,
        message: `${product.name} is out of stock`
      })
    }
    // Low stock
    else if (
      product.low_stock_threshold !== null &&
      product.current_stock > 0 &&
      product.current_stock <= product.low_stock_threshold &&
      (!alertType || alertType === 'low_stock' || alertType === 'all')
    ) {
      alerts.push({
        type: 'low_stock',
        severity: 'warning',
        product_id: product.id,
        product_name: product.name,
        current_stock: product.current_stock,
        threshold: product.low_stock_threshold,
        message: `${product.name} is low on stock (${product.current_stock} remaining, threshold: ${product.low_stock_threshold})`
      })
    }
  }

  // 2. Check batch inventory for depleting batches
  if (!alertType || alertType === 'batch_depleting' || alertType === 'all') {
    const { data: inventory } = await serviceClient
      .from('product_batch_inventory')
      .select(`
        *,
        product:sellable_products(id, name),
        batch:qr_code_batches(id, batch_name, total_quantity)
      `)
      .eq('is_active', true)

    for (const inv of inventory || []) {
      const usagePercent = ((inv.quantity_allocated - inv.quantity_remaining) / inv.quantity_allocated) * 100

      // Warn when batch is 80%+ depleted
      if (usagePercent >= 80 && inv.quantity_remaining > 0) {
        alerts.push({
          type: 'batch_depleting',
          severity: usagePercent >= 95 ? 'warning' : 'info',
          product_id: inv.product_id,
          product_name: inv.product.name,
          current_stock: inv.quantity_remaining,
          threshold: null,
          batch_id: inv.batch_id,
          batch_name: inv.batch.batch_name,
          message: `Batch "${inv.batch.batch_name}" for ${inv.product.name} is ${Math.round(usagePercent)}% depleted (${inv.quantity_remaining} / ${inv.quantity_allocated} remaining)`
        })
      }

      // Critical when batch is fully depleted
      if (inv.quantity_remaining === 0) {
        alerts.push({
          type: 'batch_depleted',
          severity: 'info',
          product_id: inv.product_id,
          product_name: inv.product.name,
          current_stock: 0,
          threshold: null,
          batch_id: inv.batch_id,
          batch_name: inv.batch.batch_name,
          message: `Batch "${inv.batch.batch_name}" for ${inv.product.name} is fully depleted`
        })
      }
    }
  }

  // Sort by severity: critical > warning > info
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  alerts.sort((a, b) => severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder])

  return NextResponse.json({
    alerts,
    summary: {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length
    }
  })
}
