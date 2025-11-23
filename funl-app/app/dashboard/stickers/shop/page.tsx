import { createClient } from '@/lib/supabase/server'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { ProductCard } from '@/components/shop/ProductCard'
import { redirect } from 'next/navigation'

export default async function ShopPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch active products
  const { data: products } = await supabase
    .from('sellable_products')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })

  const productsWithInfo = products?.map((product) => {
    const pricingTiers = product.pricing_tiers || []
    const lowestPrice = pricingTiers.length > 0
      ? Math.min(...pricingTiers.map((tier: { unit_price: number }) => tier.unit_price))
      : 0

    return {
      ...product,
      lowest_price: lowestPrice,
      in_stock: product.tracks_inventory ? product.current_stock > 0 : true,
      low_stock: product.tracks_inventory ? product.current_stock <= product.low_stock_threshold : false,
    }
  })

  // Separate featured and regular products
  const featuredProducts = productsWithInfo?.filter((p) => p.featured) || []
  const regularProducts = productsWithInfo?.filter((p) => !p.featured) || []

  return (
    <Box>
      <Box mb={8}>
        <h1 className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'fg.default', mb: 2 })}>
          Shop QR Stickers
        </h1>
        <p className={css({ color: 'fg.muted', fontSize: 'lg' })}>
          Premium quality QR code stickers for your marketing campaigns
        </p>
      </Box>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <Box mb={12}>
          <Flex align="center" gap={2} mb={4}>
            <h2 className={css({ fontSize: '2xl', fontWeight: 'semibold', color: 'fg.default' })}>
              Featured Products
            </h2>
            <Box
              px={2}
              py={1}
              bg="yellow.100"
              color="yellow.800"
              rounded="md"
              fontSize="xs"
              fontWeight="medium"
            >
              Popular
            </Box>
          </Flex>

          <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Grid>
        </Box>
      )}

      {/* All Products */}
      <Box>
        <h2 className={css({ fontSize: '2xl', fontWeight: 'semibold', color: 'fg.default', mb: 4 })}>
          All Products
        </h2>

        <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {regularProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Grid>
      </Box>

      {!productsWithInfo || productsWithInfo.length === 0 && (
        <Box
          bg="bg.default"
          rounded="lg"
          boxShadow="sm"
          borderWidth="1px"
          borderColor="border.default"
          p={12}
          textAlign="center"
        >
          <p className={css({ color: 'fg.muted' })}>
            No products available at the moment. Check back soon!
          </p>
        </Box>
      )}
    </Box>
  )
}
