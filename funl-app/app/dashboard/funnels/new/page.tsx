'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { CreateFunnelInput } from '@/lib/validations'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack, Grid, Container } from '@/styled-system/jsx'

export default function NewFunnelPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateFunnelInput>({
    defaultValues: {
      type: 'contact',
      print_size: 'A4',
      content: {}
    }
  })

  const selectedType = watch('type')

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
    borderRadius: 'none',
    boxShadow: 'sm',
    bg: 'bg.default',
    color: 'fg.default',
    _focus: {
      outline: 'none',
      ringWidth: '2px',
      ringColor: 'accent.default',
      borderColor: 'accent.default',
    },
  })

  const buttonPrimaryStyles = css({
    px: 4,
    py: 2,
    borderRadius: 'none',
    boxShadow: 'sm',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'neutral.fg',
    bg: 'accent.default',
    cursor: 'pointer',
    _hover: {
      bg: 'accent.emphasis',
    },
    _focus: {
      outline: 'none',
      ringWidth: '2px',
      ringOffset: '2px',
      ringColor: 'accent.default',
    },
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  })

  const buttonSecondaryStyles = css({
    px: 4,
    py: 2,
    borderWidth: '1px',
    borderColor: 'border.default',
    borderRadius: 'none',
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
      ringWidth: '2px',
      ringOffset: '2px',
      ringColor: 'accent.default',
    },
  })

  return (
    <Container maxW="2xl" mx="auto">
      <Box bg="bg.default" boxShadow="md" borderRadius="lg">
        <Box px={{ base: 4, sm: 6 }} py={5}>
          <h1 className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'fg.default', mb: 6 })}>
            Create New Funnel
          </h1>
          
          {error && (
            <Box mb={4} borderRadius="md" bg="red.50" p={4}>
              <p className={css({ fontSize: 'sm', color: 'red.800' })}>{error}</p>
            </Box>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap={6}>
              {/* Basic Info */}
              <Box>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                  Funnel Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className={inputStyles}
                  placeholder="e.g., Property for Sale - 123 Main St"
                />
                {errors.name && (
                  <p className={css({ mt: 1, fontSize: 'sm', color: 'red.600' })}>{errors.name.message}</p>
                )}
              </Box>

              {/* Funnel Type */}
              <Box>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
                  Funnel Type
                </label>
                <Grid columns={{ base: 1, sm: 3 }} gap={3}>
                  <Box as="label" cursor="pointer">
                    <input
                      type="radio"
                      {...register('type')}
                      value="contact"
                      className={css({ position: 'absolute', opacity: 0 })}
                    />
                    <Box
                      p={4}
                      borderWidth="1px"
                      borderRadius="lg"
                      textAlign="center"
                      borderColor={selectedType === 'contact' ? 'accent.default' : 'border.default'}
                      bg={selectedType === 'contact' ? 'mint.50' : 'bg.default'}
                      color={selectedType === 'contact' ? 'mint.700' : 'fg.default'}
                      _hover={selectedType !== 'contact' ? { borderColor: 'border.default' } : {}}
                    >
                      <h3 className={css({ fontWeight: 'medium' })}>Contact Only</h3>
                      <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
                        Simple contact card download
                      </p>
                    </Box>
                  </Box>

                  <Box as="label" cursor="pointer">
                    <input
                      type="radio"
                      {...register('type')}
                      value="property"
                      className={css({ position: 'absolute', opacity: 0 })}
                    />
                    <Box
                      p={4}
                      borderWidth="1px"
                      borderRadius="lg"
                      textAlign="center"
                      borderColor={selectedType === 'property' ? 'accent.default' : 'border.default'}
                      bg={selectedType === 'property' ? 'mint.50' : 'bg.default'}
                      color={selectedType === 'property' ? 'mint.700' : 'fg.default'}
                      _hover={selectedType !== 'property' ? { borderColor: 'border.default' } : {}}
                    >
                      <h3 className={css({ fontWeight: 'medium' })}>Property</h3>
                      <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
                        Contact + property details
                      </p>
                    </Box>
                  </Box>

                  <Box as="label" cursor="pointer">
                    <input
                      type="radio"
                      {...register('type')}
                      value="video"
                      className={css({ position: 'absolute', opacity: 0 })}
                    />
                    <Box
                      p={4}
                      borderWidth="1px"
                      borderRadius="lg"
                      textAlign="center"
                      borderColor={selectedType === 'video' ? 'accent.default' : 'border.default'}
                      bg={selectedType === 'video' ? 'mint.50' : 'bg.default'}
                      color={selectedType === 'video' ? 'mint.700' : 'fg.default'}
                      _hover={selectedType !== 'video' ? { borderColor: 'border.default' } : {}}
                    >
                      <h3 className={css({ fontWeight: 'medium' })}>Video</h3>
                      <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
                        Contact + video message
                      </p>
                    </Box>
                  </Box>
                </Grid>
              </Box>

              {/* Content Fields */}
              <Stack gap={4}>
                <Box>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                    Headline (Optional)
                  </label>
                  <input
                    type="text"
                    {...register('content.headline')}
                    className={inputStyles}
                    placeholder="e.g., Beautiful Family Home for Sale"
                  />
                </Box>

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
                  <textarea
                    {...register('content.custom_message')}
                    rows={3}
                    className={inputStyles}
                    placeholder="Add any additional message..."
                  />
                </Box>
              </Stack>

              {/* Print Size */}
              <Box>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
                  Print Size
                </label>
                <Flex gap={4}>
                  <Box as="label" display="flex" align="center">
                    <input
                      type="radio"
                      {...register('print_size')}
                      value="A4"
                      className={css({ h: 4, w: 4, color: 'accent.default', borderColor: 'border.default' })}
                    />
                    <span className={css({ ml: 2, fontSize: 'sm', color: 'fg.default' })}>A4 (Standard)</span>
                  </Box>
                  <Box as="label" display="flex" align="center">
                    <input
                      type="radio"
                      {...register('print_size')}
                      value="A5"
                      className={css({ h: 4, w: 4, color: 'accent.default', borderColor: 'border.default' })}
                    />
                    <span className={css({ ml: 2, fontSize: 'sm', color: 'fg.default' })}>A5 (Compact)</span>
                  </Box>
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
    </Container>
  )
}