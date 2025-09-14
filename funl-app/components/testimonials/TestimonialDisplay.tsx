'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack } from '@/styled-system/jsx'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import type { Tables, DisplayStyle, DisplayPosition } from '@/lib/database.types'

interface TestimonialData {
  id: string
  name: string
  suburb: string
  comment: string
  rating: number | null
  featured: boolean
  submitted_at: string
  display_order: number | null
}

interface TestimonialDisplayProps {
  businessId: string
  config?: {
    enabled: boolean
    display_count: number
    display_style: DisplayStyle
    position: DisplayPosition
    minimum_rating: number
    show_featured_only: boolean
    theme_override?: {
      background_color?: string
      text_color?: string
      accent_color?: string
      border_radius?: number
      font_size?: string
    }
  }
}

export default function TestimonialDisplay({
  businessId,
  config = {
    enabled: true,
    display_count: 3,
    display_style: 'carousel',
    position: 'bottom',
    minimum_rating: 3,
    show_featured_only: false
  }
}: TestimonialDisplayProps) {
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!config.enabled) {
      setLoading(false)
      return
    }

    fetchTestimonials()
  }, [businessId, config.enabled])

  const fetchTestimonials = async () => {
    try {
      const params = new URLSearchParams({
        public: 'true',
        business_id: businessId,
        limit: config.display_count.toString()
      })

      console.log('TestimonialDisplay: Fetching testimonials with params:', params.toString())
      const response = await fetch(`/api/testimonials?${params}`)
      console.log('TestimonialDisplay: Response status:', response.status)

      if (!response.ok) throw new Error('Failed to fetch testimonials')

      const result = await response.json()
      console.log('TestimonialDisplay: Raw testimonials data:', result)

      let filteredTestimonials = result.data || []
      console.log('TestimonialDisplay: Initial testimonials count:', filteredTestimonials.length)

      // Apply filters
      if (config.show_featured_only) {
        filteredTestimonials = filteredTestimonials.filter((t: TestimonialData) => t.featured)
        console.log('TestimonialDisplay: After featured filter:', filteredTestimonials.length)
      }

      if (config.minimum_rating > 1) {
        filteredTestimonials = filteredTestimonials.filter(
          (t: TestimonialData) => t.rating === null || (t.rating && t.rating >= config.minimum_rating)
        )
        console.log('TestimonialDisplay: After rating filter (allowing null ratings):', filteredTestimonials.length)
      }

      const finalTestimonials = filteredTestimonials.slice(0, config.display_count)
      console.log('TestimonialDisplay: Final testimonials to display:', finalTestimonials)

      setTestimonials(finalTestimonials)
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      setError('Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const StarRating = ({ rating }: { rating: number | null }) => {
    if (!rating) return null

    return (
      <Flex gap={1} align="center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={css({
              color: star <= rating ? 'yellow.500' : 'gray.300',
              fill: star <= rating ? 'yellow.500' : 'transparent'
            })}
          />
        ))}
      </Flex>
    )
  }

  const TestimonialCard = ({ testimonial, isActive = true }: { testimonial: TestimonialData, isActive?: boolean }) => {
    const themeStyles = config.theme_override ? {
      backgroundColor: config.theme_override.background_color,
      color: config.theme_override.text_color,
      borderRadius: config.theme_override.border_radius ? `${config.theme_override.border_radius}px` : undefined,
      fontSize: config.theme_override.font_size
    } : {}

    return (
      <Box
        key={testimonial.id}
        className={css({
          bg: 'bg.default',
          border: '1px solid',
          borderColor: 'border.default',
          borderRadius: 'lg',
          p: 6,
          shadow: 'md',
          position: 'relative',
          transition: 'all 0.3s ease',
          opacity: isActive ? 1 : 0.7,
          transform: isActive ? 'scale(1)' : 'scale(0.95)'
        })}
        style={themeStyles}
      >
        <Quote
          size={24}
          className={css({
            position: 'absolute',
            top: 4,
            right: 4,
            color: config.theme_override?.accent_color || 'colorPalette.default',
            opacity: 0.3
          })}
        />

        <Stack gap={4}>
          <Box>
            <p className={css({
              fontSize: 'sm',
              lineHeight: 'relaxed',
              color: 'fg.default',
              fontStyle: 'italic'
            })}>
              "{testimonial.comment}"
            </p>
          </Box>

          <Flex justify="space-between" align="center">
            <Box>
              <p className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default' })}>
                {testimonial.name}
              </p>
              <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                {testimonial.suburb}
              </p>
            </Box>
            <StarRating rating={testimonial.rating} />
          </Flex>

          {testimonial.featured && (
            <Box className={css({ position: 'absolute', top: 2, left: 2 })}>
              <span className={css({
                bg: 'yellow.100',
                color: 'yellow.800',
                fontSize: 'xs',
                px: 2,
                py: 1,
                borderRadius: 'full',
                fontWeight: 'medium'
              })}>
                Featured
              </span>
            </Box>
          )}
        </Stack>
      </Box>
    )
  }

  console.log('TestimonialDisplay render check:', {
    enabled: config.enabled,
    loading,
    error,
    testimonialsLength: testimonials.length,
    config
  })

  if (!config.enabled || loading || error || testimonials.length === 0) {
    console.log('TestimonialDisplay: Returning null because:', {
      enabled: config.enabled,
      loading,
      error,
      testimonialsLength: testimonials.length
    })
    return null
  }

  const containerStyles = css({
    w: 'full',
    py: 8,
    ...(config.position === 'top' && { mb: 8 }),
    ...(config.position === 'bottom' && { mt: 8 }),
    ...(config.position === 'sidebar' && { maxW: 'sm' })
  })

  if (config.display_style === 'carousel') {
    return (
      <Box className={containerStyles}>
        <Stack gap={6}>
          <Box textAlign="center">
            <h3 className={css({
              fontSize: 'xl',
              fontWeight: 'bold',
              color: 'fg.default',
              mb: 2
            })}>
              What Our Customers Say
            </h3>
            <p className={css({
              fontSize: 'sm',
              color: 'fg.muted'
            })}>
              Real experiences from real customers
            </p>
          </Box>

          <Box>
            <TestimonialCard testimonial={testimonials[currentIndex]} />

            {testimonials.length > 1 && (
              <Flex justify="space-between" align="center" mt={4}>
                {/* Left Arrow */}
                <button
                  onClick={prevTestimonial}
                  className={css({
                    bg: 'bg.default',
                    border: '1px solid',
                    borderColor: 'border.default',
                    borderRadius: 'full',
                    p: 2,
                    shadow: 'md',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    _hover: {
                      bg: 'bg.muted',
                      transform: 'scale(1.05)'
                    }
                  })}
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Dot Indicators in Center */}
                <Flex gap={2}>
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={css({
                        w: 2,
                        h: 2,
                        borderRadius: 'full',
                        bg: index === currentIndex ? 'colorPalette.default' : 'bg.muted',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      })}
                    />
                  ))}
                </Flex>

                {/* Right Arrow */}
                <button
                  onClick={nextTestimonial}
                  className={css({
                    bg: 'bg.default',
                    border: '1px solid',
                    borderColor: 'border.default',
                    borderRadius: 'full',
                    p: 2,
                    shadow: 'md',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    _hover: {
                      bg: 'bg.muted',
                      transform: 'scale(1.05)'
                    }
                  })}
                >
                  <ChevronRight size={20} />
                </button>
              </Flex>
            )}
          </Box>
        </Stack>
      </Box>
    )
  }

  if (config.display_style === 'grid') {
    return (
      <Box className={containerStyles}>
        <Stack gap={6}>
          <Box textAlign="center">
            <h3 className={css({
              fontSize: 'xl',
              fontWeight: 'bold',
              color: 'fg.default',
              mb: 2
            })}>
              Customer Testimonials
            </h3>
          </Box>

          <Box
            className={css({
              display: 'grid',
              gridTemplateColumns: {
                base: '1fr',
                md: testimonials.length > 1 ? 'repeat(2, 1fr)' : '1fr',
                lg: testimonials.length > 2 ? 'repeat(3, 1fr)' : testimonials.length > 1 ? 'repeat(2, 1fr)' : '1fr'
              },
              gap: 6
            })}
          >
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </Box>
        </Stack>
      </Box>
    )
  }

  if (config.display_style === 'list') {
    return (
      <Box className={containerStyles}>
        <Stack gap={4}>
          <Box textAlign="center">
            <h3 className={css({
              fontSize: 'xl',
              fontWeight: 'bold',
              color: 'fg.default',
              mb: 2
            })}>
              Customer Reviews
            </h3>
          </Box>

          <Stack gap={4}>
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </Stack>
        </Stack>
      </Box>
    )
  }

  return null
}