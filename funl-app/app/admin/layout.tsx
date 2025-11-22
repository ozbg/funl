import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'
import { css } from '@/styled-system/css'
import { Box, Flex, Container } from '@/styled-system/jsx'
import ThemeToggle from '@/components/ThemeToggle'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user: _user, admin: _admin } = await requireAdmin()

  return (
    <Box minHeight="100vh" bg="bg.muted">
      <nav className={css({ bg: 'bg.default', boxShadow: 'sm', borderBottom: '1px solid', borderColor: 'border.default' })}>
        <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }}>
          <Flex justify="space-between" h="16" align="center">
            <Flex align="center" gap="6">
              <Link 
                href="/admin" 
                className={css({ 
                  fontSize: 'lg', 
                  fontWeight: 'bold', 
                  color: 'accent.default' 
                })}
              >
                FunL Admin
              </Link>
              <AdminNav />
            </Flex>
            <Flex align="center" gap="4">
              <form action="/dashboard" method="get">
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
                  Dashboard
                </button>
              </form>
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
              <ThemeToggle />
            </Flex>
          </Flex>
        </Container>
      </nav>
      <main className={css({ maxW: 'full', py: 6, px: { base: 4, sm: 6, lg: 8 }, mx: 'auto' })}>
        {children}
      </main>
    </Box>
  )
}