import { createClient } from '@/lib/supabase/server'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { SubscriptionPlanCard } from '@/components/subscription/SubscriptionPlanCard'
import { CurrentSubscriptionPanel } from '@/components/subscription/CurrentSubscriptionPanel'
import { AddonFunnelsPanel } from '@/components/subscription/AddonFunnelsPanel'
import { redirect } from 'next/navigation'

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current subscription
  const { data: currentSub } = await supabase
    .from('subscription_history')
    .select('*, subscription_plan:subscription_plans(*)')
    .eq('business_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Get all available plans
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })

  // Get addon funnels
  const { data: addonFunnels } = await supabase
    .from('subscription_addon_funnels')
    .select('*')
    .eq('business_id', user.id)
    .eq('is_active', true)

  // Get business funnel count
  const { data: business } = await supabase
    .from('businesses')
    .select('funnel_count')
    .eq('id', user.id)
    .single()

  const planLimit = currentSub?.subscription_plan?.funnel_limit || 0
  const addonLimit = addonFunnels?.reduce((sum, addon) => sum + addon.quantity, 0) || 0
  const totalLimit = planLimit + addonLimit
  const currentCount = business?.funnel_count || 0

  return (
    <Box>
      <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default', mb: 6 })}>
        Subscription & Billing
      </h1>

      {/* Current Subscription */}
      <CurrentSubscriptionPanel
        subscription={currentSub}
        funnelUsage={{
          current: currentCount,
          limit: totalLimit,
          plan_limit: planLimit,
          addon_limit: addonLimit,
        }}
      />

      {/* Addon Funnels */}
      {currentSub && (
        <Box mt={6}>
          <AddonFunnelsPanel
            addonFunnels={addonFunnels || []}
            currentPlan={currentSub.subscription_plan}
          />
        </Box>
      )}

      {/* Available Plans */}
      <Box mt={8}>
        <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 4 })}>
          {currentSub ? 'Change Plan' : 'Choose a Plan'}
        </h2>

        <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {plans?.map((plan) => (
            <SubscriptionPlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentSub?.subscription_plan_id === plan.id}
              currentBillingPeriod={currentSub?.billing_period}
            />
          ))}
        </Grid>
      </Box>
    </Box>
  )
}
