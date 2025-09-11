'use client'

import React, { useState } from 'react'
import { Stack, Box } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import DynamicPrintPreview from './DynamicPrintPreview'
import PrintActions from './PrintActions'
import PrintTypeSelector from './PrintTypeSelector'
import { generateShortUrl } from '@/lib/qr'

interface FunnelPrintSectionProps {
  funnelId: string
  funnelName: string
  shortUrl: string
  initialLayoutId: string
  businessData: {
    name: string
    phone?: string
    email?: string
    website?: string
  }
  customMessage?: string
}

export default function FunnelPrintSection({
  funnelId,
  funnelName,
  shortUrl,
  initialLayoutId,
  businessData,
  customMessage
}: FunnelPrintSectionProps) {
  const [layoutId, setLayoutId] = useState(initialLayoutId)

  const handleLayoutChange = (newLayoutId: string) => {
    console.log('🔄 Layout changing from', layoutId, 'to', newLayoutId)
    setLayoutId(newLayoutId)
  }

  return (
    <Box>
      <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
        Print Options
      </h3>
      
      {/* Print Layout Selector */}
      <PrintTypeSelector 
        funnelId={funnelId}
        initialPrintType={initialLayoutId}
        onPrintTypeChange={setLayoutId}
      />
      
      {/* PDF Preview and Download Actions */}
      <Box mt={4}>
        <Stack gap={3}>
          <DynamicPrintPreview 
            layoutId={layoutId}
            data={{
              business_name: businessData?.name || 'Sample Business Name',
              funnel_name: funnelName || 'Sample Funnel',
              custom_message: customMessage || 'Your custom message here',
              phone: businessData?.phone || '+61 400 123 456',
              email: businessData?.email || 'contact@business.com',
              website: businessData?.website || 'www.business.com',
              contact_url: generateShortUrl(shortUrl),
              word_top: 'TOP TEXT',
              word_bottom: 'BOTTOM TEXT',
              word_left: 'LEFT',
              word_right: 'RIGHT'
            }}
          />
          
          <PrintActions
            funnelId={funnelId}
            funnelName={funnelName}
            shortUrl={shortUrl}
            layoutId={layoutId}
            businessData={businessData}
            customMessage={customMessage}
          />
        </Stack>
      </Box>
    </Box>
  )
}