'use client'

import React from 'react'
import { useDrag } from 'react-dnd'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'

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

interface DraggableElementProps {
  element: LayoutElement
  canvasWidth: number
  canvasHeight: number
  isSelected: boolean
  onMove: (id: string, deltaX: number, deltaY: number) => void
  onSelect: () => void
}

export default function DraggableElement({
  element,
  canvasWidth,
  canvasHeight,
  isSelected,
  onMove,
  onSelect
}: DraggableElementProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'canvas-element',
    item: { id: element.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset()
      if (delta) {
        onMove(element.id, delta.x, delta.y)
      }
    },
  })

  // Calculate actual position and size on canvas
  const left = (element.position.x / 100) * canvasWidth
  const top = (element.position.y / 100) * canvasHeight
  const width = (element.size.width / 100) * canvasWidth
  const height = (element.size.height / 100) * canvasHeight

  const getElementContent = () => {
    switch (element.type) {
      case 'qr_code':
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="gray.100"
            w="full"
            h="full"
            fontSize="xs"
            color="gray.600"
            fontWeight="bold"
          >
            QR
          </Box>
        )
      case 'text':
        const fieldLabels = {
          business_name: 'Business Name',
          custom_message: 'Message',
          contact_phone: 'Phone',
          contact_email: 'Email',
          website: 'Website',
          funnel_name: 'Funnel Name'
        }
        
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent={element.alignment === 'center' ? 'center' : 
                           element.alignment === 'right' ? 'flex-end' : 'flex-start'}
            bg="blue.50"
            w="full"
            h="full"
            px={1}
            fontSize="xs"
            color="blue.700"
            fontWeight={element.fontWeight === 'bold' ? 'bold' : 'normal'}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {fieldLabels[element.field as keyof typeof fieldLabels] || 'Text'}
          </Box>
        )
      case 'image':
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="green.50"
            w="full"
            h="full"
            fontSize="xs"
            color="green.700"
            fontWeight="bold"
          >
            IMG
          </Box>
        )
      default:
        return null
    }
  }

  return (
    <Box
      ref={drag}
      position="absolute"
      left={`${left}px`}
      top={`${top}px`}
      width={`${width}px`}
      height={`${height}px`}
      cursor="move"
      opacity={isDragging ? 0.5 : 1}
      onClick={onSelect}
      borderWidth={isSelected ? '2px' : '1px'}
      borderColor={isSelected ? 'mint.default' : 'border.muted'}
      borderStyle="dashed"
      _hover={{
        borderColor: isSelected ? 'mint.emphasized' : 'border.default'
      }}
    >
      {getElementContent()}
      
      {/* Selection handles */}
      {isSelected && (
        <>
          <Box
            position="absolute"
            top="-4px"
            left="-4px"
            w="6px"
            h="6px"
            bg="mint.default"
            borderWidth="1px"
            borderColor="white"
          />
          <Box
            position="absolute"
            top="-4px"
            right="-4px"
            w="6px"
            h="6px"
            bg="mint.default"
            borderWidth="1px"
            borderColor="white"
          />
          <Box
            position="absolute"
            bottom="-4px"
            left="-4px"
            w="6px"
            h="6px"
            bg="mint.default"
            borderWidth="1px"
            borderColor="white"
          />
          <Box
            position="absolute"
            bottom="-4px"
            right="-4px"
            w="6px"
            h="6px"
            bg="mint.default"
            borderWidth="1px"
            borderColor="white"
          />
        </>
      )}
    </Box>
  )
}