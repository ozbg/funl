'use client'

import React, { useMemo, useCallback } from 'react'
import { Rect, Text, Group } from 'react-konva'
import Konva from 'konva'
import { EnhancedLayoutElement, mergeSpacing, getLegacyAlignment } from '@/lib/types/layout-enhanced'

interface KonvaLayoutElementProps {
  element: EnhancedLayoutElement
  canvasWidth: number
  canvasHeight: number
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<EnhancedLayoutElement>) => void
  renderAsBackground?: boolean
}

export default function KonvaLayoutElement({
  element,
  canvasWidth,
  canvasHeight,
  isSelected,
  onSelect,
  onUpdate,
  renderAsBackground = false
}: KonvaLayoutElementProps) {
  // Convert percentage-based positions to absolute pixels
  const absolutePosition = useMemo(() => ({
    x: (element.position.x / 100) * canvasWidth,
    y: (element.position.y / 100) * canvasHeight
  }), [element.position, canvasWidth, canvasHeight])

  const absoluteSize = useMemo(() => ({
    width: (element.size.width / 100) * canvasWidth,
    height: (element.size.height / 100) * canvasHeight
  }), [element.size, canvasWidth, canvasHeight])

  // Handle drag events
  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    const newX = (node.x() / canvasWidth) * 100
    const newY = (node.y() / canvasHeight) * 100
    
    // Keep within bounds
    const boundedX = Math.max(0, Math.min(100 - element.size.width, newX))
    const boundedY = Math.max(0, Math.min(100 - element.size.height, newY))
    
    onUpdate({
      position: { x: boundedX, y: boundedY }
    })
  }, [canvasWidth, canvasHeight, element.size, onUpdate])

  const handleDragEnd = useCallback(() => {
    // Could add additional logic here like snapping
  }, [])

  // Get field value for display
  const getFieldValue = useCallback(() => {
    const fieldLabels = {
      business_name: 'Your Business Name',
      custom_message: 'Your custom message will appear here. This is a sample of longer text that shows how it will wrap and display.',
      contact_phone: '+1 (555) 123-4567',
      contact_email: 'hello@yourbusiness.com',
      website: 'www.yourbusiness.com',
      funnel_name: 'Your Funnel Name',
      logo: 'Logo'
    }
    
    if (element.field) {
      return fieldLabels[element.field as keyof typeof fieldLabels] || 'Sample Text'
    }
    return 'Text Element'
  }, [element.field])

  // Apply text transform
  const getTransformedText = useCallback((text: string) => {
    switch (element.textTransform) {
      case 'uppercase': return text.toUpperCase()
      case 'lowercase': return text.toLowerCase()
      case 'capitalize': 
        return text.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
      default: return text
    }
  }, [element.textTransform])

  // Calculate padding
  const padding = mergeSpacing(element.padding)
  const paddingPixels = {
    top: (padding.top / 100) * absoluteSize.height,
    right: (padding.right / 100) * absoluteSize.width,
    bottom: (padding.bottom / 100) * absoluteSize.height,
    left: (padding.left / 100) * absoluteSize.width
  }

  // Content area after padding
  const contentArea = {
    x: paddingPixels.left,
    y: paddingPixels.top,
    width: absoluteSize.width - paddingPixels.left - paddingPixels.right,
    height: absoluteSize.height - paddingPixels.top - paddingPixels.bottom
  }

  // Base group props
  const groupProps = {
    id: element.id,
    x: absolutePosition.x,
    y: absolutePosition.y,
    width: absoluteSize.width,
    height: absoluteSize.height,
    rotation: element.rotation || 0,
    opacity: element.opacity ?? 1,
    draggable: !renderAsBackground,
    onClick: onSelect,
    onTap: onSelect,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd
  }

  if (element.type === 'qr_code') {
    return (
      <Group {...groupProps}>
        {/* Background */}
        {element.backgroundColor && (
          <Rect
            width={absoluteSize.width}
            height={absoluteSize.height}
            fill={element.backgroundColor}
            cornerRadius={element.borderRadius ? (element.borderRadius / 100) * Math.min(absoluteSize.width, absoluteSize.height) : 0}
          />
        )}
        
        {/* Border */}
        {element.borderWidth && element.borderWidth > 0 && (
          <Rect
            width={absoluteSize.width}
            height={absoluteSize.height}
            stroke={element.borderColor || '#000000'}
            strokeWidth={element.borderWidth}
            cornerRadius={element.borderRadius ? (element.borderRadius / 100) * Math.min(absoluteSize.width, absoluteSize.height) : 0}
            fill="transparent"
          />
        )}
        
        {/* QR Code placeholder */}
        <Rect
          x={contentArea.x}
          y={contentArea.y}
          width={contentArea.width}
          height={contentArea.height}
          fill="#f0f0f0"
          cornerRadius={2}
        />
        
        <Text
          x={contentArea.x}
          y={contentArea.y + contentArea.height / 2}
          width={contentArea.width}
          height={contentArea.height / 2}
          text="QR CODE"
          fontSize={Math.min(contentArea.width, contentArea.height) * 0.15}
          fontFamily="Arial"
          fill="#666666"
          align="center"
          verticalAlign="middle"
        />
        
        {/* Selection indicator */}
        {isSelected && (
          <Rect
            width={absoluteSize.width}
            height={absoluteSize.height}
            stroke="#0066cc"
            strokeWidth={2}
            fill="transparent"
            dash={[5, 5]}
          />
        )}
      </Group>
    )
  }

  if (element.type === 'text') {
    // Get text alignment
    const textAlign = element.textAlign === 'justify' ? 'left' : getLegacyAlignment(element as any)
    
    // Calculate font size relative to canvas
    const fontSize = (element.fontSize || 14) * (canvasWidth / 500) // Adjust scaling factor as needed
    
    return (
      <Group {...groupProps}>
        {/* Background */}
        {element.backgroundColor && element.backgroundColor !== 'transparent' && (
          <Rect
            width={absoluteSize.width}
            height={absoluteSize.height}
            fill={element.backgroundColor}
            cornerRadius={element.borderRadius ? (element.borderRadius / 100) * Math.min(absoluteSize.width, absoluteSize.height) : 0}
          />
        )}
        
        {/* Border */}
        {element.borderWidth && element.borderWidth > 0 && (
          <Rect
            width={absoluteSize.width}
            height={absoluteSize.height}
            stroke={element.borderColor || '#000000'}
            strokeWidth={element.borderWidth}
            strokeDash={element.borderStyle === 'dashed' ? [10, 5] : 
                       element.borderStyle === 'dotted' ? [2, 2] : undefined}
            cornerRadius={element.borderRadius ? (element.borderRadius / 100) * Math.min(absoluteSize.width, absoluteSize.height) : 0}
            fill="transparent"
          />
        )}
        
        {/* Text content */}
        <Text
          x={contentArea.x}
          y={contentArea.y}
          width={contentArea.width}
          height={contentArea.height}
          text={getTransformedText(getFieldValue())}
          fontSize={fontSize}
          fontFamily={element.fontFamily || 'Arial'}
          fontStyle={`${element.fontStyle === 'italic' ? 'italic' : 'normal'} ${element.fontWeight || 'normal'}`}
          fill={element.color || '#000000'}
          align={textAlign}
          verticalAlign={element.verticalAlign || 'top'}
          lineHeight={element.lineHeight || 1.2}
          letterSpacing={(element.letterSpacing || 0) * (canvasWidth / 500)}
          textDecoration={element.textDecoration || 'none'}
          wrap="word"
          ellipsis={element.overflow === 'ellipsis'}
        />
        
        {/* Selection indicator */}
        {isSelected && (
          <Rect
            width={absoluteSize.width}
            height={absoluteSize.height}
            stroke="#0066cc"
            strokeWidth={2}
            fill="transparent"
            dash={[5, 5]}
          />
        )}
      </Group>
    )
  }

  if (element.type === 'image') {
    return (
      <Group {...groupProps}>
        {/* Background */}
        {element.backgroundColor && (
          <Rect
            width={absoluteSize.width}
            height={absoluteSize.height}
            fill={element.backgroundColor}
            cornerRadius={element.borderRadius ? (element.borderRadius / 100) * Math.min(absoluteSize.width, absoluteSize.height) : 0}
          />
        )}
        
        {/* Image placeholder */}
        <Rect
          x={contentArea.x}
          y={contentArea.y}
          width={contentArea.width}
          height={contentArea.height}
          fill="#e0e0e0"
          cornerRadius={2}
        />
        
        <Text
          x={contentArea.x}
          y={contentArea.y + contentArea.height / 2}
          width={contentArea.width}
          height={contentArea.height / 2}
          text="IMAGE"
          fontSize={Math.min(contentArea.width, contentArea.height) * 0.1}
          fontFamily="Arial"
          fill="#888888"
          align="center"
          verticalAlign="middle"
        />
        
        {/* Border */}
        {element.borderWidth && element.borderWidth > 0 && (
          <Rect
            width={absoluteSize.width}
            height={absoluteSize.height}
            stroke={element.borderColor || '#000000'}
            strokeWidth={element.borderWidth}
            cornerRadius={element.borderRadius ? (element.borderRadius / 100) * Math.min(absoluteSize.width, absoluteSize.height) : 0}
            fill="transparent"
          />
        )}
        
        {/* Selection indicator */}
        {isSelected && (
          <Rect
            width={absoluteSize.width}
            height={absoluteSize.height}
            stroke="#0066cc"
            strokeWidth={2}
            fill="transparent"
            dash={[5, 5]}
          />
        )}
      </Group>
    )
  }

  return null
}