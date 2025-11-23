import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Box, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { PlanDetailTabs } from '@/components/admin/PlanDetailTabs'

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const serviceClient = await createServiceClient()

  // Fetch plan by slug
  const { data: plan, error } = await serviceClient
    .from('subscription_plans')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !plan) {
    redirect('/admin/plans')
  }

  // Fetch customer count
  const { count: customerCount } = await serviceClient
    .from('subscription_history')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_plan_id', plan.id)
    .in('status', ['active', 'trialing'])

  return (
    <Box p={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 2 })}>
            {plan.name}
          </h1>
          <Flex gap={2} align="center">
            <span className={css({
              px: 2,
              py: 1,
              bg: plan.is_active ? 'green.100' : 'gray.100',
              color: plan.is_active ? 'green.700' : 'gray.700',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'medium'
            })}>
              {plan.is_active ? 'Active' : 'Inactive'}
            </span>
            {plan.is_default && (
              <span className={css({
                px: 2,
                py: 1,
                bg: 'blue.100',
                color: 'blue.700',
                rounded: 'md',
                fontSize: 'sm',
                fontWeight: 'medium'
              })}>
                ✓ Default
              </span>
            )}
            {plan.featured && (
              <span className={css({
                px: 2,
                py: 1,
                bg: 'yellow.100',
                color: 'yellow.700',
                rounded: 'md',
                fontSize: 'sm',
                fontWeight: 'medium'
              })}>
                ⭐ Featured
              </span>
            )}
            <span className={css({
              px: 2,
              py: 1,
              bg: 'gray.100',
              color: 'gray.700',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'medium'
            })}>
              {customerCount || 0} customers
            </span>
          </Flex>
        </Box>
        <Flex gap={3}>
          <a
            href={`/admin/plans`}
            className={css({
              px: 4,
              py: 2,
              bg: 'bg.muted',
              color: 'fg.default',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'medium',
              cursor: 'pointer',
              _hover: { bg: 'bg.subtle' }
            })}
          >
            ← Back to Plans
          </a>
        </Flex>
      </Flex>

      {/* Plan Detail Tabs */}
      <PlanDetailTabs plan={plan} />
    </Box>
  )
}
