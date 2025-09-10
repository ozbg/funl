'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Stack } from '@/styled-system/jsx'
import { downloadLayoutPDF } from '@/lib/pdf-utils'
import { generateShortUrl } from '@/lib/qr'
import { createClient } from '@/lib/supabase/client'

interface PrintActionsProps {
  funnelId: string
  funnelName: string
  shortUrl: string
  printType: 'A4_portrait' | 'A5_portrait' | 'A5_landscape' | 'business_card_landscape'
  businessData: {
    name: string
    phone?: string
    email?: string
    website?: string
  }
  customMessage?: string
}

export default function PrintActions({
  funnelId,
  funnelName,
  shortUrl,
  printType,
  businessData,
  customMessage
}: PrintActionsProps) {
  const [downloading, setDownloading] = useState(false)
  const supabase = createClient()

  const handleDownloadPDF = async () => {
    setDownloading(true)
    
    try {
      // Convert old print_type format to new PageSize format
      const pageSize = printType.replace('_', '-') as any // e.g., 'A4_portrait' -> 'A4-portrait'

      // Generate the full URL for QR code
      const fullUrl = generateShortUrl(shortUrl)

      // Prepare layout data using new format
      const layoutData = {
        business_name: businessData.name,
        custom_message: customMessage,
        phone: businessData.phone,
        email: businessData.email,
        website: businessData.website,
        funnel_name: funnelName,
        contact_url: fullUrl
      }

      // Generate and download PDF using the new system
      const filename = `${funnelName.replace(/[^a-zA-Z0-9]/g, '_')}_print.pdf`
      await downloadLayoutPDF(pageSize, layoutData, filename)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleOrderPrints = () => {
    // Placeholder for future functionality
    alert('Order prints functionality coming soon!')
  }

  return (
    <Stack gap={2}>
      <button
        onClick={handleDownloadPDF}
        disabled={downloading}
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
          cursor: 'pointer',
          _hover: {
            bg: 'colorPalette.emphasized',
          },
          _disabled: {
            opacity: 'disabled',
            cursor: 'not-allowed',
          },
        })}
      >
        {downloading ? 'Generating PDF...' : 'Download Print PDF'}
      </button>
      
      <button
        onClick={handleOrderPrints}
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
          cursor: 'pointer',
          _hover: {
            bg: 'bg.muted',
          },
        })}
      >
        Order Prints
      </button>
    </Stack>
  )
}