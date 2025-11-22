import { createClient } from '@/lib/supabase/server'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { BusinessCategoriesTable } from '@/components/admin/BusinessCategoriesTable'
import { CreateCategoryDialog } from '@/components/admin/CreateCategoryDialog'

export default async function BusinessCategoriesPage() {
  const supabase = await createClient()
  
  const { data: categories, error } = await supabase
    .from('business_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            Business Categories
          </h1>
          <p className={css({ mt: 1, color: 'fg.muted' })}>
            Manage business types and their available features
          </p>
        </Box>
        <CreateCategoryDialog />
      </Flex>

      <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <BusinessCategoriesTable categories={categories || []} />
      </Box>
    </Box>
  )
}