'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack } from '@/styled-system/jsx'
import type { DisplayStyle, DisplayPosition } from '@/lib/database.types'

interface TestimonialConfig {
  enabled: boolean
  display_count: number
  display_style: DisplayStyle
  position: DisplayPosition
  minimum_rating: number
  show_featured_only: boolean
}

interface FunnelTestimonialSettingsProps {
  funnelId: string
  onConfigChange?: (config: TestimonialConfig) => void
}

export default function FunnelTestimonialSettings({ funnelId, onConfigChange }: FunnelTestimonialSettingsProps) {
  const [config, setConfig] = useState<TestimonialConfig>({
    enabled: false,
    display_count: 3,
    display_style: 'carousel',
    position: 'bottom',
    minimum_rating: 3,
    show_featured_only: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [funnelId])

  const fetchConfig = async () => {
    try {
      const response = await fetch(`/api/funnels/${funnelId}/testimonials`)
      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          // Ensure all numeric fields are valid numbers
          const cleanedConfig = {
            ...data.data,
            display_count: parseInt(data.data.display_count) || 3,
            minimum_rating: parseInt(data.data.minimum_rating) || 3
          }
          setConfig(cleanedConfig)
        }
      }
    } catch (error) {
      console.error('Error fetching testimonial config:', error)
      setError('Failed to load testimonial settings')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Ensure data types are correct for API validation
      const configToSave: Record<string, unknown> = {
        ...config,
        display_count: parseInt(config.display_count.toString()) || 3,
        minimum_rating: parseInt(config.minimum_rating.toString()) || 3
      }

      // Remove null/undefined values and fields that shouldn't be in the request
      if (configToSave.theme_override === null || configToSave.theme_override === undefined) {
        delete configToSave.theme_override
      }

      // Remove funnel_id as it's passed in the URL path, not body
      if (configToSave.funnel_id) {
        delete configToSave.funnel_id
      }

      console.log('Saving testimonial config:', configToSave)

      const response = await fetch(`/api/funnels/${funnelId}/testimonials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToSave),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API validation error:', errorData)

        if (errorData.details) {
          console.error('Validation details:', errorData.details)
          const detailsMessage = errorData.details.map((d: { path?: string[]; message: string }) => `${d.path?.join('.')}: ${d.message}`).join(', ')
          throw new Error(`Validation failed: ${detailsMessage}`)
        }

        throw new Error(errorData.error || 'Failed to save settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving testimonial config:', error)
      setError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: keyof TestimonialConfig, value: string | number | boolean) => {
    let processedValue = value

    // Handle number inputs - convert to number and validate
    if (key === 'display_count' || key === 'minimum_rating') {
      const numValue = parseInt(String(value))
      processedValue = isNaN(numValue) ? (key === 'display_count' ? 3 : 3) : numValue
    }

    const newConfig = { ...config, [key]: processedValue }
    setConfig(newConfig)
    if (onConfigChange) {
      onConfigChange(newConfig)
    }
  }

  if (loading) {
    return (
      <Box p={6} bg="bg.default" boxShadow="sm">
        <p className={css({ color: 'fg.muted' })}>Loading testimonial settings...</p>
      </Box>
    )
  }

  return (
    <Box p={6} bg="bg.default" boxShadow="sm">
      <Flex align="center" justify="space-between" mb={6}>
        <Box>
          <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
            Testimonial Display
          </h2>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
            Show approved testimonials on this funnel to build social proof
          </p>
        </Box>
        <label className={css({ display: 'flex', alignItems: 'center', gap: 2 })}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className={css({
              w: 4,
              h: 4,
              colorPalette: 'mint',
              color: 'colorPalette.default',
            })}
          />
          <span className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </Flex>

      {config.enabled && (
        <Stack gap={6}>
          <Flex gap={4}>
            <Box flex={1}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Display Count
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.display_count.toString()}
                onChange={(e) => handleChange('display_count', e.target.value)}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  bg: 'bg.default',
                  color: 'fg.default',
                  _focus: {
                    outline: 'none',
                    ringWidth: '2',
                    ringColor: 'mint.default'
                  }
                })}
              />
            </Box>

            <Box flex={1}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Display Style
              </label>
              <select
                value={config.display_style}
                onChange={(e) => handleChange('display_style', e.target.value as DisplayStyle)}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  bg: 'bg.default',
                  color: 'fg.default',
                  _focus: {
                    outline: 'none',
                    ringWidth: '2',
                    ringColor: 'mint.default'
                  }
                })}
              >
                <option value="carousel">Carousel</option>
                <option value="grid">Grid</option>
                <option value="list">List</option>
              </select>
            </Box>

            <Box flex={1}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Position
              </label>
              <select
                value={config.position}
                onChange={(e) => handleChange('position', e.target.value as DisplayPosition)}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  bg: 'bg.default',
                  color: 'fg.default',
                  _focus: {
                    outline: 'none',
                    ringWidth: '2',
                    ringColor: 'mint.default'
                  }
                })}
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </Box>
          </Flex>

          <Flex gap={4}>
            <Box flex={1}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                Minimum Rating
              </label>
              <select
                value={config.minimum_rating.toString()}
                onChange={(e) => handleChange('minimum_rating', e.target.value)}
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  bg: 'bg.default',
                  color: 'fg.default',
                  _focus: {
                    outline: 'none',
                    ringWidth: '2',
                    ringColor: 'mint.default'
                  }
                })}
              >
                <option value={1}>1+ Stars</option>
                <option value={2}>2+ Stars</option>
                <option value={3}>3+ Stars</option>
                <option value={4}>4+ Stars</option>
                <option value={5}>5 Stars Only</option>
              </select>
            </Box>

            <Box flex={1}>
              <label className={css({ display: 'flex', alignItems: 'center', gap: 2 })}>
                <input
                  type="checkbox"
                  checked={config.show_featured_only}
                  onChange={(e) => handleChange('show_featured_only', e.target.checked)}
                  className={css({
                    w: 4,
                    h: 4,
                    colorPalette: 'mint',
                    color: 'colorPalette.default',
                  })}
                />
                <span className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  Show featured only
                </span>
              </label>
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                Only display testimonials marked as featured
              </p>
            </Box>
          </Flex>
        </Stack>
      )}

      <Flex align="center" justify="space-between" mt={6}>
        <Box>
          {error && (
            <p className={css({ fontSize: 'sm', color: 'red.default' })}>
              {error}
            </p>
          )}
          {success && (
            <p className={css({ fontSize: 'sm', color: 'green.default' })}>
              Settings saved successfully!
            </p>
          )}
        </Box>
        <button
          onClick={saveConfig}
          disabled={saving}
          className={css({
            colorPalette: 'mint',
            px: 4,
            py: 2,
            fontSize: 'sm',
            fontWeight: 'medium',
            color: 'colorPalette.fg',
            bg: 'colorPalette.default',
            _hover: {
              bg: 'colorPalette.emphasized',
            },
            _disabled: {
              opacity: 0.5,
              cursor: 'not-allowed',
            }
          })}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </Flex>
    </Box>
  )
}