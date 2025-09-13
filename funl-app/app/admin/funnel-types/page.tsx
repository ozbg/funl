import { createClient } from '@/lib/supabase/server'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { FunnelTypesTable } from '@/components/admin/FunnelTypesTable'
import { CreateFunnelTypeDialog } from '@/components/admin/CreateFunnelTypeDialog'

export default async function FunnelTypesPage() {
  const supabase = await createClient()
  
  const [
    { data: funnelTypes },
    { data: categories }
  ] = await Promise.all([
    supabase
      .from('funnel_types')
      .select(`
        *,
        category_funnel_types(
          business_categories(*)
        )
      `)
      .order('sort_order', { ascending: true }),
    supabase
      .from('business_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
  ])

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            Funnel Types
          </h1>
          <p className={css({ mt: 1, color: 'fg.muted' })}>
            Configure funnel types and their templates
          </p>
        </Box>
        <CreateFunnelTypeDialog categories={categories || []} />
      </Flex>

      <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <FunnelTypesTable funnelTypes={funnelTypes || []} categories={categories || []} />
      </Box>
    </Box>
  )
}