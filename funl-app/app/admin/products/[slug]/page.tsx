import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { ProductDetailTabs } from '@/components/admin/ProductDetailTabs'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const serviceClient = await createServiceClient()

  // Fetch product by slug
  const { data: product, error } = await serviceClient
    .from('sellable_products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !product) {
    redirect('/admin/products')
  }

  // Fetch linked batches for inventory tab
  const { data: linkedBatches } = await serviceClient
    .from('product_batch_inventory')
    .select(`
      id,
      quantity_allocated,
      quantity_remaining,
      linked_at,
      batch:qr_code_batches(
        id,
        batch_number,
        name,
        status
      )
    `)
    .eq('product_id', product.id)
    .order('linked_at', { ascending: false })

  return (
    <Box p={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 2 })}>
            {product.name}
          </h1>
          <Flex gap={2} align="center">
            <span className={css({
              px: 2,
              py: 1,
              bg: 'bg.muted',
              color: product.is_active ? 'accent.default' : 'fg.muted',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'medium'
            })}>
              {product.is_active ? 'Active' : 'Inactive'}
            </span>
            {product.featured && (
              <span className={css({
                px: 2,
                py: 1,
                bg: 'bg.muted',
                color: 'accent.default',
                rounded: 'md',
                fontSize: 'sm',
                fontWeight: 'medium'
              })}>
                ⭐ Featured
              </span>
            )}
          </Flex>
        </Box>
        <Flex gap={3}>
          <a
            href={`/admin/products`}
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
            ← Back to Products
          </a>
        </Flex>
      </Flex>

      {/* Product Detail Tabs */}
      <ProductDetailTabs product={product as never} linkedBatches={(linkedBatches as never) || []} />
    </Box>
  )
}
