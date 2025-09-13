import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/admin'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { UsersTable } from '@/components/admin/UsersTable'

export default async function UsersPage() {
  // Verify admin access
  await requireAdmin()
  
  // Create admin client with service role for bypassing RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  
  const [
    { data: users },
    { data: categories }
  ] = await Promise.all([
    supabaseAdmin
      .from('businesses')
      .select(`
        *,
        business_categories(*)
      `)
      .order('created_at', { ascending: false }),
    supabaseAdmin
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
            Users Management
          </h1>
          <p className={css({ mt: 1, color: 'fg.muted' })}>
            View and manage user accounts and their business categories
          </p>
        </Box>
      </Flex>

      <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <UsersTable users={users || []} categories={categories || []} />
      </Box>
    </Box>
  )
}