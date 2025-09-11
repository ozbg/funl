'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Stage, Layer } from 'react-konva'
import Konva from 'konva'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { EnhancedLayoutElement } from '@/lib/types/layout-enhanced'
import KonvaLayoutElement from './KonvaLayoutElement'
import KonvaTransformer from './KonvaTransformer'
import { nanoid } from 'nanoid'

interface KonvaLayoutEditorProps {
  printType: 'A4_portrait' | 'A5_portrait' | 'A5_landscape'
  elements: EnhancedLayoutElement[]
  selectedElement?: string
  onElementsChange: (elements: EnhancedLayoutElement[]) => void
  onElementSelect: (id: string | null) => void
  scale?: number
}

export default function KonvaLayoutEditor({
  printType,
  elements,
  selectedElement,
  onElementsChange,
  onElementSelect,
  scale = 0.6
}: KonvaLayoutEditorProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [draggedElement, setDraggedElement] = useState<{ type: string; field?: string } | null>(null)

  // Get paper dimensions in mm and convert to pixels for canvas
  const getPaperDimensions = () => {
    switch (printType) {
      case 'A4_portrait':
        return { width: 210, height: 297 }
      case 'A5_portrait':
        return { width: 148, height: 210 }
      case 'A5_landscape':
        return { width: 210, height: 148 }
      default:
        return { width: 210, height: 297 }
    }
  }

  const dimensions = getPaperDimensions()
  const canvasWidth = dimensions.width * scale * 3 // Scale up for better resolution
  const canvasHeight = dimensions.height * scale * 3

  // Handle element selection
  const handleElementSelect = useCallback((id: string | null) => {
    onElementSelect(id)
    
    // Update transformer
    if (transformerRef.current) {
      if (id) {
        const stage = stageRef.current
        if (stage) {
          const selectedNode = stage.findOne(`#${id}`)
          if (selectedNode) {
            transformerRef.current.nodes([selectedNode])
          }
        }
      } else {
        transformerRef.current.nodes([])
      }
    }
  }, [onElementSelect])

  // Handle element updates
  const handleElementUpdate = useCallback((id: string, updates: Partial<EnhancedLayoutElement>) => {
    const updatedElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
    onElementsChange(updatedElements)
  }, [elements, onElementsChange])

  // Handle stage click (deselect when clicking empty area)
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Check if we clicked on empty area
    if (e.target === stageRef.current) {
      handleElementSelect(null)
    }
  }, [handleElementSelect])

  // Handle drag and drop from palette
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    
    if (!draggedElement) return

    const stage = stageRef.current
    if (!stage) return

    // Get drop position relative to stage
    const stageBox = stage.container().getBoundingClientRect()
    const x = ((e.clientX - stageBox.left) / canvasWidth) * 100
    const y = ((e.clientY - stageBox.top) / canvasHeight) * 100

    // Create new element
    const newElement: EnhancedLayoutElement = {
      id: nanoid(),
      type: draggedElement.type as any,
      field: draggedElement.field,
      position: { 
        x: Math.max(0, Math.min(90, x)), 
        y: Math.max(0, Math.min(90, y)) 
      },
      size: {
        width: draggedElement.type === 'qr_code' ? 20 : 40,
        height: draggedElement.type === 'qr_code' ? 20 : 10
      },
      fontSize: draggedElement.field === 'business_name' ? 20 : 14,
      fontWeight: draggedElement.field === 'business_name' ? 'bold' : 'normal',
      textAlign: 'left',
      verticalAlign: 'top',
      color: '#000000',
      opacity: 1
    }

    const updatedElements = [...elements, newElement]
    onElementsChange(updatedElements)
    handleElementSelect(newElement.id)
    setDraggedElement(null)
  }, [draggedElement, elements, onElementsChange, handleElementSelect, canvasWidth, canvasHeight])

  // Handle element deletion
  const handleElementDelete = useCallback((id: string) => {
    const updatedElements = elements.filter(el => el.id !== id)
    onElementsChange(updatedElements)
    handleElementSelect(null)
  }, [elements, onElementsChange, handleElementSelect])

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return

    if (selectedElement) {
      const selectedNode = stageRef.current.findOne(`#${selectedElement}`)
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode])
        transformerRef.current.getLayer()?.batchDraw()
      }
    } else {
      transformerRef.current.nodes([])
    }
  }, [selectedElement])

  return (
    <Box>
      <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
        Konva Layout Canvas
      </h3>
      
      {/* Element Palette */}
      <Box mb={4} p={3} bg="bg.muted" borderRadius="md">
        <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', mb: 2 })}>
          Elements - Drag to Canvas
        </h4>
        <Flex gap={2} flexWrap="wrap">
          <DraggableElementButton
            type="qr_code"
            label="QR Code"
            onDragStart={() => setDraggedElement({ type: 'qr_code' })}
          />
          <DraggableElementButton
            type="text"
            field="business_name"
            label="Business Name"
            onDragStart={() => setDraggedElement({ type: 'text', field: 'business_name' })}
          />
          <DraggableElementButton
            type="text"
            field="custom_message"
            label="Custom Message"
            onDragStart={() => setDraggedElement({ type: 'text', field: 'custom_message' })}
          />
          <DraggableElementButton
            type="text"
            field="contact_phone"
            label="Phone"
            onDragStart={() => setDraggedElement({ type: 'text', field: 'contact_phone' })}
          />
          <DraggableElementButton
            type="text"
            field="contact_email"
            label="Email"
            onDragStart={() => setDraggedElement({ type: 'text', field: 'contact_email' })}
          />
        </Flex>
      </Box>

      {/* Canvas */}
      <Box
        position="relative"
        bg="white"
        borderWidth="2px"
        borderColor="border.default"
        borderStyle="solid"
        boxShadow="md"
        overflow="hidden"
        mx="auto"
        width={`${canvasWidth}px`}
        height={`${canvasHeight}px`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Stage
          ref={stageRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            {/* Paper background */}
            <KonvaLayoutElement
              key="paper-bg"
              element={{
                id: 'paper-bg',
                type: 'text' as const,
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: '#e5e5e5'
              } as EnhancedLayoutElement}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              isSelected={false}
              onSelect={() => {}}
              onUpdate={() => {}}
              renderAsBackground
            />

            {/* Grid overlay */}
            {Array.from({ length: 10 }, (_, i) => (
              <React.Fragment key={`grid-${i}`}>
                {/* Vertical lines */}
                <KonvaLayoutElement
                  key={`v-line-${i}`}
                  element={{
                    id: `v-line-${i}`,
                    type: 'text' as const,
                    position: { x: i * 10, y: 0 },
                    size: { width: 0.1, height: 100 },
                    backgroundColor: 'transparent',
                    borderWidth: 0.5,
                    borderColor: '#f0f0f0',
                    opacity: 0.3
                  } as EnhancedLayoutElement}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  isSelected={false}
                  onSelect={() => {}}
                  onUpdate={() => {}}
                  renderAsBackground
                />
                {/* Horizontal lines */}
                <KonvaLayoutElement
                  key={`h-line-${i}`}
                  element={{
                    id: `h-line-${i}`,
                    type: 'text' as const,
                    position: { x: 0, y: i * 10 },
                    size: { width: 100, height: 0.1 },
                    backgroundColor: 'transparent',
                    borderWidth: 0.5,
                    borderColor: '#f0f0f0',
                    opacity: 0.3
                  } as EnhancedLayoutElement}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  isSelected={false}
                  onSelect={() => {}}
                  onUpdate={() => {}}
                  renderAsBackground
                />
              </React.Fragment>
            ))}

            {/* Layout Elements */}
            {elements.map(element => (
              <KonvaLayoutElement
                key={element.id}
                element={element}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                isSelected={selectedElement === element.id}
                onSelect={() => handleElementSelect(element.id)}
                onUpdate={(updates) => handleElementUpdate(element.id, updates)}
              />
            ))}

            {/* Transformer */}
            <KonvaTransformer
              ref={transformerRef}
              selectedElement={selectedElement}
              onElementUpdate={handleElementUpdate}
              onElementDelete={handleElementDelete}
            />
          </Layer>
        </Stage>
      </Box>

      {/* Canvas Info */}
      <Box mt={3} textAlign="center">
        <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
          {printType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {dimensions.width} × {dimensions.height}mm
        </p>
        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
          Drag elements from palette above, then use handles to resize and rotate
        </p>
      </Box>
    </Box>
  )
}

// Helper component for draggable element buttons
interface DraggableElementButtonProps {
  type: string
  field?: string
  label: string
  onDragStart: () => void
}

function DraggableElementButton({ type, field, label, onDragStart }: DraggableElementButtonProps) {
  return (
    <Box
      as="button"
      draggable
      onDragStart={onDragStart}
      px={3}
      py={2}
      bg="bg.default"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="md"
      fontSize="xs"
      cursor="grab"
      _hover={{ bg: 'bg.muted' }}
      _active={{ cursor: 'grabbing' }}
    >
      {label}
    </Box>
  )
}