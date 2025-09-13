'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'
import { QRPreview } from './QRPreview'

interface BusinessCategory {
  id: string
  name: string
  slug: string
  is_active: boolean
}

interface CreateQRPresetDialogProps {
  categories: BusinessCategory[]
}

const QR_STYLES = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'dots', label: 'Dots' },
  { value: 'dots-rounded', label: 'Dots Rounded' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy Rounded' },
  { value: 'extra-rounded', label: 'Extra Rounded' }
]

export function CreateQRPresetDialog({ categories }: CreateQRPresetDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
    category_ids: [] as string[],
    style_config: {
      style: 'square',
      darkColor: '#000000',
      lightColor: '#FFFFFF'
    }
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/qr-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsOpen(false)
        setFormData({ 
          name: '', 
          slug: '', 
          description: '', 
          sort_order: 0, 
          category_ids: [],
          style_config: {
            style: 'square',
            darkColor: '#000000',
            lightColor: '#FFFFFF'
          }
        })
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating QR preset:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }))
  }

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }))
  }

  const handleStyleConfigChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      style_config: {
        ...prev.style_config,
        [key]: value
      }
    }))
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        Create QR Preset
      </Button>
    )
  }

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.5)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={50}
      onClick={() => setIsOpen(false)}
    >
      <Box
        bg="bg.default"
        borderWidth="1px"
        borderColor="border.default"
        boxShadow="lg"
        maxW="4xl"
        w="full"
        mx={4}
        p={6}
        maxH="90vh"
        overflowY="auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Box mb={4}>
          <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'fg.default' })}>
            Create QR Code Preset
          </h2>
          <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.muted' })}>
            Design a new QR code style preset with live preview
          </p>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid columns={{ base: 1, lg: 2 }} gap={6} mb={6}>
            {/* Left Column - Form Fields */}
            <Box>
              <Grid gap={4}>
                <Box>
                  <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={css({
                      mt: 1,
                      w: 'full',
                      px: 3,
                      py: 2,
                      borderWidth: '1px',
                      borderColor: 'border.default',
                      rounded: 'md',
                      fontSize: 'sm',
                      _focus: { outline: 'none', borderColor: 'accent.default' }
                    })}
                    placeholder="e.g., Modern Square"
                  />
                </Box>

                <Box>
                  <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className={css({
                      mt: 1,
                      w: 'full',
                      px: 3,
                      py: 2,
                      borderWidth: '1px',
                      borderColor: 'border.default',
                      rounded: 'md',
                      fontSize: 'sm',
                      _focus: { outline: 'none', borderColor: 'accent.default' }
                    })}
                    placeholder="e.g., modern-square"
                  />
                </Box>

                <Box>
                  <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className={css({
                      mt: 1,
                      w: 'full',
                      px: 3,
                      py: 2,
                      borderWidth: '1px',
                      borderColor: 'border.default',
                      rounded: 'md',
                      fontSize: 'sm',
                      resize: 'vertical',
                      _focus: { outline: 'none', borderColor: 'accent.default' }
                    })}
                    placeholder="Brief description of this QR style"
                  />
                </Box>

                <Box>
                  <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                    Style
                  </label>
                  <select
                    value={formData.style_config.style}
                    onChange={(e) => handleStyleConfigChange('style', e.target.value)}
                    className={css({
                      mt: 1,
                      w: 'full',
                      px: 3,
                      py: 2,
                      borderWidth: '1px',
                      borderColor: 'border.default',
                      rounded: 'md',
                      fontSize: 'sm',
                      _focus: { outline: 'none', borderColor: 'accent.default' }
                    })}
                  >
                    {QR_STYLES.map(style => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </Box>

                <Grid columns={2} gap={4}>
                  <Box>
                    <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                      Dark Color
                    </label>
                    <input
                      type="color"
                      value={formData.style_config.darkColor}
                      onChange={(e) => handleStyleConfigChange('darkColor', e.target.value)}
                      className={css({
                        mt: 1,
                        w: 'full',
                        h: 10,
                        borderWidth: '1px',
                        borderColor: 'border.default',
                        rounded: 'md',
                        cursor: 'pointer'
                      })}
                    />
                  </Box>
                  <Box>
                    <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                      Light Color
                    </label>
                    <input
                      type="color"
                      value={formData.style_config.lightColor}
                      onChange={(e) => handleStyleConfigChange('lightColor', e.target.value)}
                      className={css({
                        mt: 1,
                        w: 'full',
                        h: 10,
                        borderWidth: '1px',
                        borderColor: 'border.default',
                        rounded: 'md',
                        cursor: 'pointer'
                      })}
                    />
                  </Box>
                </Grid>

                <Box>
                  <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className={css({
                      mt: 1,
                      w: 'full',
                      px: 3,
                      py: 2,
                      borderWidth: '1px',
                      borderColor: 'border.default',
                      rounded: 'md',
                      fontSize: 'sm',
                      _focus: { outline: 'none', borderColor: 'accent.default' }
                    })}
                    placeholder="0"
                  />
                </Box>

                <Box>
                  <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2, display: 'block' })}>
                    Available in Categories
                  </label>
                  <Box 
                    borderWidth="1px" 
                    borderColor="border.default" 
                    rounded="md" 
                    p={3}
                    maxH="150px"
                    overflowY="auto"
                  >
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className={css({
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          py: 1,
                          cursor: 'pointer'
                        })}
                      >
                        <input
                          type="checkbox"
                          checked={formData.category_ids.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          className={css({ cursor: 'pointer' })}
                        />
                        <span className={css({ fontSize: 'sm' })}>{category.name}</span>
                      </label>
                    ))}
                  </Box>
                </Box>
              </Grid>
            </Box>

            {/* Right Column - Live Preview */}
            <Box>
              <Box mb={4}>
                <h3 className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default' })}>
                  Live Preview
                </h3>
                <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                  See how your QR code will look
                </p>
              </Box>
              
              <Box display="flex" justifyContent="center" p={6} bg="bg.muted" rounded="lg">
                <QRPreview 
                  style_config={formData.style_config} 
                  size={200}
                  url="https://your-app.com/preview"
                />
              </Box>
              
              <Box mt={4} p={4} bg="bg.subtle" rounded="md">
                <h4 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                  Style Configuration
                </h4>
                <Box fontSize="xs" color="fg.muted">
                  <div>Style: {formData.style_config.style}</div>
                  <div>Dark Color: {formData.style_config.darkColor}</div>
                  <div>Light Color: {formData.style_config.lightColor}</div>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Flex gap={3} justify="flex-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              Create QR Preset
            </Button>
          </Flex>
        </form>
      </Box>
    </Box>
  )
}