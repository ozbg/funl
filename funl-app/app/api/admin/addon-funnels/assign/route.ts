import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface AssignAddonFunnelsRequest {
  business_id: string
  quantity: number
  billing_period: 'weekly' | 'monthly'
  price_override?: number
  start_date?: string
  reason: string
  notes?: string
}

/**
 * POST /api/admin/addon-funnels/assign
 * Manually add addon funnels to a business
 *
 * Request Body:
 * - business_id: UUID of the business
 * - quantity: Number of addon funnels (1-100)
 * - billing_period: 'weekly' or 'monthly'
 * - price_override: Optional custom price per funnel
 * - start_date: Optional start date (defaults to now)
 * - reason: Required reason for audit (min 10 chars)
 * - notes: Optional additional context
 */
export async function POST(request: NextRequest) {
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

  // Parse request body
  let body: AssignAddonFunnelsRequest
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { business_id, quantity, billing_period, price_override, start_date, reason, notes } = body

  // Validate required fields
  if (!business_id || !quantity || !billing_period || !reason) {
    return NextResponse.json(
      { error: 'Missing required fields: business_id, quantity, billing_period, reason' },
      { status: 400 }
    )
  }

  if (reason.length < 10) {
    return NextResponse.json(
      { error: 'Reason must be at least 10 characters for audit trail' },
      { status: 400 }
    )
  }

  if (quantity < 1 || quantity > 100) {
    return NextResponse.json(
      { error: 'Quantity must be between 1 and 100' },
      { status: 400 }
    )
  }

  if (!['weekly', 'monthly'].includes(billing_period)) {
    return NextResponse.json(
      { error: 'billing_period must be "weekly" or "monthly"' },
      { status: 400 }
    )
  }

  const serviceClient = await createServiceClient()

  // Verify business exists
  const { data: business, error: businessError } = await serviceClient
    .from('businesses')
    .select('id, name, email')
    .eq('id', business_id)
    .single()

  if (businessError || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Get business's current subscription
  const { data: currentSub } = await serviceClient
    .from('subscription_history')
    .select('*, subscription_plan:subscription_plans(*)')
    .eq('business_id', business_id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!currentSub) {
    return NextResponse.json(
      { error: 'Business must have an active subscription before adding addon funnels' },
      { status: 400 }
    )
  }

  // Determine price per funnel
  let pricePerFunnel: number
  if (price_override !== undefined && price_override !== null) {
    if (price_override < 0) {
      return NextResponse.json(
        { error: 'price_override must be positive' },
        { status: 400 }
      )
    }
    pricePerFunnel = price_override
  } else {
    // Use default from plan
    const defaultPrice = billing_period === 'weekly'
      ? currentSub.subscription_plan.addon_funnel_price_weekly
      : currentSub.subscription_plan.addon_funnel_price_monthly

    if (!defaultPrice) {
      return NextResponse.json(
        { error: 'Addon funnels not available for this plan. Use price_override to set custom price.' },
        { status: 400 }
      )
    }

    pricePerFunnel = defaultPrice
  }

  // Calculate dates
  const startDateObj = start_date ? new Date(start_date) : new Date()
  const periodLength = billing_period === 'weekly' ? 7 : 30
  const periodEnd = new Date(startDateObj)
  periodEnd.setDate(periodEnd.getDate() + periodLength)

  // Create addon funnel record
  const { data: addonFunnel, error: addonError } = await serviceClient
    .from('subscription_addon_funnels')
    .insert({
      business_id,
      quantity,
      price_per_funnel: pricePerFunnel,
      billing_period,
      is_active: true,
      current_period_start: startDateObj.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      notes: `Admin assigned addon funnels. Reason: ${reason}${notes ? `\n${notes}` : ''}`,
    })
    .select()
    .single()

  if (addonError) {
    console.error('Error creating addon funnel:', addonError)
    return NextResponse.json({ error: addonError.message }, { status: 500 })
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'addon_added',
      p_entity_type: 'subscription',
      p_entity_id: currentSub.id,
      p_business_id: business_id,
      p_old_values: null,
      p_new_values: {
        quantity,
        price_per_funnel: pricePerFunnel,
        billing_period,
        total_monthly_cost: billing_period === 'weekly' ? pricePerFunnel * quantity * 4.33 : pricePerFunnel * quantity,
      },
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null,
    })
  } catch (logError) {
    console.error('Error logging admin action:', logError)
  }

  // TODO: Send notification email
  // await sendEmail({
  //   to: business.email,
  //   subject: 'Additional Funnels Added',
  //   template: 'addon-funnels-assigned',
  //   data: { business, quantity, pricePerFunnel, billing_period }
  // })

  const totalCost = billing_period === 'weekly'
    ? pricePerFunnel * quantity
    : pricePerFunnel * quantity

  return NextResponse.json({
    addon_funnel: addonFunnel,
    message: `Successfully added ${quantity} addon funnel${quantity > 1 ? 's' : ''} to ${business.name}`,
    pricing: {
      price_per_funnel: pricePerFunnel,
      total_cost: totalCost,
      billing_period,
    },
  })
}
