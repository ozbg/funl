import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { generateShortUrl } from '@/lib/qr'
import FunnelActions from '@/components/FunnelActions'
import FunnelPrintSection from '@/components/FunnelPrintSection'
import QRLayoutPreview from '@/components/QRLayoutPreview'
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

  // Fetch business data
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.id)
    .single()

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

      {/* QR Layout Preview Section */}
      <QRLayoutPreview 
        qrCodeUrl={funnel.qr_code_url || ''}
        funnelName={funnel.name}
        funnelId={funnel.id}
        initialStickerSettings={funnel.content?.sticker_settings}
      />


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