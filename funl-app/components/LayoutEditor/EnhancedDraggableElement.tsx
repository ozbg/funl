'use client'

import React, { useState } from 'react'
import { useDrag } from 'react-dnd'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { EnhancedLayoutElement, mergeSpacing, getLegacyAlignment } from '@/lib/types/layout-enhanced'

interface EnhancedDraggableElementProps {
  element: EnhancedLayoutElement
  canvasWidth: number
  canvasHeight: number
  isSelected: boolean
  onMove: (id: string, deltaX: number, deltaY: number) => void
  onSelect: () => void
}

export default function EnhancedDraggableElement({
  element,
  canvasWidth,
  canvasHeight,
  isSelected,
  onMove,
  onSelect
}: EnhancedDraggableElementProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const getFieldLabel = () => {
    const labels = {
      business_name: 'Business Name',
      custom_message: 'Custom Message',
      contact_phone: 'Phone',
      contact_email: 'Email',
      website: 'Website',
      funnel_name: 'Funnel Name',
      logo: 'Logo'
    }
    
    if (element.type === 'qr_code') return 'QR Code'
    if (element.field) {
      return labels[element.field as keyof typeof labels] || 'Text'
    }
    return element.type === 'image' ? 'Image' : 'Text'
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    onSelect()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    onMove(element.id, deltaX, deltaY)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // Calculate actual positions with margin and padding
  const padding = mergeSpacing(element.padding)
  const margin = mergeSpacing(element.margin)
  
  const actualLeft = `${element.position.x + margin.left}%`
  const actualTop = `${element.position.y + margin.top}%`
  const actualWidth = `${element.size.width - margin.left - margin.right}%`
  const actualHeight = `${element.size.height - margin.top - margin.bottom}%`

  // Apply text transform
  const getTransformedText = (text: string) => {
    switch (element.textTransform) {
      case 'uppercase': return text.toUpperCase()
      case 'lowercase': return text.toLowerCase()
      case 'capitalize': return text.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
      default: return text
    }
  }

  // Get text alignment
  const getTextAlign = () => {
    if (element.textAlign === 'justify') return 'justify'
    return getLegacyAlignment(element)
  }

  // Get vertical alignment styles
  const getVerticalAlignStyles = () => {
    switch (element.verticalAlign) {
      case 'middle':
        return {
          display: 'flex',
          alignItems: 'center',
          justifyContent: getTextAlign() === 'center' ? 'center' : 
                         getTextAlign() === 'right' ? 'flex-end' : 'flex-start'
        }
      case 'bottom':
        return {
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: getTextAlign() === 'center' ? 'center' : 
                         getTextAlign() === 'right' ? 'flex-end' : 'flex-start'
        }
      default:
        return {
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: getTextAlign() === 'center' ? 'center' : 
                         getTextAlign() === 'right' ? 'flex-end' : 'flex-start'
        }
    }
  }

  const elementContent = () => {
    switch (element.type) {
      case 'qr_code':
        return (
          <Box
            width="100%"
            height="100%"
            bg="gray.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius={`${element.borderRadius || 0}%`}
            opacity={element.opacity ?? 1}
          >
            <p className={css({ fontSize: 'xs', color: 'gray.600', fontWeight: 'bold' })}>
              QR Code
            </p>
          </Box>
        )
      
      case 'text':
        return (
          <Box
            width="100%"
            height="100%"
            padding={`${padding.top}% ${padding.right}% ${padding.bottom}% ${padding.left}%`}
            bg={element.backgroundColor || 'transparent'}
            color={element.color || '#000'}
            borderWidth={`${element.borderWidth || 0}px`}
            borderColor={element.borderColor || '#000'}
            borderStyle={element.borderStyle || 'solid'}
            borderRadius={`${element.borderRadius || 0}%`}
            opacity={element.opacity ?? 1}
            style={{
              ...getVerticalAlignStyles(),
              fontSize: `${(element.fontSize || 14) * (canvasWidth / 210)}px`,
              fontWeight: element.fontWeight || 'normal',
              fontFamily: element.fontFamily || 'helvetica, sans-serif',
              fontStyle: element.fontStyle || 'normal',
              lineHeight: element.lineHeight || 1.2,
              letterSpacing: `${element.letterSpacing || 0}px`,
              textAlign: getTextAlign(),
              textDecoration: element.textDecoration || 'none',
              wordWrap: (element.wordWrap === 'no-wrap' ? 'normal' : element.wordWrap) || 'break-word',
              overflow: element.overflow || 'visible',
              textOverflow: element.overflow === 'ellipsis' ? 'ellipsis' : 'clip',
              transform: `rotate(${element.rotation || 0}deg)`,
              transformOrigin: 'center',
              boxShadow: element.shadow ? 
                `${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.color}` : 
                'none'
            }}
          >
            <span style={{ width: '100%', textAlign: getTextAlign() as any }}>
              {getTransformedText(getFieldLabel())}
            </span>
          </Box>
        )
      
      case 'image':
        return (
          <Box
            width="100%"
            height="100%"
            bg="gray.50"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderWidth={`${element.borderWidth || 0}px`}
            borderColor={element.borderColor || '#000'}
            borderStyle={element.borderStyle || 'solid'}
            borderRadius={`${element.borderRadius || 0}%`}
            opacity={element.opacity ?? 1}
            style={{
              transform: `rotate(${element.rotation || 0}deg)`,
              transformOrigin: 'center',
            }}
          >
            <p className={css({ fontSize: 'xs', color: 'gray.500' })}>
              Image
            </p>
          </Box>
        )
      
      default:
        return null
    }
  }

  return (
    <Box
      position="absolute"
      left={actualLeft}
      top={actualTop}
      width={actualWidth}
      height={actualHeight}
      cursor={isDragging ? 'grabbing' : 'grab'}
      borderWidth="2px"
      borderColor={isSelected ? 'mint.default' : 'transparent'}
      borderStyle={isSelected ? 'solid' : 'dashed'}
      _hover={{
        borderColor: 'mint.subtle',
        borderStyle: 'dashed'
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {elementContent()}
      
      {/* Element label on hover */}
      <Box
        position="absolute"
        top="-20px"
        left="0"
        fontSize="2xs"
        bg="bg.default"
        px={1}
        py={0.5}
        borderWidth="1px"
        borderColor="border.default"
        display="none"
        _groupHover={{ display: 'block' }}
        whiteSpace="nowrap"
      >
        {getFieldLabel()}
      </Box>
    </Box>
  )
}