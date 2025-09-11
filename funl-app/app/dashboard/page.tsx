import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Funnel } from '@/lib/types'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack } from '@/styled-system/jsx'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: funnels } = await supabase
    .from('funnels')
    .select('*')
    .eq('business_id', user?.id)
    .order('created_at', { ascending: false }) as { data: Funnel[] | null }

  return (
    <Box>
      <Box px={{ base: 4, sm: 0 }}>
        <Flex 
          direction={{ base: 'column', sm: 'row' }} 
          align={{ sm: 'center' }} 
          justify={{ sm: 'space-between' }}
        >
          <Box>
            <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
              Your Funnels
            </h1>
            <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.muted' })}>
              Create and manage your QR code funnels
            </p>
          </Box>
          <Box mt={{ base: 4, sm: 0 }}>
            <Link
              href="/dashboard/funnels/new"
              className={css({
                colorPalette: 'mint',
                display: 'inline-flex',
                alignItems: 'center',
                px: 4,
                py: 2,
                boxShadow: 'sm',
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'colorPalette.fg',
                bg: 'colorPalette.default',
                _hover: {
                  bg: 'colorPalette.emphasized',
                },
              })}
            >
              Create New Funnel
            </Link>
          </Box>
        </Flex>
      </Box>

      <Box mt={8}>
        {funnels && funnels.length > 0 ? (
          <Box bg="bg.default" boxShadow="sm" overflow="hidden" >
            <Stack divideY="1px" divideColor="border.default">
              {funnels.map((funnel) => (
                <Box key={funnel.id} px={{ base: 4, sm: 6 }} py={4}>
                  <Flex justify="space-between" align="center">
                    <Flex align="center" gap={4}>
                      <Box flexShrink={0}>
                        <Flex
                          h={10}
                          w={10}
                          borderRadius="full"
                          colorPalette="mint"
                          bg="colorPalette.default"
                          align="center"
                          justify="center"
                        >
                          <span className={css({ colorPalette: 'mint', color: 'colorPalette.fg', fontWeight: 'medium', fontSize: 'sm' })}>
                            {funnel.name.charAt(0).toUpperCase()}
                          </span>
                        </Flex>
                      </Box>
                      <Box>
                        <Link
                          href={`/dashboard/funnels/${funnel.id}`}
                          className={css({
                            fontSize: 'sm',
                            fontWeight: 'medium',
                            color: 'fg.default',
                            textDecoration: 'none',
                            _hover: {
                              textDecoration: 'underline'
                            }
                          })}
                        >
                          {funnel.name}
                        </Link>
                        <Box fontSize="sm" color="fg.muted">
                          Type: {funnel.type} • Status: {funnel.status}
                        </Box>
                        <Box fontSize="xs" color="fg.muted" mt={1}>
                          Created {new Date(funnel.created_at).toLocaleDateString()}
                        </Box>
                      </Box>
                    </Flex>
                    <Flex gap={2}>
                      <Link
                        href={`/dashboard/funnels/new?edit=${funnel.id}`}
                        className={css({
                          colorPalette: 'mint',
                          px: 3,
                          py: 1,
                          fontSize: 'sm',
                          fontWeight: 'medium',
                          color: 'colorPalette.default',
                          textDecoration: 'none',
                          _hover: { color: 'colorPalette.emphasized' }
                        })}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/funnels/${funnel.id}`}
                        className={css({
                          colorPalette: 'mint',
                          px: 3,
                          py: 1,
                          fontSize: 'sm',
                          fontWeight: 'medium',
                          color: 'colorPalette.default',
                          textDecoration: 'none',
                          _hover: { color: 'colorPalette.emphasized' }
                        })}
                      >
                        Sticker
                      </Link>
                    </Flex>
                  </Flex>
                </Box>
              ))}
            </Stack>
          </Box>
        ) : (
          <Flex direction="column" align="center" py={12}>
            <svg
              className={css({ mx: 'auto', h: 12, w: 12, color: 'fg.muted' })}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <h3 className={css({ mt: 2, fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
              No funnels yet
            </h3>
            <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.muted' })}>
              Get started by creating your first funnel.
            </p>
            <Box mt={6}>
              <Link
                href="/dashboard/funnels/new"
                className={css({
                  colorPalette: 'mint',
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 4,
                  py: 2,
                    boxShadow: 'sm',
                  fontSize: 'sm',
                  fontWeight: 'medium',
                  color: 'colorPalette.fg',
                  bg: 'colorPalette.default',
                  _hover: {
                    bg: 'colorPalette.emphasized',
                  },
                })}
              >
                Create New Funnel
              </Link>
            </Box>
          </Flex>
        )}
      </Box>
    </Box>
  )
}