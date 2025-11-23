import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { ProductsTable } from '@/components/admin/ProductsTable'
import { CreateProductDialog } from '@/components/admin/CreateProductDialog'

export default async function AdminProductsPage() {
  // Fetch initial products data via admin API
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/products`, {
    cache: 'no-store'
  })
  const { products, stats } = await response.json()

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            Product Management
          </h1>
          <p className={css({ mt: 1, color: 'fg.muted' })}>
            Manage sellable products, pricing, and inventory
          </p>
        </Box>
        <CreateProductDialog />
      </Flex>

      {/* Stats Cards */}
      <Grid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Total Products</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'blue.600' })}>
            {stats?.total_products || 0}
          </p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Active Products</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'green.600' })}>
            {stats?.active_products || 0}
          </p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Inactive Products</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'gray.600' })}>
            {stats?.inactive_products || 0}
          </p>
        </Box>

        <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default" p={6}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 2 })}>Low Stock Alerts</p>
          <p className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'orange.600' })}>
            {stats?.low_stock_count || 0}
          </p>
        </Box>
      </Grid>

      {/* Products Table */}
      <Box bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <ProductsTable initialProducts={products || []} />
      </Box>
    </Box>
  )
}
