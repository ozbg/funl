import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid, Stack, Container } from '@/styled-system/jsx'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check if user is an admin
    const { data: admin } = await supabase
      .from('admins')
      .select('is_active')
      .eq('email', user.email!)
      .eq('is_active', true)
      .single()

    if (admin) {
      redirect('/admin')
    } else {
      redirect('/dashboard')
    }
  }

  return (
    <Box 
      minHeight="100vh" 
      bgGradient="to-br" 
      gradientFrom="mint.subtle" 
      gradientTo="mint.muted" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      colorPalette="mint"
    >
      <Container maxW="4xl" px={{ base: 4, sm: 6, lg: 8 }} textAlign="center">
        <Stack gap={8}>
          <Box>
            <h1 className={css({ 
              fontSize: { base: '4xl', sm: '6xl' }, 
              fontWeight: 'bold', 
              color: 'fg.default', 
              mb: 6 
            })}>
              Turn every sign into a 
              <span className={css({ color: 'colorPalette.default' })}> live funnel</span>
            </h1>
            <p className={css({ 
              fontSize: 'xl', 
              color: 'fg.muted', 
              maxW: '2xl', 
              mx: 'auto' 
            })}>
              Create trackable QR code funnels that get buyers into your phone, not lost. 
              Perfect for real estate agents and service professionals.
            </p>
          </Box>

          <Flex 
            direction={{ base: 'column', sm: 'row' }} 
            gap={4} 
            justify="center" 
            align="center"
          >
            <Link
              href="/signup"
              className={css({
                colorPalette: 'mint',
                px: 8,
                py: 3,
                bg: 'colorPalette.default',
                color: 'colorPalette.fg',
                fontWeight: 'semibold',
                boxShadow: 'lg',
                _hover: {
                  bg: 'colorPalette.emphasized',
                },
                transition: 'colors',
              })}
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className={css({
                px: 8,
                py: 3,
                borderWidth: '1px',
                borderColor: 'border.default',
                color: 'fg.default',
                fontWeight: 'semibold',
                _hover: {
                  bg: 'bg.muted',
                },
                transition: 'colors',
              })}
            >
              Sign In
            </Link>
          </Flex>

          <Grid 
            mt={16} 
            columns={{ base: 1, md: 3 }} 
            gap={8}
          >
            <Box bg="bg.default" p={6} boxShadow="md" colorPalette="mint">
              <Flex
                w={12}
                h={12}
                bg="colorPalette.subtle"
                               align="center"
                justify="center"
                mb={4}
                mx="auto"
              >
                <svg className={css({ w: 6, h: 6, color: 'colorPalette.default' })} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </Flex>
              <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Easy Setup
              </h3>
              <p className={css({ color: 'fg.muted' })}>
                Add your contact info once, then generate unlimited QR code funnels
              </p>
            </Box>

            <Box bg="bg.default" p={6} boxShadow="md" colorPalette="mint">
              <Flex
                w={12}
                h={12}
                bg="colorPalette.subtle"
                               align="center"
                justify="center"
                mb={4}
                mx="auto"
              >
                <svg className={css({ w: 6, h: 6, color: 'colorPalette.default' })} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </Flex>
              <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Smart Analytics
              </h3>
              <p className={css({ color: 'fg.muted' })}>
                Track every scan, download, and callback request in real-time
              </p>
            </Box>

            <Box bg="bg.default" p={6} boxShadow="md" colorPalette="mint">
              <Flex
                w={12}
                h={12}
                bg="colorPalette.subtle"
                               align="center"
                justify="center"
                mb={4}
                mx="auto"
              >
                <svg className={css({ w: 6, h: 6, color: 'colorPalette.default' })} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Flex>
              <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Dynamic Content
              </h3>
              <p className={css({ color: 'fg.muted' })}>
                Update your funnel messaging anytime - from &quot;For Sale&quot; to &quot;SOLD&quot;
              </p>
            </Box>
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}