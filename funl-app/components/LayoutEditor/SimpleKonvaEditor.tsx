'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Group, Transformer } from 'react-konva'
import Konva from 'konva'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { EnhancedLayoutElement } from '@/lib/types/layout-enhanced'
import { nanoid } from 'nanoid'

interface SimpleKonvaEditorProps {
  printType: 'A4_portrait' | 'A5_portrait' | 'A5_landscape'
  elements: EnhancedLayoutElement[]
  onElementsChange: (elements: EnhancedLayoutElement[]) => void
  onSelectionChange: (ids: string[]) => void
}

export default function SimpleKonvaEditor({
  printType,
  elements,
  onElementsChange,
  onSelectionChange
}: SimpleKonvaEditorProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tool, setTool] = useState<'select' | 'text' | 'qr'>('select')

  // Get paper dimensions
  const getPaperDimensions = () => {
    switch (printType) {
      case 'A4_portrait': return { width: 210, height: 297 }
      case 'A5_portrait': return { width: 148, height: 210 }
      case 'A5_landscape': return { width: 210, height: 148 }
      default: return { width: 210, height: 297 }
    }
  }

  const dimensions = getPaperDimensions()
  const scale = 2
  const canvasWidth = dimensions.width * scale
  const canvasHeight = dimensions.height * scale

  // Handle element selection
  const handleElementSelect = useCallback((id: string | null) => {
    setSelectedId(id)
    onSelectionChange(id ? [id] : [])
    
    if (transformerRef.current) {
      if (id && stageRef.current) {
        const node = stageRef.current.findOne(`#${id}`)
        if (node) {
          transformerRef.current.nodes([node])
        }
      } else {
        transformerRef.current.nodes([])
      }
    }
  }, [onSelectionChange])

  // Handle canvas click
  const handleCanvasClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === stageRef.current) {
      handleElementSelect(null)
      return
    }

    if (tool === 'select') return

    // Add element on click
    const stage = stageRef.current
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    const x = (pos.x / canvasWidth) * 100
    const y = (pos.y / canvasHeight) * 100

    let newElement: EnhancedLayoutElement

    if (tool === 'text') {
      newElement = {
        id: nanoid(),
        type: 'text',
        field: 'custom_message',
        position: { x, y },
        size: { width: 30, height: 8 },
        fontSize: 14,
        color: '#000000'
      }
    } else if (tool === 'qr') {
      newElement = {
        id: nanoid(),
        type: 'qr_code',
        position: { x, y },
        size: { width: 20, height: 20 }
      }
    } else {
      return
    }

    const updatedElements = [...elements, newElement]
    onElementsChange(updatedElements)
    handleElementSelect(newElement.id)
    setTool('select')
  }, [tool, elements, onElementsChange, handleElementSelect, canvasWidth, canvasHeight])

  // Handle element updates
  const handleElementUpdate = useCallback((id: string, updates: Partial<EnhancedLayoutElement>) => {
    const updatedElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
    onElementsChange(updatedElements)
  }, [elements, onElementsChange])

  // Handle transform end
  const handleTransformEnd = useCallback(() => {
    if (!transformerRef.current || !selectedId) return

    const nodes = transformerRef.current.nodes()
    if (nodes.length === 0) return

    const node = nodes[0]
    const newX = (node.x() / canvasWidth) * 100
    const newY = (node.y() / canvasHeight) * 100
    const newWidth = ((node.width() * node.scaleX()) / canvasWidth) * 100
    const newHeight = ((node.height() * node.scaleY()) / canvasHeight) * 100

    handleElementUpdate(selectedId, {
      position: { x: Math.max(0, newX), y: Math.max(0, newY) },
      size: { width: Math.max(5, newWidth), height: Math.max(5, newHeight) },
      rotation: node.rotation()
    })

    // Reset scale
    node.scaleX(1)
    node.scaleY(1)
  }, [selectedId, canvasWidth, canvasHeight, handleElementUpdate])

  // Get field value for display
  const getFieldValue = (field?: string) => {
    const defaults = {
      business_name: 'Your Business',
      custom_message: 'Your message here',
      contact_phone: '+1 (555) 123-4567',
      contact_email: 'hello@business.com',
      website: 'www.business.com'
    }
    return field ? defaults[field as keyof typeof defaults] || 'Text' : 'Text'
  }

  return (
    <Box>
      {/* Simple Toolbar */}
      <Flex gap={2} mb={4} p={2} bg="bg.muted" borderRadius="md">
        <button
          onClick={() => setTool('select')}
          className={css({
            px: 3,
            py: 2,
            bg: tool === 'select' ? 'mint.default' : 'bg.default',
            color: tool === 'select' ? 'mint.fg' : 'fg.default',
            borderRadius: 'md',
            cursor: 'pointer'
          })}
        >
          ↖️ Select
        </button>
        <button
          onClick={() => setTool('text')}
          className={css({
            px: 3,
            py: 2,
            bg: tool === 'text' ? 'mint.default' : 'bg.default',
            color: tool === 'text' ? 'mint.fg' : 'fg.default',
            borderRadius: 'md',
            cursor: 'pointer'
          })}
        >
          📝 Text
        </button>
        <button
          onClick={() => setTool('qr')}
          className={css({
            px: 3,
            py: 2,
            bg: tool === 'qr' ? 'mint.default' : 'bg.default',
            color: tool === 'qr' ? 'mint.fg' : 'fg.default',
            borderRadius: 'md',
            cursor: 'pointer'
          })}
        >
          📱 QR Code
        </button>
      </Flex>

      {/* Canvas */}
      <Box
        bg="white"
        borderWidth="2px"
        borderColor="border.default"
        mx="auto"
        width={`${canvasWidth}px`}
        height={`${canvasHeight}px`}
      >
        <Stage
          ref={stageRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleCanvasClick}
          onTap={handleCanvasClick}
        >
          <Layer>
            {/* Paper background */}
            <Rect
              width={canvasWidth}
              height={canvasHeight}
              fill="#ffffff"
              stroke="#cccccc"
              strokeWidth={1}
            />

            {/* Elements */}
            {elements.map(element => {
              const x = (element.position.x / 100) * canvasWidth
              const y = (element.position.y / 100) * canvasHeight
              const width = (element.size.width / 100) * canvasWidth
              const height = (element.size.height / 100) * canvasHeight

              if (element.type === 'text') {
                return (
                  <Group
                    key={element.id}
                    id={element.id}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    draggable={tool === 'select'}
                    onClick={() => handleElementSelect(element.id)}
                    onTap={() => handleElementSelect(element.id)}
                    onDragEnd={(e) => {
                      const newX = (e.target.x() / canvasWidth) * 100
                      const newY = (e.target.y() / canvasHeight) * 100
                      handleElementUpdate(element.id, {
                        position: { x: newX, y: newY }
                      })
                    }}
                  >
                    <Text
                      text={getFieldValue(element.field)}
                      fontSize={(element.fontSize || 14) * scale}
                      fill={element.color || '#000000'}
                      width={width}
                      height={height}
                    />
                  </Group>
                )
              }

              if (element.type === 'qr_code') {
                return (
                  <Group
                    key={element.id}
                    id={element.id}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    draggable={tool === 'select'}
                    onClick={() => handleElementSelect(element.id)}
                    onTap={() => handleElementSelect(element.id)}
                    onDragEnd={(e) => {
                      const newX = (e.target.x() / canvasWidth) * 100
                      const newY = (e.target.y() / canvasHeight) * 100
                      handleElementUpdate(element.id, {
                        position: { x: newX, y: newY }
                      })
                    }}
                  >
                    <Rect
                      width={width}
                      height={height}
                      fill="#f0f0f0"
                      stroke="#666666"
                      strokeWidth={1}
                    />
                    <Text
                      x={width * 0.25}
                      y={height * 0.4}
                      text="QR"
                      fontSize={width * 0.2}
                      fill="#666666"
                    />
                  </Group>
                )
              }

              return null
            })}

            {/* Transformer */}
            <Transformer
              ref={transformerRef}
              onTransformEnd={handleTransformEnd}
              borderStroke="#0066cc"
              borderStrokeWidth={2}
              anchorFill="#ffffff"
              anchorStroke="#0066cc"
              anchorSize={8}
              keepRatio={false}
              enabledAnchors={[
                'top-left', 'top-center', 'top-right',
                'middle-right', 'middle-left',
                'bottom-left', 'bottom-center', 'bottom-right'
              ]}
            />
          </Layer>
        </Stage>
      </Box>

      {/* Info */}
      <Box mt={3} textAlign="center">
        <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
          {printType.replace('_', ' ')} • {dimensions.width} × {dimensions.height}mm • {elements.length} elements
        </p>
        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
          Click tools above, then click canvas to add elements. Use Select tool to move and resize.
        </p>
      </Box>
    </Box>
  )
}