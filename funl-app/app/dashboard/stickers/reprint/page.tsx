import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import Link from 'next/link'

export default async function ReprintPage() {
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

  // Fetch user's assigned codes (codes currently in use)
  const { data: assignedCodes } = await supabase
    .from('reserved_codes')
    .select(`
      id,
      code,
      status,
      assigned_at,
      purchase_order_id,
      funnel_id,
      funnels:funnel_id (
        id,
        name,
        funnel_type
      )
    `)
    .eq('business_id', user.id)
    .eq('status', 'assigned')
    .order('assigned_at', { ascending: false })

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <h1 className={css({ fontSize: '3xl', fontWeight: 'bold' })}>
            Order Reprints
          </h1>
          <p className={css({ color: 'fg.muted', mt: 2 })}>
            Select existing QR codes to reprint with new styles or sizes
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

      {/* Info Banner */}
      <Box mb={8} p={4} bg="blue.subtle" borderWidth="1px" borderColor="blue.default" rounded="md">
        <Flex align="start" gap={3}>
          <Box fontSize="xl">ℹ️</Box>
          <Box>
            <p className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'blue.text' })}>
              About Reprints
            </p>
            <p className={css({ fontSize: 'sm', color: 'blue.text', mt: 1 })}>
              Reprinting creates new physical stickers with your existing QR codes. Your current stickers will remain active - this is useful if you need duplicates, different sizes, or want to try new styles.
            </p>
          </Box>
        </Flex>
      </Box>

      {/* No Codes */}
      {!assignedCodes || assignedCodes.length === 0 ? (
        <Box p={12} textAlign="center" bg="bg.subtle" rounded="lg">
          <Box fontSize="4xl" mb={4}>📋</Box>
          <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 4 })}>
            No codes to reprint
          </h2>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 6 })}>
            You need to have codes assigned to funnels before you can order reprints
          </p>
          <Link
            href="/dashboard/stickers/buy"
            className={css({
              px: 6,
              py: 3,
              bg: 'accent.default',
              color: 'white',
              rounded: 'md',
              fontSize: 'md',
              fontWeight: 'semibold',
              display: 'inline-block',
              _hover: { bg: 'accent.emphasized' }
            })}
          >
            Buy New Stickers
          </Link>
        </Box>
      ) : (
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 4 })}>
            Select codes to reprint ({assignedCodes.length} available)
          </p>

          {/* Codes Grid */}
          <Grid gridTemplateColumns={{ base: '1', md: '2', lg: '3' }} gap={4}>
            {assignedCodes.map((code) => {
              const funnel = Array.isArray(code.funnels) ? code.funnels[0] : code.funnels

              return (
                <Box
                  key={code.id}
                  p={4}
                  bg="bg.default"
                  borderWidth="1px"
                  borderColor="border.default"
                  rounded="lg"
                  _hover={{ borderColor: 'accent.default', boxShadow: 'sm' }}
                >
                  {/* Code */}
                  <Flex justify="space-between" align="start" mb={3}>
                    <Box>
                      <p className={css({ fontSize: 'lg', fontWeight: 'bold', fontFamily: 'monospace' })}>
                        {code.code}
                      </p>
                      <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                        Assigned {new Date(code.assigned_at).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </Box>
                    <span className={css({
                      px: 2,
                      py: 1,
                      bg: 'green.subtle',
                      color: 'green.text',
                      rounded: 'sm',
                      fontSize: 'xs',
                      fontWeight: 'medium'
                    })}>
                      Active
                    </span>
                  </Flex>

                  {/* Funnel Info */}
                  {funnel && (
                    <Box mb={4} p={3} bg="bg.subtle" rounded="md">
                      <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>
                        Connected to:
                      </p>
                      <p className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                        {funnel.name}
                      </p>
                      <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                        {funnel.funnel_type}
                      </p>
                    </Box>
                  )}

                  {/* Reprint Button */}
                  <Link
                    href={`/dashboard/stickers/reprint/configure?code_id=${code.id}`}
                    className={css({
                      display: 'block',
                      w: 'full',
                      px: 4,
                      py: 2,
                      bg: 'accent.default',
                      color: 'white',
                      rounded: 'md',
                      fontSize: 'sm',
                      fontWeight: 'semibold',
                      textAlign: 'center',
                      _hover: { bg: 'accent.emphasized' }
                    })}
                  >
                    Configure Reprint
                  </Link>
                </Box>
              )
            })}
          </Grid>
        </Box>
      )}
    </Box>
  )
}
