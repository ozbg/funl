'use client'

import React from 'react'
import { css } from '@/styled-system/css'
import { Box, Stack, Flex } from '@/styled-system/jsx'

interface LayoutElement {
  id: string
  type: 'qr_code' | 'text' | 'image'
  field?: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  alignment?: 'left' | 'center' | 'right'
  fontSize?: number
  fontWeight?: string
}

interface PropertiesPanelProps {
  selectedElement: LayoutElement | null
  onElementUpdate: (id: string, updates: Partial<LayoutElement>) => void
  onElementDelete: (id: string) => void
}

export default function PropertiesPanel({
  selectedElement,
  onElementUpdate,
  onElementDelete
}: PropertiesPanelProps) {
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

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={3}>
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
                max="90"
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
                max="90"
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
                max="95"
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
                max="95"
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
            {/* Alignment */}
            <Box>
              <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Alignment
              </h4>
              <Flex gap={1}>
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => onElementUpdate(selectedElement.id, { alignment: align as 'left' | 'center' | 'right' })}
                    className={css({
                      flex: 1,
                      px: 2,
                      py: 1,
                      fontSize: 'xs',
                      fontWeight: 'medium',
                      borderWidth: '1px',
                      borderColor: selectedElement.alignment === align ? 'mint.default' : 'border.default',
                      bg: selectedElement.alignment === align ? 'mint.subtle' : 'bg.default',
                      color: selectedElement.alignment === align ? 'mint.text' : 'fg.default',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    })}
                  >
                    {align}
                  </button>
                ))}
              </Flex>
            </Box>

            {/* Font Size */}
            <Box>
              <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Font Size
              </h4>
              <input
                type="number"
                min="8"
                max="72"
                step="1"
                value={selectedElement.fontSize || 16}
                onChange={(e) => onElementUpdate(selectedElement.id, {
                  fontSize: parseInt(e.target.value) || 16
                })}
                className={inputStyles}
              />
            </Box>

            {/* Font Weight */}
            <Box>
              <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                Font Weight
              </h4>
              <Flex gap={1}>
                {['normal', 'bold'].map(weight => (
                  <button
                    key={weight}
                    onClick={() => onElementUpdate(selectedElement.id, { fontWeight: weight })}
                    className={css({
                      flex: 1,
                      px: 2,
                      py: 1,
                      fontSize: 'xs',
                      fontWeight: weight === 'bold' ? 'bold' : 'normal',
                      borderWidth: '1px',
                      borderColor: selectedElement.fontWeight === weight ? 'mint.default' : 'border.default',
                      bg: selectedElement.fontWeight === weight ? 'mint.subtle' : 'bg.default',
                      color: selectedElement.fontWeight === weight ? 'mint.text' : 'fg.default',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    })}
                  >
                    {weight}
                  </button>
                ))}
              </Flex>
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
                position: { x: 50, y: selectedElement.position.y }
              })}
              className={buttonStyles}
            >
              Center Horizontally
            </button>
            <button
              onClick={() => onElementUpdate(selectedElement.id, {
                position: { x: selectedElement.position.x, y: 50 }
              })}
              className={buttonStyles}
            >
              Center Vertically
            </button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}