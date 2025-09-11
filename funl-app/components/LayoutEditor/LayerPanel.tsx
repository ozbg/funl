'use client'

import React from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack } from '@/styled-system/jsx'
import { EnhancedLayoutElement } from '@/lib/types/layout-enhanced'

interface LayerPanelProps {
  elements: EnhancedLayoutElement[]
  selectedIds: string[]
  onElementsChange: (elements: EnhancedLayoutElement[]) => void
  onSelectionChange: (ids: string[]) => void
}

export default function LayerPanel({
  elements,
  selectedIds,
  onElementsChange,
  onSelectionChange
}: LayerPanelProps) {
  const getElementName = (element: EnhancedLayoutElement) => {
    if (element.field) {
      const fieldNames = {
        business_name: 'Business Name',
        custom_message: 'Custom Message',
        contact_phone: 'Phone',
        contact_email: 'Email',
        website: 'Website',
        funnel_name: 'Funnel Name'
      }
      return fieldNames[element.field as keyof typeof fieldNames] || element.field
    }
    
    switch (element.type) {
      case 'qr_code': return 'QR Code'
      case 'image': return 'Image'
      case 'text': return 'Text'
      default: return 'Element'
    }
  }

  const getElementIcon = (element: EnhancedLayoutElement) => {
    switch (element.type) {
      case 'qr_code': return '📱'
      case 'image': return '🖼️'
      case 'text': return '📝'
      default: return '📄'
    }
  }

  const handleElementClick = (elementId: string, ctrlKey: boolean) => {
    if (ctrlKey) {
      // Multi-select
      if (selectedIds.includes(elementId)) {
        onSelectionChange(selectedIds.filter(id => id !== elementId))
      } else {
        onSelectionChange([...selectedIds, elementId])
      }
    } else {
      // Single select
      onSelectionChange([elementId])
    }
  }

  const handleVisibilityToggle = (elementId: string) => {
    const updatedElements = elements.map(el =>
      el.id === elementId 
        ? { ...el, visible: el.visible === false ? true : false }
        : el
    )
    onElementsChange(updatedElements)
  }

  const handleLockToggle = (elementId: string) => {
    const updatedElements = elements.map(el =>
      el.id === elementId 
        ? { ...el, locked: !el.locked }
        : el
    )
    onElementsChange(updatedElements)
  }

  const moveElement = (elementId: string, direction: 'up' | 'down') => {
    const currentIndex = elements.findIndex(el => el.id === elementId)
    if (currentIndex === -1) return

    const newElements = [...elements]
    const targetIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1

    if (targetIndex >= 0 && targetIndex < elements.length) {
      [newElements[currentIndex], newElements[targetIndex]] = 
      [newElements[targetIndex], newElements[currentIndex]]
      onElementsChange(newElements)
    }
  }

  return (
    <Box
      w="250px"
      h="full"
      bg="bg.default"
      borderRightWidth="1px"
      borderColor="border.default"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box
        px={3}
        py={2}
        borderBottomWidth="1px"
        borderColor="border.default"
        bg="bg.muted"
      >
        <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default' })}>
          Layers
        </h3>
      </Box>

      {/* Layer List */}
      <Box flex={1} overflow="auto">
        <Stack gap={0}>
          {/* Render in reverse order (top layer first) */}
          {[...elements].reverse().map((element, index) => {
            const isSelected = selectedIds.includes(element.id)
            const isVisible = element.visible !== false
            const isLocked = element.locked === true

            return (
              <Box
                key={element.id}
                px={2}
                py={2}
                bg={isSelected ? 'mint.subtle' : 'transparent'}
                borderLeftWidth="3px"
                borderColor={isSelected ? 'mint.default' : 'transparent'}
                cursor="pointer"
                _hover={{ bg: isSelected ? 'mint.subtle' : 'bg.muted' }}
                onClick={(e) => handleElementClick(element.id, e.ctrlKey || e.metaKey)}
              >
                <Flex align="center" gap={2}>
                  {/* Layer controls */}
                  <Flex align="center" gap={1}>
                    {/* Visibility toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVisibilityToggle(element.id)
                      }}
                      className={css({
                        w: 4,
                        h: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'xs',
                        opacity: isVisible ? 1 : 0.3,
                        _hover: { opacity: 1 }
                      })}
                      title={isVisible ? 'Hide' : 'Show'}
                    >
                      👁️
                    </button>

                    {/* Lock toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLockToggle(element.id)
                      }}
                      className={css({
                        w: 4,
                        h: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'xs',
                        opacity: isLocked ? 1 : 0.3,
                        _hover: { opacity: 1 }
                      })}
                      title={isLocked ? 'Unlock' : 'Lock'}
                    >
                      {isLocked ? '🔒' : '🔓'}
                    </button>
                  </Flex>

                  {/* Element info */}
                  <Flex align="center" gap={2} flex={1}>
                    <span className={css({ fontSize: 'sm' })}>
                      {getElementIcon(element)}
                    </span>
                    <Box flex={1}>
                      <p className={css({ 
                        fontSize: 'xs', 
                        fontWeight: 'medium',
                        color: isSelected ? 'mint.text' : 'fg.default',
                        truncate: true
                      })}>
                        {getElementName(element)}
                      </p>
                      <p className={css({ 
                        fontSize: '2xs', 
                        color: isSelected ? 'mint.muted' : 'fg.muted',
                        truncate: true
                      })}>
                        {Math.round(element.position.x)}%, {Math.round(element.position.y)}%
                      </p>
                    </Box>
                  </Flex>

                  {/* Layer order controls */}
                  <Flex flexDirection="column" gap={0}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveElement(element.id, 'up')
                      }}
                      disabled={index === 0}
                      className={css({
                        w: 4,
                        h: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2xs',
                        opacity: index === 0 ? 0.3 : 0.6,
                        _hover: { opacity: 1 },
                        _disabled: { cursor: 'not-allowed' }
                      })}
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveElement(element.id, 'down')
                      }}
                      disabled={index === elements.length - 1}
                      className={css({
                        w: 4,
                        h: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2xs',
                        opacity: index === elements.length - 1 ? 0.3 : 0.6,
                        _hover: { opacity: 1 },
                        _disabled: { cursor: 'not-allowed' }
                      })}
                      title="Move Down"
                    >
                      ▼
                    </button>
                  </Flex>
                </Flex>
              </Box>
            )
          })}
        </Stack>

        {elements.length === 0 && (
          <Box p={4} textAlign="center">
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              No elements yet
            </p>
            <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
              Use tools to add elements
            </p>
          </Box>
        )}
      </Box>

      {/* Footer info */}
      <Box
        px={3}
        py={2}
        borderTopWidth="1px"
        borderColor="border.default"
        bg="bg.muted"
      >
        <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
          {elements.length} element{elements.length !== 1 ? 's' : ''}
          {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
        </p>
      </Box>
    </Box>
  )
}