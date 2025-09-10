'use client'

import React, { useEffect, useState } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { createClient } from '@/lib/supabase/client'
import { LayoutTemplate, LayoutData, PageSize, PAGE_DIMENSIONS } from '@/lib/types/layout'

interface DynamicPrintPreviewProps {
  pageSize: PageSize
  data: LayoutData
  className?: string
}

export default function DynamicPrintPreview({
  pageSize,
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

        const { data: template, error } = await supabase
          .from('layout_templates')
          .select('*')
          .eq('page_size', pageSize)
          .eq('is_active', true)
          .eq('is_default', true)
          .single()

        if (error) {
          console.error('Database error:', error)
          setError(`No layout template found for ${pageSize}. Please create one in the database.`)
          return
        }

        if (!template) {
          setError(`No layout template found for ${pageSize}. Please create one in the database.`)
          return
        }

        setLayoutTemplate(template)
        
      } catch (err) {
        console.error('Error fetching layout:', err)
        setError(`Failed to load layout for ${pageSize}. Please ensure database is properly configured.`)
      } finally {
        setLoading(false)
      }
    }

    fetchLayoutTemplate()
  }, [pageSize, supabase])

  const handlePreviewPDF = async () => {
    setGeneratingPDF(true)
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageSize,
          data,
          returnDataURL: true  // Request PDF as data URL for preview
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
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

  const dimensions = PAGE_DIMENSIONS[pageSize]

  return (
    <Box className={className}>
      <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
        Print Preview
      </h3>
      
      {/* Simple Preview Button */}
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="400px"
        height="300px"
        mx="auto"
        bg="gray.50"
        borderWidth="1px"
        borderColor="gray.300"
        borderRadius="md"
      >
        <button
          onClick={handlePreviewPDF}
          disabled={generatingPDF || !layoutTemplate}
          className={css({
            px: 6,
            py: 3,
            bg: 'blue.500',
            color: 'white',
            borderRadius: 'md',
            fontSize: 'sm',
            fontWeight: 'medium',
            cursor: 'pointer',
            _hover: { bg: 'blue.600' },
            _disabled: { 
              bg: 'gray.300',
              cursor: 'not-allowed',
              color: 'gray.500'
            }
          })}
        >
          {generatingPDF ? 'Generating Preview...' : 'Preview PDF'}
        </button>
        
        <p className={css({ fontSize: 'xs', color: 'gray.500', mt: 2, textAlign: 'center' })}>
          Click to preview the actual PDF output
        </p>
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
      
      {/* Print Info */}
      <Box mt={3} textAlign="center">
        <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
          {pageSize.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </p>
        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
          {dimensions.width} × {dimensions.height}mm
        </p>
        {layoutTemplate && (
          <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
            {layoutTemplate.name}
          </p>
        )}
      </Box>
    </Box>
  )
}