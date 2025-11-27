import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/products/[id]
 * Get a single product with inventory details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

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

  // Fetch product
  const serviceClient = await createServiceClient()
  const { data: product, error } = await serviceClient
    .from('sellable_products')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Fetch inventory details if product tracks inventory
  let inventoryDetails = null
  if (product.tracks_inventory) {
    const { data: inventory } = await serviceClient
      .from('product_batch_inventory')
      .select(`
        *,
        batch:qr_code_batches(id, batch_name, total_quantity, used_quantity)
      `)
      .eq('product_id', id)
      .eq('is_active', true)

    inventoryDetails = inventory
  }

  return NextResponse.json({
    product,
    inventory: inventoryDetails
  })
}

/**
 * PUT /api/admin/products/[id]
 * Update a product
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

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

  // Get existing product
  const serviceClient = await createServiceClient()
  const { data: oldProduct, error: fetchError } = await serviceClient
    .from('sellable_products')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !oldProduct) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Parse request body
  const body = await request.json()
  const {
    name,
    slug,
    description,
    product_type,
    pricing_tiers,
    available_sizes,
    available_styles,
    size_pricing,
    is_active,
    featured,
    display_order,
    tracks_inventory,
    current_stock,
    low_stock_threshold,
    min_purchase_quantity,
    max_purchase_quantity,
    thumbnail_url,
    images,
    meta_title,
    meta_description,
    meta_keywords,
    reason,
    notes
  } = body

  // Validate reason
  if (!reason || reason.length < 10) {
    return NextResponse.json({
      error: 'Reason is required and must be at least 10 characters'
    }, { status: 400 })
  }

  // Build update data
  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (slug !== undefined) updateData.slug = slug
  if (description !== undefined) updateData.description = description
  if (product_type !== undefined) updateData.product_type = product_type
  if (pricing_tiers !== undefined) updateData.pricing_tiers = pricing_tiers
  if (available_sizes !== undefined) updateData.available_sizes = available_sizes
  if (available_styles !== undefined) updateData.available_styles = available_styles
  if (size_pricing !== undefined) updateData.size_pricing = size_pricing
  if (is_active !== undefined) updateData.is_active = is_active
  if (featured !== undefined) updateData.featured = featured
  if (display_order !== undefined) updateData.display_order = display_order
  if (tracks_inventory !== undefined) updateData.tracks_inventory = tracks_inventory
  if (current_stock !== undefined) updateData.current_stock = current_stock
  if (low_stock_threshold !== undefined) updateData.low_stock_threshold = low_stock_threshold
  if (min_purchase_quantity !== undefined) updateData.min_purchase_quantity = min_purchase_quantity
  if (max_purchase_quantity !== undefined) updateData.max_purchase_quantity = max_purchase_quantity
  if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url
  if (images !== undefined) updateData.images = images
  if (meta_title !== undefined) updateData.meta_title = meta_title
  if (meta_description !== undefined) updateData.meta_description = meta_description
  if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords

  // Update product
  const { data: product, error: updateError } = await serviceClient
    .from('sellable_products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating product:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Determine action type
  let action = 'updated'
  if (is_active !== undefined && is_active !== oldProduct.is_active) {
    action = is_active ? 'activated' : 'deactivated'
  } else if (pricing_tiers !== undefined && JSON.stringify(pricing_tiers) !== JSON.stringify(oldProduct.pricing_tiers)) {
    action = 'price_changed'
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: action,
      p_entity_type: 'product',
      p_entity_id: product.id,
      p_business_id: null,
      p_old_values: oldProduct,
      p_new_values: product,
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null
    })
  } catch (logError) {
    console.error('Failed to log admin action:', logError)
  }

  return NextResponse.json({ product })
}

/**
 * DELETE /api/admin/products/[id]
 * Soft delete a product with safeguard checks
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

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

  // Get reason from body
  const body = await request.json()
  const { reason, notes } = body

  if (!reason || reason.length < 10) {
    return NextResponse.json({
      error: 'Reason is required and must be at least 10 characters'
    }, { status: 400 })
  }

  // Get existing product
  const serviceClient = await createServiceClient()
  const { data: oldProduct, error: fetchError } = await serviceClient
    .from('sellable_products')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !oldProduct) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // SAFEGUARD CHECKS - gather impact data
  const checks = {
    hasOrders: false,
    orderCount: 0,
    hasLinkedBatches: false,
    linkedBatchCount: 0,
    currentStock: oldProduct.current_stock || 0,
    productName: oldProduct.name,
  }

  // Check for orders (any status except cancelled)
  const { count: orderCount } = await serviceClient
    .from('purchase_orders')
    .select('id', { count: 'exact' })
    .eq('product_id', id)
    .neq('status', 'cancelled')

  checks.hasOrders = (orderCount || 0) > 0
  checks.orderCount = orderCount || 0

  // Check for linked batches
  const { count: batchCount } = await serviceClient
    .from('product_batch_inventory')
    .select('id', { count: 'exact' })
    .eq('product_id', id)

  checks.hasLinkedBatches = (batchCount || 0) > 0
  checks.linkedBatchCount = batchCount || 0

  // Soft delete (set deleted_at timestamp and deactivate)
  const { data: product, error: deleteError } = await serviceClient
    .from('sellable_products')
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq('id', id)
    .select()
    .single()

  if (deleteError) {
    console.error('Error deleting product:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'deleted',
      p_entity_type: 'product',
      p_entity_id: product.id,
      p_business_id: null,
      p_old_values: oldProduct,
      p_new_values: product,
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null
    })
  } catch (logError) {
    console.error('Failed to log admin action:', logError)
  }

  return NextResponse.json({
    success: true,
    product,
    checks, // Return check results to frontend for confirmation UI
  })
}
