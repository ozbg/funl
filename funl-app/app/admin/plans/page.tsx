import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { PlansTable } from '@/components/admin/PlansTable'
import { CreatePlanDialog } from '@/components/admin/CreatePlanDialog'
import { getPlansWithStats } from '@/lib/admin/analytics'

export default async function AdminPlansPage() {
  // Fetch plans data
  const { plans, stats } = await getPlansWithStats()

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            Subscription Plans
          </h1>
          <p className={css({ mt: 1, color: 'fg.muted' })}>
            Manage subscription plans, pricing, and features
          </p>
        </Box>
        <CreatePlanDialog />
      </Flex>

      {/* Stats Cards */}
      <Grid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Total Plans</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'fg.default' })}>
            {stats?.total_plans || 0}
          </p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Active Plans</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'fg.default' })}>
            {stats?.active_plans || 0}
          </p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Inactive Plans</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'fg.default' })}>
            {stats?.inactive_plans || 0}
          </p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Total Subscribers</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'fg.default' })}>
            {stats?.total_subscribers || 0}
          </p>
        </Box>
      </Grid>

      {/* Plans Table */}
      <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <PlansTable initialPlans={plans || []} />
      </Box>
    </Box>
  )
}
