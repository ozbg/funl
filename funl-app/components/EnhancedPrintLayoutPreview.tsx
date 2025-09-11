'use client'

import React, { useEffect, useState } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { generateQRCode } from '@/lib/qr'
import { createClient } from '@/lib/supabase/client'
import { EnhancedLayoutElement, EnhancedPrintLayout, mergeSpacing, getLegacyAlignment, mergeElementWithDefaults } from '@/lib/types/layout-enhanced'

interface EnhancedPrintLayoutPreviewProps {
  printType: 'A4_portrait' | 'A5_portrait' | 'A5_landscape'
  funnelName?: string
  businessName?: string
  customMessage?: string
  contactPhone?: string
  contactEmail?: string
  website?: string
  scale?: number // For preview sizing
}

export default function EnhancedPrintLayoutPreview({
  printType,
  funnelName,
  businessName = 'Your Business',
  customMessage,
  contactPhone,
  contactEmail,
  website,
  scale = 0.3 // 30% of actual size for preview
}: EnhancedPrintLayoutPreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [layout, setLayout] = useState<EnhancedPrintLayout | null>(null)
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
        setLayout(data as EnhancedPrintLayout)
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

  // Apply text transform
  const getTransformedText = (text: string, transform?: string) => {
    switch (transform) {
      case 'uppercase': return text.toUpperCase()
      case 'lowercase': return text.toLowerCase()
      case 'capitalize': return text.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
      default: return text
    }
  }

  // Get vertical alignment styles
  const getVerticalAlignStyles = (element: EnhancedLayoutElement) => {
    const textAlign = getLegacyAlignment(element)
    switch (element.verticalAlign) {
      case 'middle':
        return {
          display: 'flex',
          alignItems: 'center',
          justifyContent: textAlign === 'center' ? 'center' : 
                         textAlign === 'right' ? 'flex-end' : 'flex-start'
        }
      case 'bottom':
        return {
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: textAlign === 'center' ? 'center' : 
                         textAlign === 'right' ? 'flex-end' : 'flex-start'
        }
      default:
        return {
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: textAlign === 'center' ? 'center' : 
                         textAlign === 'right' ? 'flex-end' : 'flex-start'
        }
    }
  }

  // Render element based on type
  const renderElement = (elementData: any) => {
    // Merge with defaults to ensure all properties exist
    const element = mergeElementWithDefaults(elementData)
    
    const padding = mergeSpacing(element.padding)
    const margin = mergeSpacing(element.margin)
    
    const elementStyle = {
      position: 'absolute' as const,
      left: `${element.position.x + margin.left}%`,
      top: `${element.position.y + margin.top}%`,
      width: `${element.size.width - margin.left - margin.right}%`,
      height: element.type === 'qr_code' ? 'auto' : `${element.size.height - margin.top - margin.bottom}%`,
    }

    switch (element.type) {
      case 'qr_code':
        return qrCodeUrl ? (
          <Box
            key={element.id}
            style={{
              ...elementStyle,
              transform: `rotate(${element.rotation || 0}deg)`,
              transformOrigin: 'center',
              opacity: element.opacity ?? 1,
            }}
          >
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: '1/1',
                borderRadius: `${element.borderRadius || 0}%`,
                border: element.borderWidth ? `${element.borderWidth}px ${element.borderStyle || 'solid'} ${element.borderColor || '#000'}` : 'none',
              }}
            />
          </Box>
        ) : null

      case 'text':
        const value = getFieldValue(element.field)
        if (!value) return null
        
        const textAlign = element.textAlign === 'justify' ? 'justify' : getLegacyAlignment(element)
        
        return (
          <Box
            key={element.id}
            style={{
              ...elementStyle,
              ...getVerticalAlignStyles(element),
              padding: `${padding.top}% ${padding.right}% ${padding.bottom}% ${padding.left}%`,
              fontSize: `${(element.fontSize || 14) * scale}px`,
              fontWeight: element.fontWeight || 'normal',
              fontFamily: element.fontFamily || 'system-ui, -apple-system, sans-serif',
              fontStyle: element.fontStyle || 'normal',
              color: element.color || '#000',
              backgroundColor: element.backgroundColor || 'transparent',
              lineHeight: element.lineHeight || 1.2,
              letterSpacing: `${element.letterSpacing || 0}px`,
              textAlign: textAlign as any,
              textDecoration: element.textDecoration || 'none',
              whiteSpace: element.wordWrap === 'no-wrap' ? 'nowrap' : 'pre-wrap',
              wordBreak: element.wordWrap === 'break-word' ? 'break-word' : 'normal',
              overflow: element.overflow || 'visible',
              textOverflow: element.overflow === 'ellipsis' ? 'ellipsis' : 'clip',
              transform: `rotate(${element.rotation || 0}deg)`,
              transformOrigin: 'center',
              opacity: element.opacity ?? 1,
              border: element.borderWidth ? `${element.borderWidth}px ${element.borderStyle || 'solid'} ${element.borderColor || '#000'}` : 'none',
              borderRadius: `${element.borderRadius || 0}%`,
              boxShadow: element.shadow ? 
                `${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.color}` : 
                'none'
            }}
          >
            <span style={{ width: '100%', textAlign: textAlign as any }}>
              {getTransformedText(value, element.textTransform)}
            </span>
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
        bg={layout?.layout_config?.backgroundColor || 'white'}
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