import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/orders
 * Fetch all orders with business and batch details
 */
export async function GET() {
  const supabase = await createClient()

  // Check admin auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch admin status
  const { data: business } = await supabase
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!business?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch orders with business details
  const { data: orders, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      business:businesses(id, business_name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders })
}
