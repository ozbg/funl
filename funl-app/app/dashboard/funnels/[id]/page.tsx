import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { generateShortUrl } from '@/lib/qr'
import FunnelActions from '@/components/FunnelActions'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack } from '@/styled-system/jsx'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FunnelDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  const { data: funnel, error } = await supabase
    .from('funnels')
    .select('*')
    .eq('id', id)
    .eq('business_id', user.id)
    .single()

  if (error || !funnel) {
    return notFound()
  }

  const publicUrl = generateShortUrl(funnel.short_url)

  return (
    <Box maxW="4xl" mx="auto">
      <Box mb={8}>
        <Flex align="center" justify="space-between">
          <Box>
            <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>{funnel.name}</h1>
            <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
              Created {new Date(funnel.created_at).toLocaleDateString()}
            </p>
          </Box>
          <Flex align="center" gap={3}>
            <span className={css({
              px: 2,
              py: 1,
              fontSize: 'xs',
              fontWeight: 'semibold',
              borderRadius: 'full',
              colorPalette: funnel.status === 'active' ? 'mint' : 'gray',
              bg: 'colorPalette.subtle',
              color: 'colorPalette.text'
            })}>
              {funnel.status}
            </span>
            <Link
              href={`/dashboard/funnels/${funnel.id}/edit`}
              className={css({ 
                colorPalette: 'mint',
                px: 3, 
                py: 1, 
                fontSize: 'sm', 
                fontWeight: 'medium', 
                color: 'colorPalette.default', 
                _hover: { color: 'colorPalette.emphasized' } 
              })}
            >
              Edit
            </Link>
          </Flex>
        </Flex>
      </Box>

      <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={8}>
        {/* QR Code Section */}
        <Box bg="bg.default" boxShadow="sm" p={6}>
          <h2 className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'fg.default', mb: 4 })}>QR Code</h2>
          
          {funnel.qr_code_url && (
            <Box textAlign="center">
              <Box display="inline-block" p={4} bg="bg.default" borderWidth="1px" borderColor="border.default">
                <Image
                  src={funnel.qr_code_url}
                  alt={`QR Code for ${funnel.name}`}
                  width={200}
                  height={200}
                  className={css({ mx: 'auto' })}
                />
              </Box>
              
              <Stack gap={2} mt={4}>
                <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Short URL:</p>
                <Flex align="center" justify="center" gap={2}>
                  <code className={css({ px: 2, py: 1, bg: 'bg.muted', fontSize: 'sm' })}>
                    {publicUrl}
                  </code>
                  <FunnelActions 
                    funnelId={funnel.id}
                    currentStatus={funnel.status}
                    publicUrl={publicUrl}
                  />
                </Flex>
              </Stack>

              <Stack gap={2} mt={6}>
                <a
                  href={funnel.qr_code_url}
                  download={`${funnel.name.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`}
                  className={css({
                    colorPalette: 'mint',
                    w: 'full',
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    px: 4,
                    py: 2,
                    borderWidth: '1px',
                    borderColor: 'transparent',
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
                  Download QR Code
                </a>
                <Link
                  href={publicUrl}
                  target="_blank"
                  className={css({
                    w: 'full',
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    px: 4,
                    py: 2,
                    borderWidth: '1px',
                    borderColor: 'border.default',
                    boxShadow: 'sm',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    color: 'fg.default',
                    bg: 'bg.default',
                    _hover: {
                      bg: 'bg.muted',
                    },
                  })}
                >
                  Preview Landing Page
                </Link>
              </Stack>
            </Box>
          )}
        </Box>

        {/* Funnel Details */}
        <Box bg="bg.default" boxShadow="sm" p={6}>
          <h2 className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'fg.default', mb: 4 })}>Funnel Details</h2>
          
          <Stack gap={4}>
            <Box>
              <dt className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>Type</dt>
              <dd className={css({ mt: 1, fontSize: 'sm', color: 'fg.default', textTransform: 'capitalize' })}>{funnel.type}</dd>
            </Box>
            
            <Box>
              <dt className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>Print Size</dt>
              <dd className={css({ mt: 1, fontSize: 'sm', color: 'fg.default' })}>{funnel.print_size}</dd>
            </Box>

            {funnel.content?.headline && (
              <Box>
                <dt className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>Headline</dt>
                <dd className={css({ mt: 1, fontSize: 'sm', color: 'fg.default' })}>{funnel.content.headline}</dd>
              </Box>
            )}

            {funnel.content?.state && (
              <Box>
                <dt className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>Property State</dt>
                <dd className={css({ mt: 1, fontSize: 'sm', color: 'fg.default', textTransform: 'capitalize' })}>
                  {funnel.content.state.replace('_', ' ')}
                </dd>
              </Box>
            )}

            {funnel.content?.price && (
              <Box>
                <dt className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>Price</dt>
                <dd className={css({ mt: 1, fontSize: 'sm', color: 'fg.default' })}>{funnel.content.price}</dd>
              </Box>
            )}

            {funnel.content?.property_url && (
              <Box>
                <dt className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>Property Link</dt>
                <dd className={css({ mt: 1, fontSize: 'sm', color: 'fg.default' })}>
                  <a 
                    href={funnel.content.property_url} 
                    target="_blank"
                    className={css({ 
                      colorPalette: 'mint',
                      color: 'colorPalette.default', 
                      _hover: { color: 'colorPalette.emphasized' } 
                    })}
                  >
                    View Property
                  </a>
                </dd>
              </Box>
            )}

            {funnel.content?.video_url && (
              <Box>
                <dt className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>Video</dt>
                <dd className={css({ mt: 1, fontSize: 'sm', color: 'fg.default' })}>
                  <a 
                    href={funnel.content.video_url} 
                    target="_blank"
                    className={css({ 
                      colorPalette: 'mint',
                      color: 'colorPalette.default', 
                      _hover: { color: 'colorPalette.emphasized' } 
                    })}
                  >
                    View Video
                  </a>
                </dd>
              </Box>
            )}

            {funnel.content?.custom_message && (
              <Box>
                <dt className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' })}>Custom Message</dt>
                <dd className={css({ mt: 1, fontSize: 'sm', color: 'fg.default' })}>{funnel.content.custom_message}</dd>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Actions */}
      <Flex mt={8} justify="space-between">
        <Link
          href="/dashboard"
          className={css({
            px: 4,
            py: 2,
            fontSize: 'sm',
            fontWeight: 'medium',
            color: 'fg.default',
            bg: 'bg.default',
            borderWidth: '1px',
            borderColor: 'border.default',
            _hover: {
              bg: 'bg.muted',
            },
          })}
        >
          ← Back to Dashboard
        </Link>
        
        <FunnelActions 
          funnelId={funnel.id}
          currentStatus={funnel.status}
        />
      </Flex>
    </Box>
  )
}