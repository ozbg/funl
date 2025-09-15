'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack } from '@/styled-system/jsx'
import { Star } from 'lucide-react'

interface TestimonialFormData {
  name: string
  suburb: string
  comment: string
  rating?: number
  email?: string
  phone?: string
}

interface TestimonialSubmissionFormProps {
  businessId: string
  funnelId?: string
  onSuccess?: () => void
  settings?: {
    require_email: boolean
    require_rating: boolean
    min_comment_length: number
    max_comment_length: number
  }
}

export default function TestimonialSubmissionForm({
  businessId,
  funnelId,
  onSuccess,
  settings = {
    require_email: false,
    require_rating: false,
    min_comment_length: 10,
    max_comment_length: 500
  }
}: TestimonialSubmissionFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<TestimonialFormData>({
    defaultValues: {
      name: '',
      suburb: '',
      comment: '',
      rating: undefined,
      email: '',
      phone: ''
    }
  })

  const commentLength = watch('comment')?.length || 0

  const onSubmit = async (data: TestimonialFormData) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Clean up empty strings for optional fields
      const payload = {
        ...data,
        business_id: businessId,
        ...(funnelId && { funnel_id: funnelId }),
        rating: selectedRating || undefined,
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined
      }

      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit testimonial')
      }

      setSuccess(true)
      onSuccess?.()
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
    borderRadius: 'md',
    boxShadow: 'sm',
    bg: 'bg.default',
    color: 'fg.default',
    fontSize: 'sm',
    _focus: {
      outline: 'none',
      ringWidth: '2',
      ringColor: 'colorPalette.default',
      borderColor: 'colorPalette.default',
    },
    _placeholder: {
      color: 'fg.muted'
    }
  })

  const buttonStyles = css({
    colorPalette: 'mint',
    w: 'full',
    px: 6,
    py: 3,
    borderRadius: 'md',
    fontSize: 'sm',
    fontWeight: 'semibold',
    color: 'colorPalette.fg',
    bg: 'colorPalette.default',
    cursor: 'pointer',
    transition: 'all 0.2s',
    _hover: {
      bg: 'colorPalette.emphasized',
      transform: 'translateY(-1px)',
      boxShadow: 'lg'
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
      _hover: {
        transform: 'none',
        boxShadow: 'sm'
      }
    },
  })

  const StarRating = ({ value }: { value: number | null }) => (
    <Flex gap={1} align="center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={(e) => {
            e.preventDefault()
            console.log(`Star ${star} clicked`) // Debug log
            setSelectedRating(star)
            setValue('rating', star)
          }}
          style={{
            padding: '8px',
            borderRadius: '4px',
            transition: 'all 0.2s',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '32px',
            minHeight: '32px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label={`Rate ${star} out of 5 stars`}
        >
          <Star
            size={24}
            style={{
              color: star <= (value || 0) ? '#eab308' : '#d1d5db',
              fill: star <= (value || 0) ? '#eab308' : 'transparent',
              transition: 'all 0.2s',
              pointerEvents: 'none' // Prevent star from interfering with button clicks
            }}
          />
        </button>
      ))}
    </Flex>
  )

  if (success) {
    return (
      <Box
        p={8}
        textAlign="center"
        bg="green.50"
        borderRadius="lg"
        border="1px solid"
        borderColor="green.200"
      >
        <Box mb={4}>
          <div className={css({ fontSize: '3xl', mb: 2 })}>🎉</div>
          <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'green.700', mb: 2 })}>
            Thank You!
          </h2>
          <p className={css({ color: 'green.600', fontSize: 'sm' })}>
            Your testimonial has been submitted successfully and is now under review.
          </p>
        </Box>
      </Box>
    )
  }

  return (
    <Box className={css({ colorPalette: 'mint', maxW: 'md', mx: 'auto' })}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={6}>
          <Box textAlign="center" mb={2}>
            <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default', mb: 2 })}>
              Share Your Experience
            </h1>
            <p className={css({ color: 'fg.muted', fontSize: 'sm' })}>
              We&apos;d love to hear about your experience with us
            </p>
          </Box>

          {error && (
            <Box bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md" p={4}>
              <p className={css({ fontSize: 'sm', color: 'red.700' })}>{error}</p>
            </Box>
          )}

          <Stack gap={4}>
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Your Name *
              </label>
              <input
                type="text"
                {...register('name', {
                  required: 'Your name is required',
                  maxLength: { value: 100, message: 'Name must be less than 100 characters' }
                })}
                className={inputStyles}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className={css({ mt: 1, fontSize: 'sm', color: 'red.500' })}>{errors.name.message}</p>
              )}
            </Box>

            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Location *
              </label>
              <input
                type="text"
                {...register('suburb', {
                  required: 'Location is required',
                  maxLength: { value: 100, message: 'Location must be less than 100 characters' }
                })}
                className={inputStyles}
                placeholder="e.g. Sydney, NSW"
              />
              {errors.suburb && (
                <p className={css({ mt: 1, fontSize: 'sm', color: 'red.500' })}>{errors.suburb.message}</p>
              )}
            </Box>

            {settings.require_rating && (
              <Box>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                  Rating *
                </label>
                <StarRating value={selectedRating} />
                {/* Debug info - remove after fixing */}
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                  Selected: {selectedRating || 'None'}
                </p>
                {settings.require_rating && !selectedRating && (
                  <p className={css({ mt: 1, fontSize: 'sm', color: 'red.500' })}>Please provide a rating</p>
                )}
              </Box>
            )}

            {!settings.require_rating && (
              <Box>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                  Rating (optional)
                </label>
                <StarRating value={selectedRating} />
                {/* Debug info - remove after fixing */}
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                  Selected: {selectedRating || 'None'}
                </p>
              </Box>
            )}

            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <label className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default' })}>
                  Your Experience *
                </label>
                <span className={css({
                  fontSize: 'xs',
                  color: commentLength > settings.max_comment_length ? 'red.500' : 'fg.muted'
                })}>
                  {commentLength}/{settings.max_comment_length}
                </span>
              </Flex>
              <textarea
                {...register('comment', {
                  required: 'Please share your experience',
                  minLength: {
                    value: settings.min_comment_length,
                    message: `Comment must be at least ${settings.min_comment_length} characters`
                  },
                  maxLength: {
                    value: settings.max_comment_length,
                    message: `Comment must be less than ${settings.max_comment_length} characters`
                  }
                })}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  borderRadius: 'md',
                  boxShadow: 'sm',
                  bg: 'bg.default',
                  color: 'fg.default',
                  fontSize: 'sm',
                  minH: '120px',
                  resize: 'vertical',
                  _focus: {
                    outline: 'none',
                    ringWidth: '2',
                    ringColor: 'colorPalette.default',
                    borderColor: 'colorPalette.default',
                  },
                  _placeholder: {
                    color: 'fg.muted'
                  }
                })}
                placeholder="Tell us about your experience..."
                rows={4}
              />
              {errors.comment && (
                <p className={css({ mt: 1, fontSize: 'sm', color: 'red.500' })}>{errors.comment.message}</p>
              )}
            </Box>

            {settings.require_email ? (
              <Box>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  className={inputStyles}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className={css({ mt: 1, fontSize: 'sm', color: 'red.500' })}>{errors.email.message}</p>
                )}
              </Box>
            ) : (
              <Box>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                  Email Address (optional)
                </label>
                <input
                  type="email"
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  className={inputStyles}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className={css({ mt: 1, fontSize: 'sm', color: 'red.500' })}>{errors.email.message}</p>
                )}
              </Box>
            )}

            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Phone Number (optional)
              </label>
              <input
                type="tel"
                {...register('phone')}
                className={inputStyles}
                placeholder="+61 400 000 000"
              />
            </Box>
          </Stack>

          <Box pt={4}>
            <button
              type="submit"
              disabled={loading || (settings.require_rating && !selectedRating)}
              className={buttonStyles}
            >
              {loading ? 'Submitting...' : 'Submit Testimonial'}
            </button>
          </Box>

          <Box textAlign="center">
            <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
              Your testimonial will be reviewed before being published
            </p>
          </Box>
        </Stack>
      </form>
    </Box>
  )
}