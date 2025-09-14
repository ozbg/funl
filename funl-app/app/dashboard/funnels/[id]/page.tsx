import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import QRLayoutPreview from '@/components/QRLayoutPreview'
import FunnelTestimonialSettings from '@/components/testimonials/FunnelTestimonialSettings'
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


  return (
    <Box maxW="4xl" mx="auto">
      <Box mb={8}>
        <Flex align="center" justify="space-between">
          <Box>
            <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>{funnel.name}</h1>
            <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
              Created {new Date(funnel.created_at).toISOString().split('T')[0]}
            </p>
          </Box>
          <Flex align="center" gap={3}>
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
          </Flex>
        </Flex>
      </Box>

      <Stack gap={8}>
        {/* QR Layout Preview Section */}
        <QRLayoutPreview
          qrCodeUrl={funnel.qr_code_url || ''}
          shortUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/f/${funnel.short_url}`}
          funnelName={funnel.name}
          funnelId={funnel.id}
          initialStickerSettings={funnel.content?.sticker_settings}
        />

        {/* Testimonial Settings Section */}
        {funnel.type !== 'testimonial' && (
          <FunnelTestimonialSettings funnelId={funnel.id} />
        )}
      </Stack>
    </Box>
  )
}