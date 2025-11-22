import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { PricingCard } from '@/components/stickers/PricingCard'
import Link from 'next/link'

export default async function BuyStickersPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch business
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', user.id)
    .single()

  if (!business) {
    redirect('/onboarding')
  }

  // Fetch active batches with available codes
  const { data: batches } = await supabase
    .from('qr_code_batches')
    .select(`
      id,
      name,
      batch_number,
      status,
      size_small_price,
      size_medium_price,
      size_large_price,
      pricing_tiers
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Fetch available QR presets (styles)
  const { data: styles } = await supabase
    .from('qr_presets')
    .select('id, name, template, preview_url')
    .order('name')

  // For each batch, get available counts by size
  const batchesWithCounts = await Promise.all(
    (batches || []).map(async (batch) => {
      const { count: smallCount } = await supabase
        .from('reserved_codes')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batch.id)
        .eq('status', 'available')
        .is('business_id', null)

      return {
        ...batch,
        available_counts: {
          small: smallCount || 0,
          medium: smallCount || 0, // Same batch, different sizes
          large: smallCount || 0
        }
      }
    })
  )

  // Sample QR code URL (you can generate a real one)
  const sampleQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://funl.au'

  // Default pricing tiers (can be customized per batch via pricing_tiers field)
  const defaultPricingTiers = [
    { min_quantity: 1, max_quantity: 9, unit_price: 5.00 },
    { min_quantity: 10, max_quantity: 49, unit_price: 4.50 },
    { min_quantity: 50, max_quantity: 99, unit_price: 4.00 },
    { min_quantity: 100, max_quantity: null, unit_price: 3.50 }
  ]

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <h1 className={css({ fontSize: '3xl', fontWeight: 'bold' })}>
            Buy QR Code Stickers
          </h1>
          <p className={css({ color: 'fg.muted', mt: 2 })}>
            Purchase high-quality QR code stickers for your funnels
          </p>
        </Box>
        <Link
          href="/dashboard/stickers/orders"
          className={css({
            px: 4,
            py: 2,
            bg: 'bg.subtle',
            borderWidth: '1px',
            borderColor: 'border.default',
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'medium',
            _hover: { bg: 'bg.muted' }
          })}
        >
          View Orders
        </Link>
      </Flex>

      {/* No Batches Available */}
      {!batchesWithCounts || batchesWithCounts.length === 0 ? (
        <Box p={8} textAlign="center" bg="bg.subtle" rounded="lg">
          <p className={css({ fontSize: 'lg', color: 'fg.muted' })}>
            No sticker batches available at this time
          </p>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 2 })}>
            Check back soon for new inventory
          </p>
        </Box>
      ) : (
        <Box>
          {batchesWithCounts.map((batch) => (
            <Box key={batch.id} mb={12}>
              {/* Batch Header */}
              <Box mb={6}>
                <h2 className={css({ fontSize: '2xl', fontWeight: 'semibold' })}>
                  {batch.name}
                </h2>
                <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
                  Batch #{batch.batch_number}
                </p>
              </Box>

              {/* Pricing Cards Grid */}
              <Grid
                gridTemplateColumns={{ base: '1', md: '2', lg: '3' }}
                gap={6}
              >
                {/* Small */}
                {batch.available_counts.small > 0 && (
                  <PricingCard
                    batch_id={batch.id}
                    batch_name={batch.name}
                    size="small"
                    available_quantity={batch.available_counts.small}
                    pricing_tiers={batch.pricing_tiers || defaultPricingTiers}
                    styles={styles || []}
                    sample_qr_url={sampleQrUrl}
                  />
                )}

                {/* Medium */}
                {batch.available_counts.medium > 0 && (
                  <PricingCard
                    batch_id={batch.id}
                    batch_name={batch.name}
                    size="medium"
                    available_quantity={batch.available_counts.medium}
                    pricing_tiers={batch.pricing_tiers || defaultPricingTiers}
                    styles={styles || []}
                    sample_qr_url={sampleQrUrl}
                  />
                )}

                {/* Large */}
                {batch.available_counts.large > 0 && (
                  <PricingCard
                    batch_id={batch.id}
                    batch_name={batch.name}
                    size="large"
                    available_quantity={batch.available_counts.large}
                    pricing_tiers={batch.pricing_tiers || defaultPricingTiers}
                    styles={styles || []}
                    sample_qr_url={sampleQrUrl}
                  />
                )}
              </Grid>
            </Box>
          ))}
        </Box>
      )}

      {/* Cart Summary (Fixed at bottom) */}
      <CartSummaryBar />
    </Box>
  )
}

// Simple cart summary bar component
function CartSummaryBar() {
  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="bg.default"
      borderTopWidth="1px"
      borderColor="border.default"
      p={4}
      boxShadow="lg"
      zIndex={10}
    >
      <Flex justify="space-between" align="center" maxW="7xl" mx="auto">
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            Cart Total
          </p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold' })} id="cart-total">
            $0.00
          </p>
        </Box>
        <Link
          href="/dashboard/stickers/checkout"
          className={css({
            px: 8,
            py: 3,
            bg: 'accent.default',
            color: 'white',
            rounded: 'md',
            fontSize: 'md',
            fontWeight: 'semibold',
            _hover: { bg: 'accent.emphasized' }
          })}
        >
          Proceed to Checkout
        </Link>
      </Flex>
    </Box>
  )
}
