'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { CreateFunnelInput } from '@/lib/validations'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack, Grid, Container } from '@/styled-system/jsx'
import FunnelPreview from '@/components/FunnelPreview'
import { createClient } from '@/lib/supabase/client'
import { Business } from '@/lib/types'

export default function NewFunnelPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [, setFunnelCount] = useState<number>(0)
  const [defaultNameSet, setDefaultNameSet] = useState(false)
  const [existingFunnel, setExistingFunnel] = useState<Funnel | null>(null)
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
      type: 'contact',
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
  
  const selectedType = watchedType

  // Fetch business data and funnel count on component mount
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch business data
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', user.id)
          .single()
        if (businessData) setBusiness(businessData)

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
                setValue(`content.${key}` as keyof FunnelContent, funnelData.content[key as keyof FunnelContent])
              })
            }
            setDefaultNameSet(true)
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
      router.push(isEditMode ? '/dashboard' : `/dashboard/funnels/${funnel.id}`)
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