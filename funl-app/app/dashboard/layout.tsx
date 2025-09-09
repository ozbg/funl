import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex, Container } from '@/styled-system/jsx'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <Box minHeight="100vh" bg="bg.muted">
      <nav className={css({ bg: 'bg.default', boxShadow: 'sm', borderBottom: '1px solid', borderColor: 'border.default' })}>
        <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }}>
          <Flex justify="space-between" h="16" align="center">
            <Flex align="center" gap="6">
              <Box>
                <h1 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'fg.default' })}>FunL</h1>
              </Box>
              <Flex gap="8" display={{ base: 'none', sm: 'flex' }}>
                <Link
                  href="/dashboard"
                  className={css({
                    borderBottom: '2px solid',
                    borderColor: 'accent.default',
                    color: 'fg.default',
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: '1',
                    pt: '1',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                  })}
                >
                  Funnels
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className={css({
                    borderBottom: '2px solid',
                    borderColor: 'transparent',
                    color: 'fg.muted',
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: '1',
                    pt: '1',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    _hover: {
                      borderColor: 'border.default',
                      color: 'fg.default',
                    },
                  })}
                >
                  Analytics
                </Link>
                <Link
                  href="/dashboard/settings"
                  className={css({
                    borderBottom: '2px solid',
                    borderColor: 'transparent',
                    color: 'fg.muted',
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: '1',
                    pt: '1',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    _hover: {
                      borderColor: 'border.default',
                      color: 'fg.default',
                    },
                  })}
                >
                  Settings
                </Link>
              </Flex>
            </Flex>
            <Flex align="center" gap="4">
              <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>{business?.name}</span>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className={css({
                    fontSize: 'sm',
                    color: 'fg.muted',
                    cursor: 'pointer',
                    _hover: {
                      color: 'fg.default',
                    },
                  })}
                >
                  Sign out
                </button>
              </form>
            </Flex>
          </Flex>
        </Container>
      </nav>
      <main className={css({ maxW: '7xl', py: 6, px: { base: 4, sm: 6, lg: 8 }, mx: 'auto' })}>
        {children}
      </main>
    </Box>
  )
}