import { createClient } from '@/lib/supabase/server'
import { css } from '@/styled-system/css'
import { Box, Grid, Flex } from '@/styled-system/jsx'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  // Get quick stats
  const [
    { count: businessCount },
    { count: categoryCount },
    { count: funnelTypeCount },
    { count: qrPresetCount },
    { count: totalFunnelsCount }
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('business_categories').select('*', { count: 'exact', head: true }),
    supabase.from('funnel_types').select('*', { count: 'exact', head: true }),
    supabase.from('qr_code_presets').select('*', { count: 'exact', head: true }),
    supabase.from('funnels').select('*', { count: 'exact', head: true })
  ])

  const adminCards = [
    {
      title: 'Business Categories',
      description: 'Manage business types and their available features',
      count: categoryCount || 0,
      href: '/admin/business-categories',
      color: 'blue'
    },
    {
      title: 'Funnel Types',
      description: 'Configure funnel types and their templates',
      count: funnelTypeCount || 0,
      href: '/admin/funnel-types',
      color: 'green'
    },
    {
      title: 'QR Presets',
      description: 'Design and manage QR code style presets',
      count: qrPresetCount || 0,
      href: '/admin/qr-presets',
      color: 'purple'
    },
    {
      title: 'Users',
      description: 'View and manage user accounts',
      count: businessCount || 0,
      href: '/admin/users',
      color: 'orange'
    }
  ]

  return (
    <Box>
      <Box mb={8}>
        <h1 className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'fg.default' })}>
          Admin Dashboard
        </h1>
        <p className={css({ mt: 2, color: 'fg.muted', fontSize: 'lg' })}>
          Manage your FunL platform configuration and users
        </p>
      </Box>

      {/* Quick Stats */}
      <Grid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
        {adminCards.map((card) => (
          <Box
            key={card.href}
            bg="bg.default"
            p={6}
            rounded="lg"
            boxShadow="sm"
            borderWidth="1px"
            borderColor="border.default"
          >
            <Flex justify="space-between" align="start" mb={4}>
              <Box>
                <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
                  {card.title}
                </h3>
                <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.muted' })}>
                  {card.description}
                </p>
              </Box>
              <Box
                bg="accent.subtle"
                color="accent.fg"
                px={3}
                py={1}
                rounded="full"
                fontSize="sm"
                fontWeight="semibold"
              >
                {card.count}
              </Box>
            </Flex>
            <Button asChild variant="outline" size="sm">
              <Link href={card.href}>
                Manage
              </Link>
            </Button>
          </Box>
        ))}
      </Grid>

      {/* Platform Overview */}
      <Box bg="bg.default" p={6} rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'fg.default', mb: 4 })}>
          Platform Overview
        </h2>
        <Grid columns={{ base: 1, md: 3 }} gap={6}>
          <Box textAlign="center">
            <div className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'accent.default' })}>
              {businessCount || 0}
            </div>
            <div className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              Total Users
            </div>
          </Box>
          <Box textAlign="center">
            <div className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'accent.default' })}>
              {totalFunnelsCount || 0}
            </div>
            <div className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              Funnels Created
            </div>
          </Box>
          <Box textAlign="center">
            <div className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'accent.default' })}>
              {(categoryCount || 0) + (funnelTypeCount || 0) + (qrPresetCount || 0)}
            </div>
            <div className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              Configuration Items
            </div>
          </Box>
        </Grid>
      </Box>
    </Box>
  )
}