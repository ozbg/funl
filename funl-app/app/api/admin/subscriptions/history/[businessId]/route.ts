import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/subscriptions/history/[businessId]
 * View all subscription changes for a business
 *
 * Returns:
 * - Subscription history (all subscription_history records)
 * - Audit logs (all admin actions on subscriptions)
 * Combined and sorted chronologically
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await context.params
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

  // Verify business exists
  const { data: business, error: businessError } = await serviceClient
    .from('businesses')
    .select('id, name, email')
    .eq('id', businessId)
    .single()

  if (businessError || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Get all subscription history records for this business
  const { data: history, error: historyError } = await serviceClient
    .from('subscription_history')
    .select(`
      id,
      subscription_plan_id,
      status,
      billing_period,
      event_type,
      created_at,
      current_period_start,
      current_period_end,
      trial_end,
      cancel_at_period_end,
      canceled_at,
      notes,
      subscription_plan:subscription_plans(
        id,
        name,
        slug,
        funnel_limit,
        price_monthly,
        price_weekly
      ),
      previous_plan:subscription_plans!subscription_history_previous_plan_id_fkey(
        id,
        name,
        slug
      )
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (historyError) {
    console.error('Error fetching subscription history:', historyError)
    return NextResponse.json({ error: historyError.message }, { status: 500 })
  }

  // Get all audit logs for this business's subscriptions
  const { data: auditLogs, error: auditError } = await serviceClient
    .from('subscription_audit_log')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (auditError) {
    console.error('Error fetching audit logs:', auditError)
    // Don't fail the request if audit logs fail
  }

  // Format history entries
  const formattedHistory = history?.map((entry) => ({
    type: 'subscription_event',
    id: entry.id,
    date: entry.created_at,
    event_type: entry.event_type,
    status: entry.status,
    plan: entry.subscription_plan,
    previous_plan: entry.previous_plan || null,
    billing_period: entry.billing_period,
    trial_end: entry.trial_end,
    cancel_at_period_end: entry.cancel_at_period_end,
    canceled_at: entry.canceled_at,
    notes: entry.notes,
  })) || []

  // Format audit log entries
  const formattedAuditLogs = auditLogs?.map((log) => ({
    type: 'admin_action',
    id: log.id,
    date: log.created_at,
    action: log.action,
    admin_email: log.admin_email,
    reason: log.reason,
    notes: log.notes,
    old_values: log.old_values,
    new_values: log.new_values,
  })) || []

  // Combine and sort chronologically
  const combined = [...formattedHistory, ...formattedAuditLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return NextResponse.json({
    business: {
      id: business.id,
      name: business.name,
      email: business.email,
    },
    events: combined,
    summary: {
      total_subscriptions: formattedHistory.length,
      total_admin_actions: formattedAuditLogs.length,
    },
  })
}
