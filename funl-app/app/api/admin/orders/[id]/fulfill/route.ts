import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/orders/[id]/fulfill
 * Mark an order as shipped or delivered
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  // Use regular client to check auth
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: business } = await authClient
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!business?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action, tracking_number, notes } = await request.json()

  if (!['ship', 'deliver'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Update order
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (action === 'ship') {
    updates.status = 'shipped'
    updates.shipped_at = new Date().toISOString()
    if (tracking_number) updates.tracking_number = tracking_number
  } else if (action === 'deliver') {
    updates.status = 'delivered'
    updates.delivered_at = new Date().toISOString()
  }

  if (notes) updates.notes = notes

  // Use service client to bypass RLS for updating orders
  const serviceClient = await createServiceClient()
  const { data: order, error } = await serviceClient
    .from('purchase_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ order })
}
