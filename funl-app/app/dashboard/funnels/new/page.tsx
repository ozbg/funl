'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { CreateFunnelInput } from '@/lib/validations'
import { Funnel, Business, FunnelContent } from '@/lib/types'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack, Grid, Container } from '@/styled-system/jsx'
import FunnelPreview from '@/components/FunnelPreview'
import FunnelTestimonialSettings from '@/components/testimonials/FunnelTestimonialSettings'
import { createClient } from '@/lib/supabase/client'
import CodeSelectionModal from '@/components/CodeSelectionModal'

export default function NewFunnelPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [business, setBusiness] = useState<(Business & { business_categories?: { id: string, name: string } }) | null>(null)
  const [, setFunnelCount] = useState<number>(0)
  const [defaultNameSet, setDefaultNameSet] = useState(false)
  const [existingFunnel, setExistingFunnel] = useState<Funnel | null>(null)
  const [availableFunnelTypes, setAvailableFunnelTypes] = useState<Array<{id: string, name: string, slug: string, description: string | null, is_custom: boolean, created_at: string, updated_at: string | null}>>([])
  const [testimonialConfig, setTestimonialConfig] = useState<{enabled: boolean, display_count: number, display_style: 'carousel'|'grid'|'list', position: 'top'|'bottom'|'sidebar', minimum_rating: number, show_featured_only: boolean, show_share_button: boolean} | null>(null)
  const [showCodeSelection, setShowCodeSelection] = useState(false)
  const [createdFunnelId, setCreatedFunnelId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const editId = searchParams.get('edit')
  const isEditMode = !!editId

  // Generate default name with ID and date
  const generateDefaultName = (count: number) => {
    const now = new Date()
    const day = now.getDate()
    const month = now.toLocaleDateString('en-US', { month: 'short' })
    const year = now.getFullYear()
    return `${count + 1} - ${day} ${month} ${year}`
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateFunnelInput>({
    defaultValues: {
      name: '',
      type: 'contact-card',
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
  const watchedVideoAutoplay = watch('content.video_autoplay')
  const watchedCustomMessage = watch('content.custom_message')
  
  const selectedType = watchedType

  // Fetch business data and funnel count on component mount
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch business data
        const { data: businessData } = await supabase
          .from('businesses')
          .select(`
            *,
            business_categories(*)
          `)
          .eq('id', user.id)
          .single()
        
        if (businessData) {
          setBusiness(businessData)
          
          // Fetch available funnel types for the user's business category
          if (businessData.business_category_id) {
            const { data: funnelTypes } = await supabase
              .from('funnel_types')
              .select(`
                *,
                category_funnel_types!inner(
                  business_category_id
                )
              `)
              .eq('category_funnel_types.business_category_id', businessData.business_category_id)
              .eq('is_active', true)
              .order('sort_order', { ascending: true })
            
            if (funnelTypes) {
              setAvailableFunnelTypes(funnelTypes)
            }
            
          } else {
            // If no category assigned, show all active options
            const { data: funnelTypes } = await supabase
              .from('funnel_types')
              .select('*')
              .eq('is_active', true)
              .order('sort_order', { ascending: true })

            if (funnelTypes) setAvailableFunnelTypes(funnelTypes)
          }
        }

        // If editing, fetch existing funnel data
        if (isEditMode && editId) {
          const { data: funnelData } = await supabase
            .from('funnels')
            .select('*')
            .eq('id', editId)
            .eq('business_id', user.id)
            .single()
          
          if (funnelData) {
            setExistingFunnel(funnelData)
            setValue('name', funnelData.name)
            setValue('type', funnelData.type)
            if (funnelData.content) {
              Object.keys(funnelData.content).forEach(key => {
                setValue(`content.${key}` as "content.state" | "content.price" | "content.property_url" | "content.video_url" | "content.video_autoplay" | "content.custom_message" | "content.cta_button_text", funnelData.content[key as keyof FunnelContent])
              })
            }
            setDefaultNameSet(true)

            // Fetch testimonial config for existing funnel
            try {
              const configResponse = await fetch(`/api/funnels/${editId}/testimonials`)
              if (configResponse.ok) {
                const configData = await configResponse.json()
                setTestimonialConfig(configData.data)
              }
            } catch (error) {
              console.error('Error fetching testimonial config:', error)
            }
          }
        } else {
          // Fetch funnel count to generate default name for new funnels
          const { count } = await supabase
            .from('funnels')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', user.id)
          
          const funnelNumber = count || 0
          setFunnelCount(funnelNumber)
          
          // Set default name only once
          if (!defaultNameSet) {
            setValue('name', generateDefaultName(funnelNumber))
            setDefaultNameSet(true)
          }
        }
      }
    }
    fetchData()
  }, [supabase, setValue, defaultNameSet, isEditMode, editId])

  const onSubmit = async (data: CreateFunnelInput) => {
    setLoading(true)
    setError(null)

    try {
      const url = isEditMode ? `/api/funnels/${editId}` : '/api/funnels'
      const method = isEditMode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} funnel`)
      }

      const { data: funnel } = await response.json()

      if (isEditMode) {
        router.push('/dashboard')
      } else {
        // Show code selection modal for new funnels
        setCreatedFunnelId(funnel.id)
        setShowCodeSelection(true)
      }
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

  const handleCodeSelectionComplete = () => {
    setShowCodeSelection(false)
    router.push('/dashboard')
  }

  return (
    <Container maxW="7xl" mx="auto">
      {/* Code Selection Modal */}
      {createdFunnelId && (
        <CodeSelectionModal
          funnelId={createdFunnelId}
          isOpen={showCodeSelection}
          onClose={handleCodeSelectionComplete}
        />
      )}

      {isEditMode && existingFunnel ? (
        <Box mb={8}>
          <Flex align="center" justify="space-between">
            <Box>
              <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
                {existingFunnel.name}
              </h1>
              <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
                Created {new Date(existingFunnel.created_at).toISOString().split('T')[0]}
              </p>
            </Box>
            <Link
              href="/dashboard"
              className={css({
                px: 4,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                boxShadow: 'sm',
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'fg.default',
                bg: 'bg.default',
                textDecoration: 'none',
                _hover: {
                  bg: 'bg.muted',
                },
              })}
            >
              ← Back to Dashboard
            </Link>
          </Flex>
        </Box>
      ) : (
        <h1 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'fg.default', mb: 8, textAlign: 'center' })}>
          Create New Funnel
        </h1>
      )}
      
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
                  Funnel Type
                </label>
                {business?.business_categories && (
                  <Box mb={2} p={2} bg="bg.subtle" rounded="md">
                    <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                      Available for: {business?.business_categories?.name}
                    </span>
                  </Box>
                )}
                <Grid columns={{ base: 1, sm: availableFunnelTypes.length <= 2 ? availableFunnelTypes.length : 3 }} gap={3}>
                  {availableFunnelTypes.map((funnelType) => (
                    <label key={funnelType.id} className={css({ cursor: 'pointer' })}>
                      <input
                        type="radio"
                        {...register('type')}
                        value={funnelType.slug}
                        className={css({ position: 'absolute', opacity: 0 })}
                      />
                      <Box
                        p={4}
                        borderWidth="1px"
                        textAlign="center"
                        borderColor={selectedType === funnelType.slug ? 'colorPalette.default' : 'border.default'}
                        colorPalette={selectedType === funnelType.slug ? 'mint' : undefined}
                        bg={selectedType === funnelType.slug ? 'colorPalette.subtle' : 'bg.default'}
                        color={selectedType === funnelType.slug ? 'colorPalette.text' : 'fg.default'}
                        _hover={selectedType !== funnelType.slug ? { borderColor: 'border.default' } : {}}
                      >
                        <h3 className={css({ fontWeight: 'medium' })}>{funnelType.name}</h3>
                        {funnelType.description && (
                          <p className={css({ fontSize: 'xs', mt: 1, opacity: 0.8 })}>
                            {funnelType.description}
                          </p>
                        )}
                      </Box>
                    </label>
                  ))}
                </Grid>
                {availableFunnelTypes.length === 0 && (
                  <Box p={4} bg="bg.muted" rounded="md" textAlign="center">
                    <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                      No funnel types available for your business category.
                    </p>
                  </Box>
                )}
              </Box>

              {/* Content Fields */}
              <Stack gap={4}>

                {(selectedType === 'property' || selectedType === 'property-listing') && (
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

                {(selectedType === 'video' || selectedType === 'video-showcase') && (
                  <>
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
                    {watchedVideoUrl && (
                      <Box>
                        <label className={css({ display: 'flex', alignItems: 'center', fontSize: 'sm', color: 'fg.default', cursor: 'pointer' })}>
                          <input
                            type="checkbox"
                            {...register('content.video_autoplay')}
                            className={css({ mr: 2 })}
                          />
                          Auto-play video when opened
                        </label>
                        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1, ml: 6 })}>
                          Video will automatically start playing when the user clicks to watch
                        </p>
                      </Box>
                    )}
                  </>
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
                  {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Funnel' : 'Create Funnel')}
                </button>
              </Flex>
            </Stack>
          </form>
            </Box>
          </Box>

          {/* Testimonial Settings - Only show in edit mode for non-testimonial funnels */}
          {isEditMode && existingFunnel && selectedType !== 'testimonial' && (
            <Box mt={8}>
              <FunnelTestimonialSettings
                funnelId={existingFunnel.id}
                onConfigChange={setTestimonialConfig}
              />
            </Box>
          )}
        </Box>

        {/* Preview Column */}
        <Box>
          <Box bg="bg.default" boxShadow="md" p={6} position="sticky" top={6}>
            <FunnelPreview
              key={`${watchedType}-${watchedName}-${watchedState}-${watchedPrice}-${watchedCustomMessage}-${JSON.stringify(testimonialConfig)}`}
              formData={{
                name: watchedName || '',
                type: watchedType || 'contact-card',
                content: {
                  state: watchedState || '',
                  price: watchedPrice || '',
                  property_url: watchedPropertyUrl || '',
                  video_url: watchedVideoUrl || '',
                  video_autoplay: watchedVideoAutoplay || false,
                  custom_message: watchedCustomMessage || ''
                }
              }}
              businessName={business?.name || 'Your Business'}
              contactName={business?.vcard_data ? `${business.vcard_data.firstName} ${business.vcard_data.lastName}` : undefined}
              testimonialConfig={testimonialConfig}
            />
          </Box>
        </Box>
      </Grid>
    </Container>
  )
}