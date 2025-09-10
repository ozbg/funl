'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { CreateFunnelInput } from '@/lib/validations'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack, Grid, Container } from '@/styled-system/jsx'
import FunnelPreview from '@/components/FunnelPreview'
import DynamicPrintPreview from '@/components/DynamicPrintPreview'
import { createClient } from '@/lib/supabase/client'
import { Business } from '@/lib/types'
import { downloadLayoutPDF, generatePDFFilename } from '@/lib/pdf-utils'

export default function NewFunnelPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateFunnelInput>({
    defaultValues: {
      type: 'contact',
      print_type: 'A4-portrait',
      content: {}
    }
  })

  // Watch specific form fields to trigger re-renders
  const watchedName = watch('name')
  const watchedType = watch('type') 
  const watchedState = watch('content.state')
  const watchedPrice = watch('content.price')
  const watchedPropertyUrl = watch('content.property_url')
  const watchedVideoUrl = watch('content.video_url')
  const watchedCustomMessage = watch('content.custom_message')
  const watchedPrintType = watch('print_type')
  
  const selectedType = watchedType

  // Fetch business data on component mount
  useEffect(() => {
    const fetchBusiness = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', user.id)
          .single()
        if (data) setBusiness(data)
      }
    }
    fetchBusiness()
  }, [supabase])

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true)
    try {
      const pdfData = {
        business_name: business?.name,
        funnel_name: watchedName,
        custom_message: watchedCustomMessage,
        phone: business?.phone,
        email: business?.email,
        website: business?.website,
        contact_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/f/preview`
      }

      const filename = generatePDFFilename(
        business?.name,
        watchedName,
        watchedPrintType || 'A4-portrait'
      )

      await downloadLayoutPDF(
        watchedPrintType || 'A4-portrait',
        pdfData,
        filename
      )
    } catch (error) {
      console.error('Failed to download PDF:', error)
      setError('Failed to download PDF. Please try again.')
    } finally {
      setDownloadingPDF(false)
    }
  }

  const onSubmit = async (data: CreateFunnelInput) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create funnel')
      }

      const { data: funnel } = await response.json()
      router.push(`/dashboard/funnels/${funnel.id}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const inputStyles = css({
    w: 'full',
    px: 3,
    py: 2,
    borderWidth: '1px',
    borderColor: 'border.default',
    boxShadow: 'sm',
    bg: 'bg.default',
    color: 'fg.default',
    _focus: {
      outline: 'none',
      ringWidth: '2',
      ringColor: 'colorPalette.default',
      borderColor: 'colorPalette.default',
    },
  })

  const buttonPrimaryStyles = css({
    colorPalette: 'mint',
    px: 4,
    py: 2,
    boxShadow: 'sm',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'colorPalette.fg',
    bg: 'colorPalette.default',
    cursor: 'pointer',
    _hover: {
      bg: 'colorPalette.emphasized',
    },
    _focus: {
      outline: 'none',
      ringWidth: '2',
      ringOffset: '2',
      ringColor: 'colorPalette.default',
    },
    _disabled: {
      opacity: 'disabled',
      cursor: 'not-allowed',
    },
  })

  const buttonSecondaryStyles = css({
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
    _focus: {
      outline: 'none',
      ringWidth: '2',
      ringOffset: '2',
      ringColor: 'colorPalette.default',
    },
  })

  return (
    <Container maxW="7xl" mx="auto">
      <h1 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'fg.default', mb: 8, textAlign: 'center' })}>
        Create New Funnel
      </h1>
      
      <Grid columns={{ base: 1, lg: 2 }} gap={8}>
        {/* Form Column */}
        <Box>
          <Box bg="bg.default" boxShadow="md">
            <Box px={{ base: 4, sm: 6 }} py={5}>
          
          {error && (
            <Box mb={4} colorPalette="red" bg="colorPalette.default" p={4}>
              <p className={css({ colorPalette: 'red', fontSize: 'sm', color: 'colorPalette.fg' })}>{error}</p>
            </Box>
          )}

          <form className={css({ colorPalette: 'mint' })} onSubmit={handleSubmit(onSubmit)}>
            <Stack gap={6}>
              {/* Basic Info */}
              <Box>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                  Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className={inputStyles}
                  placeholder=""
                />
                {errors.name && (
                  <p className={css({ colorPalette: 'red', mt: 1, fontSize: 'sm', color: 'colorPalette.text' })}>{errors.name.message}</p>
                )}
              </Box>

              {/* Funnel Type */}
              <Box>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
                  Type
                </label>
                <Grid columns={{ base: 1, sm: 3 }} gap={3}>
                  <label className={css({ cursor: 'pointer' })}>
                    <input
                      type="radio"
                      {...register('type')}
                      value="contact"
                      className={css({ position: 'absolute', opacity: 0 })}
                    />
                    <Box
                      p={4}
                      borderWidth="1px"
                                           textAlign="center"
                      borderColor={selectedType === 'contact' ? 'colorPalette.default' : 'border.default'}
                      colorPalette={selectedType === 'contact' ? 'mint' : undefined}
                      bg={selectedType === 'contact' ? 'colorPalette.subtle' : 'bg.default'}
                      color={selectedType === 'contact' ? 'colorPalette.text' : 'fg.default'}
                      _hover={selectedType !== 'contact' ? { borderColor: 'border.default' } : {}}
                    >
                      <h3 className={css({ fontWeight: 'medium' })}>Contact Card</h3>
                    </Box>
                  </label>

                  <label className={css({ cursor: 'pointer' })}>
                    <input
                      type="radio"
                      {...register('type')}
                      value="property"
                      className={css({ position: 'absolute', opacity: 0 })}
                    />
                    <Box
                      p={4}
                      borderWidth="1px"
                                           textAlign="center"
                      borderColor={selectedType === 'property' ? 'colorPalette.default' : 'border.default'}
                      colorPalette={selectedType === 'property' ? 'mint' : undefined}
                      bg={selectedType === 'property' ? 'colorPalette.subtle' : 'bg.default'}
                      color={selectedType === 'property' ? 'colorPalette.text' : 'fg.default'}
                      _hover={selectedType !== 'property' ? { borderColor: 'border.default' } : {}}
                    >
                      <h3 className={css({ fontWeight: 'medium' })}>+ Details</h3>
                    </Box>
                  </label>

                  <label className={css({ cursor: 'pointer' })}>
                    <input
                      type="radio"
                      {...register('type')}
                      value="video"
                      className={css({ position: 'absolute', opacity: 0 })}
                    />
                    <Box
                      p={4}
                      borderWidth="1px"
                                           textAlign="center"
                      borderColor={selectedType === 'video' ? 'colorPalette.default' : 'border.default'}
                      colorPalette={selectedType === 'video' ? 'mint' : undefined}
                      bg={selectedType === 'video' ? 'colorPalette.subtle' : 'bg.default'}
                      color={selectedType === 'video' ? 'colorPalette.text' : 'fg.default'}
                      _hover={selectedType !== 'video' ? { borderColor: 'border.default' } : {}}
                    >
                      <h3 className={css({ fontWeight: 'medium' })}>+ Video</h3>
                    </Box>
                  </label>
                </Grid>
              </Box>

              {/* Content Fields */}
              <Stack gap={4}>

                {selectedType === 'property' && (
                  <>
                    <Box>
                      <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                        Property State
                      </label>
                      <select
                        {...register('content.state')}
                        className={inputStyles}
                      >
                        <option value="">Select state</option>
                        <option value="for_sale">For Sale</option>
                        <option value="sold">Sold</option>
                        <option value="coming_soon">Coming Soon</option>
                      </select>
                    </Box>

                    <Box>
                      <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                        Price (Optional)
                      </label>
                      <input
                        type="text"
                        {...register('content.price')}
                        className={inputStyles}
                        placeholder="e.g., $750,000"
                      />
                    </Box>

                    <Box>
                      <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                        Property Link (Optional)
                      </label>
                      <input
                        type="url"
                        {...register('content.property_url')}
                        className={inputStyles}
                        placeholder="https://realestate.com.au/property/123"
                      />
                    </Box>
                  </>
                )}

                {selectedType === 'video' && (
                  <Box>
                    <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                      Video URL (Optional)
                    </label>
                    <input
                      type="url"
                      {...register('content.video_url')}
                      className={inputStyles}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </Box>
                )}

                <Box>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                    Custom Message (Optional)
                  </label>
                  <input
                    type="text"
                    {...register('content.custom_message')}
                    className={inputStyles}
                    placeholder="Add any additional message..."
                  />
                </Box>
              </Stack>

              {/* Print Type */}
              <Box>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                  Print Type
                </label>
                <select
                  {...register('print_type')}
                  className={inputStyles}
                >
                  <option value="A4-portrait">A4 Portrait</option>
                  <option value="A4-landscape">A4 Landscape</option>
                  <option value="A5-landscape">A5 Landscape</option>
                  <option value="business-card-landscape">Business Card</option>
                </select>
              </Box>

              {/* Print Preview */}
              <Box mt={4}>
                <DynamicPrintPreview 
                  pageSize={watchedPrintType || 'A4-portrait'}
                  data={{
                    business_name: business?.name || 'Sample Business Name',
                    funnel_name: watchedName || 'Sample Funnel',
                    custom_message: watchedCustomMessage || 'Your custom message here',
                    phone: business?.phone || '+61 400 123 456',
                    email: business?.email || 'contact@business.com',
                    website: business?.website || 'www.business.com',
                    contact_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/f/preview`
                  }}
                />
                
                {/* Download PDF Button */}
                <Flex justify="center" mt={3}>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
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
                    {downloadingPDF ? 'Generating PDF...' : 'Download PDF'}
                  </button>
                </Flex>
              </Box>

              {/* Actions */}
              <Flex justify="end" gap={3} pt={6} borderTop="1px solid" borderColor="border.default">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className={buttonSecondaryStyles}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={buttonPrimaryStyles}
                >
                  {loading ? 'Creating...' : 'Create Funnel'}
                </button>
              </Flex>
            </Stack>
          </form>
            </Box>
          </Box>
        </Box>
        
        {/* Preview Column */}
        <Box>
          <Box bg="bg.default" boxShadow="md" p={6} position="sticky" top={6}>
            <FunnelPreview 
              key={`${watchedType}-${watchedName}-${watchedState}-${watchedPrice}-${watchedCustomMessage}`}
              formData={{
                name: watchedName || '',
                type: watchedType || 'contact',
                content: {
                  state: watchedState || '',
                  price: watchedPrice || '',
                  property_url: watchedPropertyUrl || '',
                  video_url: watchedVideoUrl || '',
                  custom_message: watchedCustomMessage || ''
                }
              }}
              businessName={business?.name || 'Your Business'}
              contactName={business?.vcard_data ? `${business.vcard_data.firstName} ${business.vcard_data.lastName}` : undefined}
            />
          </Box>
        </Box>
      </Grid>
    </Container>
  )
}