'use client'

import React from 'react'
import { useDrop } from 'react-dnd'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import EnhancedDraggableElement from './EnhancedDraggableElement'
import { EnhancedLayoutElement, defaultElementStyle } from '@/lib/types/layout-enhanced'

interface EnhancedCanvasProps {
  printType: 'A4_portrait' | 'A5_portrait' | 'A5_landscape'
  elements: EnhancedLayoutElement[]
  selectedElement?: string
  onElementAdd: (element: Omit<EnhancedLayoutElement, 'id'>) => void
  onElementMove: (id: string, position: { x: number; y: number }) => void
  onElementSelect: (id: string) => void
  scale?: number
}

export default function EnhancedCanvas({
  printType,
  elements,
  selectedElement,
  onElementAdd,
  onElementMove,
  onElementSelect,
  scale = 0.5
}: EnhancedCanvasProps) {
  // Get paper dimensions
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
  const canvasWidth = dimensions.width * scale
  const canvasHeight = dimensions.height * scale

  const [{ isOver }, drop] = useDrop({
    accept: ['qr_code', 'text', 'image'],
    drop: (item: { type: string; field?: string }, monitor) => {
      const offset = monitor.getClientOffset()
      const canvasRect = (monitor.getDropResult() as any)?.getBoundingClientRect?.()
      
      if (!offset || !canvasRect) return

      // Calculate position relative to canvas
      const x = ((offset.x - canvasRect.left) / canvasWidth) * 100
      const y = ((offset.y - canvasRect.top) / canvasHeight) * 100

      // Create new element with enhanced defaults
      const newElement: Omit<EnhancedLayoutElement, 'id'> = {
        type: item.type as 'qr_code' | 'text' | 'image',
        field: item.field,
        position: { 
          x: Math.max(0, Math.min(90, x)), 
          y: Math.max(0, Math.min(90, y)) 
        },
        size: {
          width: item.type === 'qr_code' ? 20 : 40,
          height: item.type === 'qr_code' ? 20 : 10
        },
        ...defaultElementStyle,
        fontSize: item.field === 'business_name' ? 20 : 14,
        fontWeight: item.field === 'business_name' ? 'bold' : 'normal'
      }

      onElementAdd(newElement)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  const handleElementMove = (id: string, deltaX: number, deltaY: number) => {
    const element = elements.find(el => el.id === id)
    if (!element) return

    const newX = Math.max(0, Math.min(100 - element.size.width, element.position.x + (deltaX / canvasWidth) * 100))
    const newY = Math.max(0, Math.min(100 - element.size.height, element.position.y + (deltaY / canvasHeight) * 100))

    onElementMove(id, { x: newX, y: newY })
  }

  return (
    <Box>
      <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
        Layout Canvas
      </h3>
      
      <Box
        ref={drop}
        position="relative"
        width={`${canvasWidth}px`}
        height={`${canvasHeight}px`}
        mx="auto"
        bg="white"
        borderWidth="2px"
        borderColor={isOver ? 'mint.default' : 'border.default'}
        borderStyle={isOver ? 'dashed' : 'solid'}
        boxShadow="md"
        overflow="hidden"
        cursor="crosshair"
      >
        {/* Grid overlay */}
        <Box
          position="absolute"
          inset={0}
          opacity={0.1}
          style={{
            backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
            backgroundSize: `${canvasWidth / 20}px ${canvasHeight / 20}px`
          }}
        />

        {/* Drop zone hint */}
        {isOver && (
          <Box
            position="absolute"
            inset={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="mint.subtle"
            opacity={0.3}
          >
            <p className={css({ fontSize: 'lg', color: 'mint.default', fontWeight: 'bold' })}>
              Drop Here
            </p>
          </Box>
        )}

        {/* Render elements */}
        {elements.map(element => (
          <EnhancedDraggableElement
            key={element.id}
            element={element}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            isSelected={selectedElement === element.id}
            onMove={handleElementMove}
            onSelect={() => onElementSelect(element.id)}
          />
        ))}
      </Box>

      {/* Canvas Info */}
      <Box mt={3} textAlign="center">
        <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
          {printType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {dimensions.width} × {dimensions.height}mm
        </p>
        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
          Drag elements from the palette to add them to your layout
        </p>
      </Box>
    </Box>
  )
}