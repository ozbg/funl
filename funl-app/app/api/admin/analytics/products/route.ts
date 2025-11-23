import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/analytics/products
 * Get product sales analytics
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

  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get('period') || '30' // days

  const serviceClient = await createServiceClient()

  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - parseInt(period))

  // Get all orders
  const { data: orders } = await serviceClient
    .from('orders')
    .select(`
      *,
      product:sellable_products(id, name)
    `)
    .gte('created_at', periodStart.toISOString())

  // Product sales breakdown
  const productSales: Record<string, {
    name: string
    units_sold: number
    revenue: number
    orders_count: number
  }> = {}

  for (const order of orders || []) {
    const productId = order.product_id
    if (!productSales[productId]) {
      productSales[productId] = {
        name: order.product?.name || 'Unknown',
        units_sold: 0,
        revenue: 0,
        orders_count: 0
      }
    }
    productSales[productId].units_sold += order.quantity || 0
    productSales[productId].revenue += order.total_price || 0
    productSales[productId].orders_count += 1
  }

  // Top products by revenue
  const topProducts = Object.entries(productSales)
    .map(([id, data]) => ({ product_id: id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Order status breakdown
  const ordersByStatus = {
    pending: orders?.filter(o => o.status === 'pending').length || 0,
    completed: orders?.filter(o => o.status === 'completed').length || 0,
    fulfilled: orders?.filter(o => o.status === 'fulfilled').length || 0,
    canceled: orders?.filter(o => o.status === 'canceled').length || 0
  }

  // Calculate totals
  const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0
  const totalUnits = orders?.reduce((sum, o) => sum + (o.quantity || 0), 0) || 0

  return NextResponse.json({
    total_orders: orders?.length || 0,
    total_revenue: totalRevenue,
    total_units_sold: totalUnits,
    average_order_value: orders?.length ? Math.round(totalRevenue / orders.length) : 0,
    orders_by_status: ordersByStatus,
    top_products: topProducts,
    product_sales: productSales,
    period_days: parseInt(period)
  })
}
