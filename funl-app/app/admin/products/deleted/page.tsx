import Link from 'next/link'
import { Box, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { Button } from '@/components/ui/button'
import { DeletedProductsTable } from '@/components/admin/DeletedProductsTable'
import { createServiceClient } from '@/lib/supabase/server'

async function getDeletedProducts() {
  const serviceClient = await createServiceClient()

  const { data: products, error } = await serviceClient
    .from('sellable_products')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) {
    console.error('Error fetching deleted products:', error)
    return []
  }

  return products || []
}

export default async function DeletedProductsPage() {
  const deletedProducts = await getDeletedProducts()

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            Deleted Products Archive
          </h1>
          <p className={css({ mt: 1, color: 'fg.muted' })}>
            Products that have been soft deleted can be restored from this archive
          </p>
        </Box>
        <Link href="/admin/products">
          <Button variant="outline" size="sm">
            Back to Products
          </Button>
        </Link>
      </Flex>

      {/* Info Box */}
      <Box mb={6} p={4} bg="bg.muted" borderWidth="1px" borderColor="border.default" rounded="md">
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
          ℹ️ Deleted products are hidden from customers but all data is preserved. You can restore them at any time.
        </p>
      </Box>

      {/* Deleted Products Table */}
      <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        {deletedProducts.length === 0 ? (
          <Box p={8} textAlign="center">
            <p className={css({ fontSize: 'lg', color: 'fg.muted', mb: 2 })}>
              No deleted products
            </p>
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              Deleted products will appear here and can be restored
            </p>
          </Box>
        ) : (
          <DeletedProductsTable products={deletedProducts} />
        )}
      </Box>
    </Box>
  )
}
