import { createClient } from '@/lib/supabase/server'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { SubscriptionsTable } from '@/components/admin/SubscriptionsTable'
import { AssignSubscriptionDialog } from '@/components/admin/AssignSubscriptionDialog'

export default async function SubscriptionsPage() {
  const supabase = await createClient()

  // Fetch subscription plans for the assign dialog
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true })

  // Fetch initial subscriptions data (client component will handle filtering)
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/subscriptions`, {
    cache: 'no-store'
  })
  const { subscriptions, stats } = await response.json()

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            Subscription Management
          </h1>
          <p className={css({ mt: 1, color: 'fg.muted' })}>
            Manage customer subscriptions, plans, and funnel limits
          </p>
        </Box>
        <AssignSubscriptionDialog plans={plans || []} />
      </Flex>

      {/* Stats Cards */}
      <Grid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Active Subscriptions</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'green.600' })}>
            {stats?.total_active || 0}
          </p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Trial Subscriptions</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'blue.600' })}>
            {stats?.total_trialing || 0}
          </p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Canceled</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'gray.600' })}>
            {stats?.total_canceled || 0}
          </p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Monthly Recurring Revenue</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'purple.600' })}>
            ${((stats?.mrr || 0) / 100).toFixed(2)}
          </p>
        </Box>
      </Grid>

      {/* Subscriptions Table */}
      <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <SubscriptionsTable initialSubscriptions={subscriptions || []} plans={plans || []} />
      </Box>
    </Box>
  )
}
