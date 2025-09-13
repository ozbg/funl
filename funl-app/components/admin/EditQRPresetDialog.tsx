'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'
import { QRPreview } from './QRPreview'

interface CollapsibleSectionProps {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

function CollapsibleSection({ title, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <Box borderWidth="1px" borderColor="border.default" rounded="md" overflow="hidden">
      <Box 
        p={3} 
        bg="bg.subtle" 
        cursor="pointer" 
        onClick={onToggle}
        _hover={{ bg: "bg.muted" }}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <span className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
          {title}
        </span>
        <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>
          {isOpen ? '−' : '+'}
        </span>
      </Box>
      {isOpen && (
        <Box p={4} bg="bg.default">
          {children}
        </Box>
      )}
    </Box>
  )
}

interface BusinessCategory {
  id: string
  name: string
  slug: string
  is_active: boolean
}

interface QRPreset {
  id: string
  name: string
  slug: string
  description: string | null
  style_config: Record<string, unknown>
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  category_qr_presets: {
    business_categories: BusinessCategory
  }[]
}

interface EditQRPresetDialogProps {
  qrPreset: QRPreset
  categories: BusinessCategory[]
  onUpdate: (qrPreset: QRPreset) => void
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

export function EditQRPresetDialog({ qrPreset, categories, onUpdate }: EditQRPresetDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [openSections, setOpenSections] = useState({
    main: true,
    dots: false,
    cornersSquare: false,
    cornersDot: false,
    background: false,
    image: false,
    qrOptions: false
  })
  
  const [colorTypes, setColorTypes] = useState({
    dots: 'single',
    cornersSquare: 'single',
    cornersDot: 'single',
    background: 'single'
  })
  
  const [gradientTypes, setGradientTypes] = useState({
    dots: 'linear',
    cornersSquare: 'linear',
    cornersDot: 'linear',
    background: 'linear'
  })
  const [formData, setFormData] = useState({
    name: qrPreset.name,
    slug: qrPreset.slug,
    description: qrPreset.description || '',
    is_active: qrPreset.is_active,
    sort_order: qrPreset.sort_order,
    category_ids: qrPreset.category_qr_presets.map(cqp => cqp.business_categories.id),
    style_config: qrPreset.style_config || {
      width: 300,
      height: 300,
      margin: 0,
      dotsOptions: { 
        type: 'extra-rounded', 
        color: '#6a1a4c',
        gradient: {
          type: 'linear',
          rotation: 0,
          colorStops: [
            { offset: 0, color: '#6a1a4c' },
            { offset: 1, color: '#6a1a4c' }
          ]
        }
      },
      backgroundOptions: { 
        color: '#ffffff',
        gradient: {
          type: 'linear',
          rotation: 0,
          colorStops: [
            { offset: 0, color: '#ffffff' },
            { offset: 1, color: '#ffffff' }
          ]
        }
      },
      cornersDotOptions: { 
        type: '',
        color: '#000000',
        gradient: {
          type: 'linear',
          rotation: 0,
          colorStops: [
            { offset: 0, color: '#000000' },
            { offset: 1, color: '#000000' }
          ]
        }
      },
      cornersSquareOptions: { 
        type: 'extra-rounded',
        color: '#000000',
        gradient: {
          type: 'linear',
          rotation: 0,
          colorStops: [
            { offset: 0, color: '#000000' },
            { offset: 1, color: '#000000' }
          ]
        }
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 0,
        crossOrigin: 'anonymous'
      },
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'Q'
      }
    }
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/qr-presets/${qrPreset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const { qrPreset: updatedQRPreset } = await response.json()
        onUpdate(updatedQRPreset)
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error updating QR preset:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }))
  }

  const handleStyleConfigChange = (section: string, key: string, value: string | number | boolean) => {
    setFormData(prev => {
      const newStyleConfig = { ...prev.style_config }
      
      if (section === 'main') {
        newStyleConfig[key] = value
      } else if (section === 'dotsOptions') {
        if (key.startsWith('gradient')) {
          const dotsOptions = newStyleConfig.dotsOptions as Record<string, unknown> | undefined
          const currentGradient = (dotsOptions?.gradient as { type: string, rotation: number, colorStops: Array<{offset: number, color: string}> }) || { type: 'linear', rotation: 0, colorStops: [{ offset: 0, color: '#6a1a4c' }, { offset: 1, color: '#6a1a4c' }] }

          if (key === 'gradientColor1') {
            currentGradient.colorStops[0].color = value as string
          } else if (key === 'gradientColor2') {
            currentGradient.colorStops[1].color = value as string
          } else if (key === 'gradientRotation') {
            currentGradient.rotation = value as number
          }
          
          newStyleConfig.dotsOptions = { ...(newStyleConfig.dotsOptions as Record<string, unknown> || {}), gradient: currentGradient }
        } else {
          newStyleConfig.dotsOptions = { ...(newStyleConfig.dotsOptions as Record<string, unknown> || {}), [key]: value }
        }
      } else if (section === 'backgroundOptions') {
        newStyleConfig.backgroundOptions = { ...(newStyleConfig.backgroundOptions as Record<string, unknown> || {}), [key]: value }
      } else if (section === 'cornersDotOptions') {
        newStyleConfig.cornersDotOptions = { ...(newStyleConfig.cornersDotOptions as Record<string, unknown> || {}), [key]: value }
      } else if (section === 'cornersSquareOptions') {
        newStyleConfig.cornersSquareOptions = { ...(newStyleConfig.cornersSquareOptions as Record<string, unknown> || {}), [key]: value }
      } else if (section === 'imageOptions') {
        newStyleConfig.imageOptions = { ...(newStyleConfig.imageOptions as Record<string, unknown> || {}), [key]: value }
      } else if (section === 'qrOptions') {
        newStyleConfig.qrOptions = { ...(newStyleConfig.qrOptions as Record<string, unknown> || {}), [key]: value }
      }
      
      return {
        ...prev,
        style_config: newStyleConfig
      }
    })
  }

  if (!isOpen) {
    return (
      <Button size="xs" variant="outline" onClick={() => setIsOpen(true)}>
        Edit
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
            Edit QR Code Preset
          </h2>
          <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.muted' })}>
            Update the QR code style preset with live preview
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
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  />
                </Box>

                {/* QR Code Styling Options */}
                <Box>
                  <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 3, display: 'block' })}>
                    QR Code Styling Options
                  </label>
                  <Grid gap={3}>
                    {/* Main Options */}
                    <CollapsibleSection
                      title="Main Options"
                      isOpen={openSections.main}
                      onToggle={() => toggleSection('main')}
                    >
                      <Grid gap={4}>
                        <Grid columns={2} gap={4}>
                          <Box>
                            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                              Width
                            </label>
                            <input
                              type="number"
                              min="100"
                              max="10000"
                              value={(formData.style_config.width as number) || 300}
                              onChange={(e) => handleStyleConfigChange('main', 'width', parseInt(e.target.value))}
                              className={css({
                                mt: 1, w: 'full', px: 3, py: 2, borderWidth: '1px',
                                borderColor: 'border.default', rounded: 'md', fontSize: 'sm'
                              })}
                            />
                          </Box>
                          <Box>
                            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                              Height
                            </label>
                            <input
                              type="number"
                              min="100"
                              max="10000"
                              value={(formData.style_config.height as number) || 300}
                              onChange={(e) => handleStyleConfigChange('main', 'height', parseInt(e.target.value))}
                              className={css({
                                mt: 1, w: 'full', px: 3, py: 2, borderWidth: '1px',
                                borderColor: 'border.default', rounded: 'md', fontSize: 'sm'
                              })}
                            />
                          </Box>
                        </Grid>
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                            Margin
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10000"
                            value={(formData.style_config.margin as number) || 0}
                            onChange={(e) => handleStyleConfigChange('main', 'margin', parseInt(e.target.value))}
                            className={css({
                              mt: 1, w: 'full', px: 3, py: 2, borderWidth: '1px',
                              borderColor: 'border.default', rounded: 'md', fontSize: 'sm'
                            })}
                          />
                        </Box>
                      </Grid>
                    </CollapsibleSection>

                    {/* Dots Options */}
                    <CollapsibleSection
                      title="Dots Options"
                      isOpen={openSections.dots}
                      onToggle={() => toggleSection('dots')}
                    >
                      <Grid gap={4}>
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                            Dots Style
                          </label>
                          <select
                            value={((formData.style_config.dotsOptions as Record<string, unknown>)?.type as string) || 'extra-rounded'}
                            onChange={(e) => handleStyleConfigChange('dotsOptions', 'type', e.target.value)}
                            className={css({
                              mt: 1, w: 'full', px: 3, py: 2, borderWidth: '1px',
                              borderColor: 'border.default', rounded: 'md', fontSize: 'sm'
                            })}
                          >
                            {QR_STYLES.map(style => (
                              <option key={style.value} value={style.value}>
                                {style.label}
                              </option>
                            ))}
                          </select>
                        </Box>
                        
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default', mb: 2, display: 'block' })}>
                            Color Type
                          </label>
                          <Flex gap={4}>
                            <label className={css({ display: 'flex', alignItems: 'center', gap: 2, fontSize: 'xs', flex: 1 })}>
                              <input
                                type="radio"
                                name="dots-color-type"
                                checked={colorTypes.dots === 'single'}
                                onChange={() => setColorTypes(prev => ({ ...prev, dots: 'single' }))}
                              />
                              Single color
                            </label>
                            <label className={css({ display: 'flex', alignItems: 'center', gap: 2, fontSize: 'xs', flex: 1 })}>
                              <input
                                type="radio"
                                name="dots-color-type"
                                checked={colorTypes.dots === 'gradient'}
                                onChange={() => setColorTypes(prev => ({ ...prev, dots: 'gradient' }))}
                              />
                              Color gradient
                            </label>
                          </Flex>
                        </Box>

                        {colorTypes.dots === 'single' && (
                          <Box>
                            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                              Dots Color
                            </label>
                            <input
                              type="color"
                              value={((formData.style_config.dotsOptions as Record<string, unknown>)?.color as string) || '#6a1a4c'}
                              onChange={(e) => handleStyleConfigChange('dotsOptions', 'color', e.target.value)}
                              className={css({
                                mt: 1, w: 'full', h: 10, borderWidth: '1px',
                                borderColor: 'border.default', rounded: 'md', cursor: 'pointer'
                              })}
                            />
                          </Box>
                        )}

                        {colorTypes.dots === 'gradient' && (
                          <>
                            <Box>
                              <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default', mb: 2, display: 'block' })}>
                                Gradient Type
                              </label>
                              <Flex gap={4}>
                                <label className={css({ display: 'flex', alignItems: 'center', gap: 2, fontSize: 'xs', flex: 1 })}>
                                  <input
                                    type="radio"
                                    name="dots-gradient-type"
                                    checked={gradientTypes.dots === 'linear'}
                                    onChange={() => setGradientTypes(prev => ({ ...prev, dots: 'linear' }))}
                                  />
                                  Linear
                                </label>
                                <label className={css({ display: 'flex', alignItems: 'center', gap: 2, fontSize: 'xs', flex: 1 })}>
                                  <input
                                    type="radio"
                                    name="dots-gradient-type"
                                    checked={gradientTypes.dots === 'radial'}
                                    onChange={() => setGradientTypes(prev => ({ ...prev, dots: 'radial' }))}
                                  />
                                  Radial
                                </label>
                              </Flex>
                            </Box>
                            <Box>
                              <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                                Dots Gradient
                              </label>
                              <Flex gap={2} mt={1}>
                                <input
                                  type="color"
                                  value={(((formData.style_config.dotsOptions as Record<string, unknown>)?.gradient as Record<string, unknown>)?.colorStops as Array<{color: string}>)?.[0]?.color || '#6a1a4c'}
                                  onChange={(e) => handleStyleConfigChange('dotsOptions', 'gradientColor1', e.target.value)}
                                  className={css({
                                    flex: 1, h: 10, borderWidth: '1px',
                                    borderColor: 'border.default', rounded: 'md', cursor: 'pointer'
                                  })}
                                />
                                <input
                                  type="color"
                                  value={(((formData.style_config.dotsOptions as Record<string, unknown>)?.gradient as Record<string, unknown>)?.colorStops as Array<{color: string}>)?.[1]?.color || '#6a1a4c'}
                                  onChange={(e) => handleStyleConfigChange('dotsOptions', 'gradientColor2', e.target.value)}
                                  className={css({
                                    flex: 1, h: 10, borderWidth: '1px',
                                    borderColor: 'border.default', rounded: 'md', cursor: 'pointer'
                                  })}
                                />
                              </Flex>
                            </Box>
                            <Box>
                              <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                                Rotation
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="360"
                                value={(((formData.style_config.dotsOptions as Record<string, unknown>)?.gradient as Record<string, unknown>)?.rotation as number) || 0}
                                onChange={(e) => handleStyleConfigChange('dotsOptions', 'gradientRotation', parseInt(e.target.value))}
                                className={css({
                                  mt: 1, w: 'full', px: 3, py: 2, borderWidth: '1px',
                                  borderColor: 'border.default', rounded: 'md', fontSize: 'sm'
                                })}
                              />
                            </Box>
                          </>
                        )}
                      </Grid>
                    </CollapsibleSection>

                    {/* Corners Square Options */}
                    <CollapsibleSection
                      title="Corners Square Options"
                      isOpen={openSections.cornersSquare}
                      onToggle={() => toggleSection('cornersSquare')}
                    >
                      <Grid gap={4}>
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                            Corners Square Style
                          </label>
                          <select
                            value={((formData.style_config.cornersSquareOptions as Record<string, unknown>)?.type as string) || 'extra-rounded'}
                            onChange={(e) => handleStyleConfigChange('cornersSquareOptions', 'type', e.target.value)}
                            className={css({
                              mt: 1, w: 'full', px: 3, py: 2, borderWidth: '1px',
                              borderColor: 'border.default', rounded: 'md', fontSize: 'sm'
                            })}
                          >
                            <option value="">None</option>
                            <option value="square">Square</option>
                            <option value="dot">Dot</option>
                            <option value="extra-rounded">Extra rounded</option>
                          </select>
                        </Box>
                        
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default', mb: 2, display: 'block' })}>
                            Color Type
                          </label>
                          <Flex gap={4}>
                            <label className={css({ display: 'flex', alignItems: 'center', gap: 2, fontSize: 'xs', flex: 1 })}>
                              <input
                                type="radio"
                                name="corners-square-color-type"
                                checked={colorTypes.cornersSquare === 'single'}
                                onChange={() => setColorTypes(prev => ({ ...prev, cornersSquare: 'single' }))}
                              />
                              Single color
                            </label>
                            <label className={css({ display: 'flex', alignItems: 'center', gap: 2, fontSize: 'xs', flex: 1 })}>
                              <input
                                type="radio"
                                name="corners-square-color-type"
                                checked={colorTypes.cornersSquare === 'gradient'}
                                onChange={() => setColorTypes(prev => ({ ...prev, cornersSquare: 'gradient' }))}
                              />
                              Color gradient
                            </label>
                          </Flex>
                        </Box>

                        {colorTypes.cornersSquare === 'single' && (
                          <Box>
                            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                              Corners Square Color
                            </label>
                            <Flex gap={2} mt={1}>
                              <input
                                type="color"
                                value={((formData.style_config.cornersSquareOptions as Record<string, unknown>)?.color as string) || '#000000'}
                                onChange={(e) => handleStyleConfigChange('cornersSquareOptions', 'color', e.target.value)}
                                className={css({
                                  flex: 1, h: 10, borderWidth: '1px',
                                  borderColor: 'border.default', rounded: 'md', cursor: 'pointer'
                                })}
                              />
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={() => handleStyleConfigChange('cornersSquareOptions', 'color', '')}
                              >
                                Clear
                              </Button>
                            </Flex>
                          </Box>
                        )}
                      </Grid>
                    </CollapsibleSection>

                    {/* Corners Dot Options */}
                    <CollapsibleSection
                      title="Corners Dot Options"
                      isOpen={openSections.cornersDot}
                      onToggle={() => toggleSection('cornersDot')}
                    >
                      <Grid gap={4}>
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                            Corners Dot Style
                          </label>
                          <select
                            value={((formData.style_config.cornersDotOptions as Record<string, unknown>)?.type as string) || ''}
                            onChange={(e) => handleStyleConfigChange('cornersDotOptions', 'type', e.target.value)}
                            className={css({
                              mt: 1, w: 'full', px: 3, py: 2, borderWidth: '1px',
                              borderColor: 'border.default', rounded: 'md', fontSize: 'sm'
                            })}
                          >
                            <option value="">None</option>
                            <option value="square">Square</option>
                            <option value="dot">Dot</option>
                          </select>
                        </Box>
                        
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default', mb: 2, display: 'block' })}>
                            Color Type
                          </label>
                          <Flex gap={4}>
                            <label className={css({ display: 'flex', alignItems: 'center', gap: 2, fontSize: 'xs', flex: 1 })}>
                              <input
                                type="radio"
                                name="corners-dot-color-type"
                                checked={colorTypes.cornersDot === 'single'}
                                onChange={() => setColorTypes(prev => ({ ...prev, cornersDot: 'single' }))}
                              />
                              Single color
                            </label>
                            <label className={css({ display: 'flex', alignItems: 'center', gap: 2, fontSize: 'xs', flex: 1 })}>
                              <input
                                type="radio"
                                name="corners-dot-color-type"
                                checked={colorTypes.cornersDot === 'gradient'}
                                onChange={() => setColorTypes(prev => ({ ...prev, cornersDot: 'gradient' }))}
                              />
                              Color gradient
                            </label>
                          </Flex>
                        </Box>

                        {colorTypes.cornersDot === 'single' && (
                          <Box>
                            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                              Corners Dot Color
                            </label>
                            <Flex gap={2} mt={1}>
                              <input
                                type="color"
                                value={((formData.style_config.cornersDotOptions as Record<string, unknown>)?.color as string) || '#000000'}
                                onChange={(e) => handleStyleConfigChange('cornersDotOptions', 'color', e.target.value)}
                                className={css({
                                  flex: 1, h: 10, borderWidth: '1px',
                                  borderColor: 'border.default', rounded: 'md', cursor: 'pointer'
                                })}
                              />
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={() => handleStyleConfigChange('cornersDotOptions', 'color', '')}
                              >
                                Clear
                              </Button>
                            </Flex>
                          </Box>
                        )}
                      </Grid>
                    </CollapsibleSection>

                    {/* Background Options */}
                    <CollapsibleSection
                      title="Background Options"
                      isOpen={openSections.background}
                      onToggle={() => toggleSection('background')}
                    >
                      <Grid gap={4}>
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default', mb: 2, display: 'block' })}>
                            Color Type
                          </label>
                          <Flex gap={4}>
                            <label className={css({ display: 'flex', alignItems: 'center', gap: 2, fontSize: 'xs', flex: 1 })}>
                              <input
                                type="radio"
                                name="background-color-type"
                                checked={colorTypes.background === 'single'}
                                onChange={() => setColorTypes(prev => ({ ...prev, background: 'single' }))}
                              />
                              Single color
                            </label>
                            <label className={css({ display: 'flex', alignItems: 'center', gap: 2, fontSize: 'xs', flex: 1 })}>
                              <input
                                type="radio"
                                name="background-color-type"
                                checked={colorTypes.background === 'gradient'}
                                onChange={() => setColorTypes(prev => ({ ...prev, background: 'gradient' }))}
                              />
                              Color gradient
                            </label>
                          </Flex>
                        </Box>

                        {colorTypes.background === 'single' && (
                          <Box>
                            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                              Background Color
                            </label>
                            <input
                              type="color"
                              value={((formData.style_config.backgroundOptions as Record<string, unknown>)?.color as string) || '#ffffff'}
                              onChange={(e) => handleStyleConfigChange('backgroundOptions', 'color', e.target.value)}
                              className={css({
                                mt: 1, w: 'full', h: 10, borderWidth: '1px',
                                borderColor: 'border.default', rounded: 'md', cursor: 'pointer'
                              })}
                            />
                          </Box>
                        )}
                      </Grid>
                    </CollapsibleSection>

                    {/* Image Options */}
                    <CollapsibleSection
                      title="Image Options"
                      isOpen={openSections.image}
                      onToggle={() => toggleSection('image')}
                    >
                      <Grid gap={4}>
                        <Box>
                          <label className={css({ display: 'flex', alignItems: 'center', gap: 2, fontSize: 'xs' })}>
                            <input
                              type="checkbox"
                              checked={((formData.style_config.imageOptions as Record<string, unknown>)?.hideBackgroundDots as boolean) || false}
                              onChange={(e) => handleStyleConfigChange('imageOptions', 'hideBackgroundDots', e.target.checked)}
                            />
                            Hide Background Dots
                          </label>
                        </Box>
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                            Image Size
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={((formData.style_config.imageOptions as Record<string, unknown>)?.imageSize as number) || 0.4}
                            onChange={(e) => handleStyleConfigChange('imageOptions', 'imageSize', parseFloat(e.target.value))}
                            className={css({
                              mt: 1, w: 'full', px: 3, py: 2, borderWidth: '1px',
                              borderColor: 'border.default', rounded: 'md', fontSize: 'sm'
                            })}
                          />
                        </Box>
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                            Margin
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10000"
                            value={((formData.style_config.imageOptions as Record<string, unknown>)?.margin as number) || 0}
                            onChange={(e) => handleStyleConfigChange('imageOptions', 'margin', parseInt(e.target.value))}
                            className={css({
                              mt: 1, w: 'full', px: 3, py: 2, borderWidth: '1px',
                              borderColor: 'border.default', rounded: 'md', fontSize: 'sm'
                            })}
                          />
                        </Box>
                      </Grid>
                    </CollapsibleSection>

                    {/* QR Options */}
                    <CollapsibleSection
                      title="QR Options"
                      isOpen={openSections.qrOptions}
                      onToggle={() => toggleSection('qrOptions')}
                    >
                      <Grid gap={4}>
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                            Type Number
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="40"
                            value={((formData.style_config.qrOptions as Record<string, unknown>)?.typeNumber as number) || 0}
                            onChange={(e) => handleStyleConfigChange('qrOptions', 'typeNumber', parseInt(e.target.value))}
                            className={css({
                              mt: 1, w: 'full', px: 3, py: 2, borderWidth: '1px',
                              borderColor: 'border.default', rounded: 'md', fontSize: 'sm'
                            })}
                          />
                        </Box>
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                            Mode
                          </label>
                          <select
                            value={((formData.style_config.qrOptions as Record<string, unknown>)?.mode as string) || 'Byte'}
                            onChange={(e) => handleStyleConfigChange('qrOptions', 'mode', e.target.value)}
                            className={css({
                              mt: 1, w: 'full', px: 3, py: 2, borderWidth: '1px',
                              borderColor: 'border.default', rounded: 'md', fontSize: 'sm'
                            })}
                          >
                            <option value="Numeric">Numeric</option>
                            <option value="Alphanumeric">Alphanumeric</option>
                            <option value="Byte">Byte</option>
                            <option value="Kanji">Kanji</option>
                          </select>
                        </Box>
                        <Box>
                          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default' })}>
                            Error Correction Level
                          </label>
                          <select
                            value={((formData.style_config.qrOptions as Record<string, unknown>)?.errorCorrectionLevel as string) || 'Q'}
                            onChange={(e) => handleStyleConfigChange('qrOptions', 'errorCorrectionLevel', e.target.value)}
                            className={css({
                              mt: 1, w: 'full', px: 3, py: 2, borderWidth: '1px',
                              borderColor: 'border.default', rounded: 'md', fontSize: 'sm'
                            })}
                          >
                            <option value="L">L</option>
                            <option value="M">M</option>
                            <option value="Q">Q</option>
                            <option value="H">H</option>
                          </select>
                        </Box>
                      </Grid>
                    </CollapsibleSection>
                  </Grid>
                </Box>

                <Flex gap={4}>
                  <Box flex={1}>
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
                    />
                  </Box>
                  <Box>
                    <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                      Active
                    </label>
                    <Box mt={3}>
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className={css({ cursor: 'pointer' })}
                      />
                    </Box>
                  </Box>
                </Flex>

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
                  url="funl.au/preview"
                />
              </Box>
              
              <Box mt={4} p={4} bg="bg.subtle" rounded="md">
                <h4 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2 })}>
                  Style Configuration
                </h4>
                <Box fontSize="xs" color="fg.muted">
                  <div>Style: {(formData.style_config.dotsOptions as Record<string, unknown>)?.type as string}</div>
                  <div>Dark Color: {(formData.style_config.dotsOptions as Record<string, unknown>)?.color as string}</div>
                  <div>Light Color: {(formData.style_config.backgroundOptions as Record<string, unknown>)?.color as string}</div>
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
              Update QR Preset
            </Button>
          </Flex>
        </form>
      </Box>
    </Box>
  )
}