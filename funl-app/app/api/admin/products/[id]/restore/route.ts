import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/products/[id]/restore
 * Restore a soft-deleted product
 */
export async function POST(
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
  const { reason, notes, reactivate } = body

  if (!reason || reason.length < 10) {
    return NextResponse.json({
      error: 'Reason is required and must be at least 10 characters'
    }, { status: 400 })
  }

  // Get existing deleted product
  const serviceClient = await createServiceClient()
  const { data: oldProduct, error: fetchError } = await serviceClient
    .from('sellable_products')
    .select('*')
    .eq('id', id)
    .not('deleted_at', 'is', null)
    .single()

  if (fetchError || !oldProduct) {
    return NextResponse.json({ error: 'Deleted product not found' }, { status: 404 })
  }

  // Restore product (clear deleted_at, optionally reactivate)
  const updateData: { deleted_at: null; is_active?: boolean } = {
    deleted_at: null,
  }

  if (reactivate === true) {
    updateData.is_active = true
  }

  const { data: product, error: restoreError } = await serviceClient
    .from('sellable_products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (restoreError) {
    console.error('Error restoring product:', restoreError)
    return NextResponse.json({ error: restoreError.message }, { status: 500 })
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'restored',
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
  })
}
