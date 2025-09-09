'use client'

import React, { useEffect, useState } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { generateQRCode } from '@/lib/qr'
import { createClient } from '@/lib/supabase/client'

interface LayoutElement {
  id: string
  type: 'qr_code' | 'text' | 'image'
  field?: string
  position: { x: number; y: number } // percentage based
  size: { width: number; height: number } // percentage based
  alignment?: 'left' | 'center' | 'right'
  fontSize?: number
  fontWeight?: string
}

interface PrintLayout {
  id: string
  name: string
  print_type: 'A4_portrait' | 'A5_portrait' | 'A5_landscape'
  layout_config: {
    elements: LayoutElement[]
  }
}

interface PrintLayoutPreviewProps {
  printType: 'A4_portrait' | 'A5_portrait' | 'A5_landscape'
  funnelName?: string
  businessName?: string
  customMessage?: string
  contactPhone?: string
  contactEmail?: string
  website?: string
  scale?: number // For preview sizing
}

export default function PrintLayoutPreview({
  printType,
  funnelName,
  businessName = 'Your Business',
  customMessage,
  contactPhone,
  contactEmail,
  website,
  scale = 0.3 // 30% of actual size for preview
}: PrintLayoutPreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [layout, setLayout] = useState<PrintLayout | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch layout configuration
  useEffect(() => {
    const fetchLayout = async () => {
      const { data, error } = await supabase
        .from('print_layouts')
        .select('*')
        .eq('print_type', printType)
        .eq('is_active', true)
        .eq('is_default', true)
        .single()

      if (!error && data) {
        setLayout(data)
      }
      setLoading(false)
    }

    fetchLayout()
  }, [printType, supabase])

  // Generate QR code
  useEffect(() => {
    const generatePreviewQR = async () => {
      try {
        const placeholderUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/f/preview`
        const qrDataUrl = await generateQRCode(placeholderUrl)
        setQrCodeUrl(qrDataUrl)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    generatePreviewQR()
  }, [])

  // Get actual paper dimensions in mm
  const getPaperDimensions = () => {
    switch (printType) {
      case 'A4_portrait':
        return { width: 210, height: 297 }
      case 'A5_portrait':
        return { width: 148, height: 210 }
      case 'A5_landscape':
        return { width: 210, height: 148 }
      default:
        return { width: 210, height: 297 }
    }
  }

  const dimensions = getPaperDimensions()
  const displayWidth = dimensions.width * scale
  const displayHeight = dimensions.height * scale

  // Get field value
  const getFieldValue = (field?: string) => {
    switch (field) {
      case 'business_name':
        return businessName
      case 'custom_message':
        return customMessage
      case 'contact_phone':
        return contactPhone
      case 'contact_email':
        return contactEmail
      case 'website':
        return website
      case 'funnel_name':
        return funnelName
      default:
        return ''
    }
  }

  // Render element based on type
  const renderElement = (element: LayoutElement) => {
    const elementStyle = {
      position: 'absolute' as const,
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      width: `${element.size.width}%`,
      height: element.type === 'qr_code' ? 'auto' : `${element.size.height}%`,
      transform: element.alignment === 'center' ? 'translateX(-50%)' : 'none',
      textAlign: element.alignment || 'left',
      display: 'flex',
      alignItems: 'center',
      justifyContent: element.alignment === 'center' ? 'center' : 
                      element.alignment === 'right' ? 'flex-end' : 'flex-start'
    }

    switch (element.type) {
      case 'qr_code':
        return qrCodeUrl ? (
          <Box
            key={element.id}
            style={elementStyle}
          >
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: '1/1'
              }}
            />
          </Box>
        ) : null

      case 'text':
        const value = getFieldValue(element.field)
        if (!value) return null
        
        return (
          <Box
            key={element.id}
            style={{
              ...elementStyle,
              fontSize: `${(element.fontSize || 14) * scale}px`,
              fontWeight: element.fontWeight || 'normal',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              color: '#000',
              lineHeight: 1.2,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {value}
          </Box>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Loading layout...</p>
      </Box>
    )
  }

  return (
    <Box>
      <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
        Print Preview
      </h3>
      
      {/* Paper Preview */}
      <Box
        position="relative"
        width={`${displayWidth}px`}
        height={`${displayHeight}px`}
        mx="auto"
        bg="white"
        borderWidth="1px"
        borderColor="border.default"
        boxShadow="md"
        overflow="hidden"
      >
        {/* Render layout elements */}
        {layout?.layout_config?.elements?.map(element => renderElement(element))}
      </Box>
      
      {/* Print Info */}
      <Box mt={3} textAlign="center">
        <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
          {printType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </p>
        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
          {dimensions.width} × {dimensions.height}mm
        </p>
      </Box>
    </Box>
  )
}