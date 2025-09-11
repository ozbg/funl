'use client'

import React from 'react'
import { css } from '@/styled-system/css'
import { Box, Stack, Flex, Grid } from '@/styled-system/jsx'
import { EnhancedLayoutElement, mergeSpacing } from '@/lib/types/layout-enhanced'

interface EnhancedPropertiesPanelProps {
  selectedElement: EnhancedLayoutElement | null
  onElementUpdate: (id: string, updates: Partial<EnhancedLayoutElement>) => void
  onElementDelete: (id: string) => void
}

export default function EnhancedPropertiesPanel({
  selectedElement,
  onElementUpdate,
  onElementDelete
}: EnhancedPropertiesPanelProps) {
  if (!selectedElement) {
    return (
      <Box>
        <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
          Properties
        </h3>
        <Box p={6} textAlign="center">
          <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
            Select an element to edit its properties
          </p>
        </Box>
      </Box>
    )
  }

  const inputStyles = css({
    w: 'full',
    px: 2,
    py: 1,
    borderWidth: '1px',
    borderColor: 'border.default',
    bg: 'bg.default',
    color: 'fg.default',
    fontSize: 'sm',
    _focus: {
      outline: 'none',
      ringWidth: '1',
      ringColor: 'mint.default',
      borderColor: 'mint.default',
    },
  })

  const smallInputStyles = css({
    w: 'full',
    px: 1,
    py: 0.5,
    borderWidth: '1px',
    borderColor: 'border.default',
    bg: 'bg.default',
    color: 'fg.default',
    fontSize: 'xs',
    _focus: {
      outline: 'none',
      ringWidth: '1',
      ringColor: 'mint.default',
      borderColor: 'mint.default',
    },
  })

  const buttonStyles = css({
    px: 3,
    py: 1,
    fontSize: 'sm',
    fontWeight: 'medium',
    borderWidth: '1px',
    borderColor: 'border.default',
    bg: 'bg.default',
    cursor: 'pointer',
    _hover: {
      bg: 'bg.muted',
    },
  })

  const deleteButtonStyles = css({
    colorPalette: 'red',
    px: 3,
    py: 1,
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'colorPalette.fg',
    bg: 'colorPalette.default',
    cursor: 'pointer',
    _hover: {
      bg: 'colorPalette.emphasized',
    },
  })

  const getElementTitle = () => {
    const fieldLabels = {
      business_name: 'Business Name',
      custom_message: 'Custom Message',
      contact_phone: 'Phone Number',
      contact_email: 'Email',
      website: 'Website',
      funnel_name: 'Funnel Name',
      logo: 'Logo'
    }

    if (selectedElement.type === 'qr_code') return 'QR Code'
    if (selectedElement.field) {
      return fieldLabels[selectedElement.field as keyof typeof fieldLabels] || 'Text Element'
    }
    return 'Element'
  }

  const updatePadding = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const currentPadding = mergeSpacing(selectedElement.padding)
    onElementUpdate(selectedElement.id, {
      padding: { ...currentPadding, [side]: value }
    })
  }

  const updateMargin = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const currentMargin = mergeSpacing(selectedElement.margin)
    onElementUpdate(selectedElement.id, {
      margin: { ...currentMargin, [side]: value }
    })
  }

  return (
    <Box maxH="80vh" overflowY="auto">
      <Flex justify="space-between" align="center" mb={3} position="sticky" top={0} bg="bg.default" pb={2}>
        <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
          Properties
        </h3>
        <button
          onClick={() => onElementDelete(selectedElement.id)}
          className={deleteButtonStyles}
        >
          Delete
        </button>
      </Flex>

      <Stack gap={4}>
        {/* Element Info */}
        <Box>
          <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
            {getElementTitle()}
          </h4>
          <p className={css({ fontSize: '2xs', color: 'fg.muted' })}>
            {selectedElement.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        </Box>

        {/* Position */}
        <Box>
          <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
            Position
          </h4>
          <Flex gap={2}>
            <Box flex={1}>
              <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                X (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={selectedElement.position.x.toFixed(1)}
                onChange={(e) => onElementUpdate(selectedElement.id, {
                  position: {
                    ...selectedElement.position,
                    x: parseFloat(e.target.value) || 0
                  }
                })}
                className={inputStyles}
              />
            </Box>
            <Box flex={1}>
              <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                Y (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={selectedElement.position.y.toFixed(1)}
                onChange={(e) => onElementUpdate(selectedElement.id, {
                  position: {
                    ...selectedElement.position,
                    y: parseFloat(e.target.value) || 0
                  }
                })}
                className={inputStyles}
              />
            </Box>
          </Flex>
        </Box>

        {/* Size */}
        <Box>
          <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
            Size
          </h4>
          <Flex gap={2}>
            <Box flex={1}>
              <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                Width (%)
              </label>
              <input
                type="number"
                min="5"
                max="100"
                step="1"
                value={selectedElement.size.width}
                onChange={(e) => onElementUpdate(selectedElement.id, {
                  size: {
                    ...selectedElement.size,
                    width: parseInt(e.target.value) || 20
                  }
                })}
                className={inputStyles}
              />
            </Box>
            <Box flex={1}>
              <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                Height (%)
              </label>
              <input
                type="number"
                min="5"
                max="100"
                step="1"
                value={selectedElement.size.height}
                onChange={(e) => onElementUpdate(selectedElement.id, {
                  size: {
                    ...selectedElement.size,
                    height: parseInt(e.target.value) || 10
                  }
                })}
                className={inputStyles}
              />
            </Box>
          </Flex>
        </Box>

        {/* Text Properties (only for text elements) */}
        {selectedElement.type === 'text' && (
          <>
            {/* Text Alignment */}
            <Box>
              <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Text Alignment
              </h4>
              <Stack gap={2}>
                {/* Horizontal Alignment */}
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                    Horizontal
                  </label>
                  <Flex gap={1}>
                    {(['left', 'center', 'right', 'justify'] as const).map(align => (
                      <button
                        key={align}
                        onClick={() => onElementUpdate(selectedElement.id, { textAlign: align })}
                        className={css({
                          flex: 1,
                          px: 1,
                          py: 1,
                          fontSize: '2xs',
                          fontWeight: 'medium',
                          borderWidth: '1px',
                          borderColor: selectedElement.textAlign === align ? 'mint.default' : 'border.default',
                          bg: selectedElement.textAlign === align ? 'mint.subtle' : 'bg.default',
                          color: selectedElement.textAlign === align ? 'mint.text' : 'fg.default',
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        })}
                      >
                        {align}
                      </button>
                    ))}
                  </Flex>
                </Box>

                {/* Vertical Alignment */}
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                    Vertical
                  </label>
                  <Flex gap={1}>
                    {(['top', 'middle', 'bottom'] as const).map(align => (
                      <button
                        key={align}
                        onClick={() => onElementUpdate(selectedElement.id, { verticalAlign: align })}
                        className={css({
                          flex: 1,
                          px: 2,
                          py: 1,
                          fontSize: '2xs',
                          fontWeight: 'medium',
                          borderWidth: '1px',
                          borderColor: selectedElement.verticalAlign === align ? 'mint.default' : 'border.default',
                          bg: selectedElement.verticalAlign === align ? 'mint.subtle' : 'bg.default',
                          color: selectedElement.verticalAlign === align ? 'mint.text' : 'fg.default',
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        })}
                      >
                        {align}
                      </button>
                    ))}
                  </Flex>
                </Box>
              </Stack>
            </Box>

            {/* Typography */}
            <Box>
              <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Typography
              </h4>
              <Stack gap={2}>
                <Grid columns={2} gap={2}>
                  <Box>
                    <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                      Font Size
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="144"
                      step="1"
                      value={selectedElement.fontSize || 16}
                      onChange={(e) => onElementUpdate(selectedElement.id, {
                        fontSize: parseInt(e.target.value) || 16
                      })}
                      className={smallInputStyles}
                    />
                  </Box>
                  <Box>
                    <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                      Line Height
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={selectedElement.lineHeight || 1.2}
                      onChange={(e) => onElementUpdate(selectedElement.id, {
                        lineHeight: parseFloat(e.target.value) || 1.2
                      })}
                      className={smallInputStyles}
                    />
                  </Box>
                </Grid>

                <Grid columns={2} gap={2}>
                  <Box>
                    <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                      Letter Spacing
                    </label>
                    <input
                      type="number"
                      min="-5"
                      max="20"
                      step="0.1"
                      value={selectedElement.letterSpacing || 0}
                      onChange={(e) => onElementUpdate(selectedElement.id, {
                        letterSpacing: parseFloat(e.target.value) || 0
                      })}
                      className={smallInputStyles}
                    />
                  </Box>
                  <Box>
                    <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                      Font Weight
                    </label>
                    <select
                      value={selectedElement.fontWeight || 'normal'}
                      onChange={(e) => onElementUpdate(selectedElement.id, {
                        fontWeight: e.target.value as any
                      })}
                      className={smallInputStyles}
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                      <option value="300">300</option>
                      <option value="400">400</option>
                      <option value="500">500</option>
                      <option value="600">600</option>
                      <option value="700">700</option>
                      <option value="800">800</option>
                      <option value="900">900</option>
                    </select>
                  </Box>
                </Grid>

                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                    Font Family
                  </label>
                  <select
                    value={selectedElement.fontFamily || 'helvetica'}
                    onChange={(e) => onElementUpdate(selectedElement.id, {
                      fontFamily: e.target.value as any
                    })}
                    className={smallInputStyles}
                  >
                    <option value="helvetica">Helvetica</option>
                    <option value="times">Times</option>
                    <option value="courier">Courier</option>
                    <option value="arial">Arial</option>
                    <option value="georgia">Georgia</option>
                    <option value="system-ui">System UI</option>
                  </select>
                </Box>

                <Grid columns={2} gap={2}>
                  <Box>
                    <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                      Text Transform
                    </label>
                    <select
                      value={selectedElement.textTransform || 'none'}
                      onChange={(e) => onElementUpdate(selectedElement.id, {
                        textTransform: e.target.value as any
                      })}
                      className={smallInputStyles}
                    >
                      <option value="none">None</option>
                      <option value="uppercase">Uppercase</option>
                      <option value="lowercase">Lowercase</option>
                      <option value="capitalize">Capitalize</option>
                    </select>
                  </Box>
                  <Box>
                    <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                      Font Style
                    </label>
                    <select
                      value={selectedElement.fontStyle || 'normal'}
                      onChange={(e) => onElementUpdate(selectedElement.id, {
                        fontStyle: e.target.value as any
                      })}
                      className={smallInputStyles}
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                  </Box>
                </Grid>
              </Stack>
            </Box>

            {/* Spacing */}
            <Box>
              <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Padding (%)
              </h4>
              <Grid columns={4} gap={1}>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 0.5, display: 'block' })}>
                    T
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={selectedElement.padding?.top || 0}
                    onChange={(e) => updatePadding('top', parseFloat(e.target.value) || 0)}
                    className={smallInputStyles}
                  />
                </Box>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 0.5, display: 'block' })}>
                    R
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={selectedElement.padding?.right || 0}
                    onChange={(e) => updatePadding('right', parseFloat(e.target.value) || 0)}
                    className={smallInputStyles}
                  />
                </Box>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 0.5, display: 'block' })}>
                    B
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={selectedElement.padding?.bottom || 0}
                    onChange={(e) => updatePadding('bottom', parseFloat(e.target.value) || 0)}
                    className={smallInputStyles}
                  />
                </Box>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 0.5, display: 'block' })}>
                    L
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={selectedElement.padding?.left || 0}
                    onChange={(e) => updatePadding('left', parseFloat(e.target.value) || 0)}
                    className={smallInputStyles}
                  />
                </Box>
              </Grid>
            </Box>

            {/* Margin */}
            <Box>
              <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Margin (%)
              </h4>
              <Grid columns={4} gap={1}>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 0.5, display: 'block' })}>
                    T
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={selectedElement.margin?.top || 0}
                    onChange={(e) => updateMargin('top', parseFloat(e.target.value) || 0)}
                    className={smallInputStyles}
                  />
                </Box>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 0.5, display: 'block' })}>
                    R
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={selectedElement.margin?.right || 0}
                    onChange={(e) => updateMargin('right', parseFloat(e.target.value) || 0)}
                    className={smallInputStyles}
                  />
                </Box>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 0.5, display: 'block' })}>
                    B
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={selectedElement.margin?.bottom || 0}
                    onChange={(e) => updateMargin('bottom', parseFloat(e.target.value) || 0)}
                    className={smallInputStyles}
                  />
                </Box>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 0.5, display: 'block' })}>
                    L
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={selectedElement.margin?.left || 0}
                    onChange={(e) => updateMargin('left', parseFloat(e.target.value) || 0)}
                    className={smallInputStyles}
                  />
                </Box>
              </Grid>
            </Box>

            {/* Colors */}
            <Box>
              <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Colors
              </h4>
              <Grid columns={2} gap={2}>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={selectedElement.color || '#000000'}
                    onChange={(e) => onElementUpdate(selectedElement.id, { color: e.target.value })}
                    className={css({
                      w: 'full',
                      h: '30px',
                      borderWidth: '1px',
                      borderColor: 'border.default',
                      cursor: 'pointer'
                    })}
                  />
                </Box>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                    Background
                  </label>
                  <input
                    type="color"
                    value={selectedElement.backgroundColor || '#ffffff'}
                    onChange={(e) => onElementUpdate(selectedElement.id, { backgroundColor: e.target.value })}
                    className={css({
                      w: 'full',
                      h: '30px',
                      borderWidth: '1px',
                      borderColor: 'border.default',
                      cursor: 'pointer'
                    })}
                  />
                </Box>
              </Grid>
            </Box>

            {/* Border */}
            <Box>
              <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Border
              </h4>
              <Grid columns={2} gap={2}>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                    Width (px)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    value={selectedElement.borderWidth || 0}
                    onChange={(e) => onElementUpdate(selectedElement.id, {
                      borderWidth: parseInt(e.target.value) || 0
                    })}
                    className={smallInputStyles}
                  />
                </Box>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                    Color
                  </label>
                  <input
                    type="color"
                    value={selectedElement.borderColor || '#000000'}
                    onChange={(e) => onElementUpdate(selectedElement.id, { borderColor: e.target.value })}
                    className={css({
                      w: 'full',
                      h: '28px',
                      borderWidth: '1px',
                      borderColor: 'border.default',
                      cursor: 'pointer'
                    })}
                  />
                </Box>
              </Grid>
              <Grid columns={2} gap={2} mt={2}>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                    Style
                  </label>
                  <select
                    value={selectedElement.borderStyle || 'solid'}
                    onChange={(e) => onElementUpdate(selectedElement.id, {
                      borderStyle: e.target.value as any
                    })}
                    className={smallInputStyles}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </Box>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                    Radius (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={selectedElement.borderRadius || 0}
                    onChange={(e) => onElementUpdate(selectedElement.id, {
                      borderRadius: parseInt(e.target.value) || 0
                    })}
                    className={smallInputStyles}
                  />
                </Box>
              </Grid>
            </Box>

            {/* Effects */}
            <Box>
              <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Effects
              </h4>
              <Grid columns={2} gap={2}>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                    Opacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedElement.opacity ?? 1}
                    onChange={(e) => onElementUpdate(selectedElement.id, {
                      opacity: parseFloat(e.target.value) || 1
                    })}
                    className={smallInputStyles}
                  />
                </Box>
                <Box>
                  <label className={css({ fontSize: '2xs', color: 'fg.muted', mb: 1, display: 'block' })}>
                    Rotation (°)
                  </label>
                  <input
                    type="number"
                    min="-180"
                    max="180"
                    step="1"
                    value={selectedElement.rotation || 0}
                    onChange={(e) => onElementUpdate(selectedElement.id, {
                      rotation: parseInt(e.target.value) || 0
                    })}
                    className={smallInputStyles}
                  />
                </Box>
              </Grid>
            </Box>
          </>
        )}

        {/* Quick Actions */}
        <Box pt={2} borderTopWidth="1px" borderColor="border.default">
          <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
            Quick Actions
          </h4>
          <Stack gap={1}>
            <button
              onClick={() => onElementUpdate(selectedElement.id, {
                position: { x: 50 - selectedElement.size.width / 2, y: selectedElement.position.y }
              })}
              className={buttonStyles}
            >
              Center Horizontally
            </button>
            <button
              onClick={() => onElementUpdate(selectedElement.id, {
                position: { x: selectedElement.position.x, y: 50 - selectedElement.size.height / 2 }
              })}
              className={buttonStyles}
            >
              Center Vertically
            </button>
            {selectedElement.type === 'text' && (
              <button
                onClick={() => onElementUpdate(selectedElement.id, {
                  fontSize: 14,
                  fontWeight: 'normal',
                  lineHeight: 1.2,
                  letterSpacing: 0,
                  color: '#000000',
                  backgroundColor: undefined,
                  borderWidth: 0,
                  opacity: 1,
                  rotation: 0
                })}
                className={buttonStyles}
              >
                Reset Styles
              </button>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}