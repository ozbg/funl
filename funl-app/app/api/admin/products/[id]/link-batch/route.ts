import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/products/[id]/link-batch
 * Link a QR batch to a product as inventory
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await context.params

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

  // Parse request body
  const body = await request.json()
  const {
    batch_id,
    quantity_allocated,
    price_override_cents,
    reason,
    notes
  } = body

  // Validate required fields
  if (!batch_id || !quantity_allocated || !reason || reason.length < 10) {
    return NextResponse.json({
      error: 'Missing required fields: batch_id, quantity_allocated, reason (min 10 chars)'
    }, { status: 400 })
  }

  if (quantity_allocated < 1) {
    return NextResponse.json({
      error: 'Quantity allocated must be at least 1'
    }, { status: 400 })
  }

  // Verify product exists and tracks inventory
  const serviceClient = await createServiceClient()
  const { data: product, error: productError } = await serviceClient
    .from('sellable_products')
    .select('id, name, tracks_inventory')
    .eq('id', productId)
    .is('deleted_at', null)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  if (!product.tracks_inventory) {
    return NextResponse.json({
      error: 'This product does not track inventory'
    }, { status: 400 })
  }

  // Verify batch exists and has available quantity
  const { data: batch, error: batchError } = await serviceClient
    .from('qr_code_batches')
    .select('id, batch_name, total_quantity, used_quantity')
    .eq('id', batch_id)
    .single()

  if (batchError || !batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
  }

  const availableQuantity = batch.total_quantity - batch.used_quantity
  if (quantity_allocated > availableQuantity) {
    return NextResponse.json({
      error: `Batch only has ${availableQuantity} available QR codes`
    }, { status: 400 })
  }

  // Check if batch is already linked to this product
  const { data: existingLink } = await serviceClient
    .from('product_batch_inventory')
    .select('id')
    .eq('product_id', productId)
    .eq('batch_id', batch_id)
    .single()

  if (existingLink) {
    return NextResponse.json({
      error: 'This batch is already linked to this product'
    }, { status: 400 })
  }

  // Create product-batch inventory link
  const { data: inventory, error: createError } = await serviceClient
    .from('product_batch_inventory')
    .insert({
      product_id: productId,
      batch_id,
      quantity_allocated,
      quantity_remaining: quantity_allocated,
      is_active: true,
      price_override_cents: price_override_cents || null,
      created_by: user.id,
      updated_by: user.id
    })
    .select(`
      *,
      product:sellable_products(id, name),
      batch:qr_code_batches(id, batch_name, total_quantity, used_quantity)
    `)
    .single()

  if (createError) {
    console.error('Error linking batch to product:', createError)
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'batch_linked',
      p_entity_type: 'product',
      p_entity_id: productId,
      p_business_id: null,
      p_old_values: null,
      p_new_values: {
        batch_id,
        batch_name: batch.batch_name,
        quantity_allocated,
        price_override_cents
      },
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null
    })
  } catch (logError) {
    console.error('Failed to log admin action:', logError)
  }

  return NextResponse.json({ inventory }, { status: 201 })
}
