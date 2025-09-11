'use client'

import React, { useEffect, useState } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { createClient } from '@/lib/supabase/client'
import { LayoutTemplate, LayoutData, PageSize, PAGE_DIMENSIONS } from '@/lib/types/layout'
import PrintLayoutPreview from './PrintLayoutPreview'

interface DynamicPrintPreviewProps {
  layoutId: string
  data: LayoutData
  className?: string
}

export default function DynamicPrintPreview({
  layoutId,
  data,
  className
}: DynamicPrintPreviewProps) {
  const [layoutTemplate, setLayoutTemplate] = useState<LayoutTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const supabase = createClient()

  // Fetch layout template from database
  useEffect(() => {
    const fetchLayoutTemplate = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔍 Fetching layout for ID:', layoutId)
        
        const { data: template, error } = await supabase
          .from('print_layouts')
          .select('*')
          .eq('id', layoutId)
          .eq('is_active', true)
          .single()

        console.log('📄 Layout query result:', { template, error })

        if (error) {
          console.error('Database error:', error)
          setError(`Layout not found. Database error: ${error.message}`)
          return
        }

        if (!template) {
          setError(`Layout not found. Please check the layout ID.`)
          return
        }

        setLayoutTemplate(template)
        
      } catch (err) {
        console.error('Error fetching layout:', err)
        setError(`Failed to load layout. Please ensure database is properly configured.`)
      } finally {
        setLoading(false)
      }
    }

    fetchLayoutTemplate()
  }, [layoutId, supabase])

  const handlePreviewPDF = async () => {
    setGeneratingPDF(true)
    try {
      const response = await fetch('/api/generate-pdf-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          layoutId,
          data,
          returnDataURL: true  // Request PDF as data URL for preview
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('PDF Generation Error:', errorData)
        throw new Error(errorData.error || 'Failed to generate PDF')
      }

      const result = await response.json()
      setPdfUrl(result.dataURL)
      setShowPDFModal(true)
    } catch (error) {
      console.error('Failed to generate PDF preview:', error)
      setError('Failed to generate PDF preview')
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (loading) {
    return (
      <Box className={className} textAlign="center" py={4}>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Loading layout...</p>
      </Box>
    )
  }

  if (error) {
    return (
      <Box className={className} textAlign="center" py={4}>
        <p className={css({ fontSize: 'sm', color: 'red.500' })}>{error}</p>
      </Box>
    )
  }

  if (!layoutTemplate) {
    return (
      <Box className={className} textAlign="center" py={4}>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>No layout template loaded</p>
      </Box>
    )
  }

  return (
    <Box className={className}>
      {/* Live Layout Preview */}
      <Box display="flex" justifyContent="center" mb={4}>
        <PrintLayoutPreview
          printType={layoutTemplate.print_type as 'A4_portrait' | 'A5_portrait' | 'A5_landscape'}
          funnelName={data.funnel_name}
          businessName={data.business_name}
          customMessage={data.custom_message}
          contactPhone={data.phone}
          contactEmail={data.email}
          website={data.website}
          scale={0.3}
        />
      </Box>

      {/* Preview Button */}
      <Box display="flex" justifyContent="center">
        <button
          onClick={handlePreviewPDF}
          disabled={generatingPDF || !layoutTemplate}
          className={css({
            colorPalette: 'blue',
            px: 3,
            py: 2,
            fontSize: 'sm',
            fontWeight: 'medium',
            color: 'colorPalette.fg',
            bg: 'colorPalette.default',
            borderRadius: 'md',
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
          {generatingPDF ? 'Generating PDF...' : 'Generate PDF'}
        </button>
      </Box>
      
      {/* PDF Modal */}
      {showPDFModal && pdfUrl && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.8)"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setShowPDFModal(false)}
        >
          <Box
            position="relative"
            width="90vw"
            height="90vh"
            bg="white"
            borderRadius="lg"
            overflow="hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              position="absolute"
              top={2}
              right={2}
              zIndex={10}
            >
              <button
                onClick={() => setShowPDFModal(false)}
                className={css({
                  px: 3,
                  py: 2,
                  bg: 'red.500',
                  color: 'white',
                  borderRadius: 'md',
                  fontSize: 'sm',
                  cursor: 'pointer',
                  _hover: { bg: 'red.600' }
                })}
              >
                ✕ Close
              </button>
            </Box>
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="PDF Preview"
            />
          </Box>
        </Box>
      )}
    </Box>
  )
}