'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { Group, Transformer } from 'react-konva'
import Konva from 'konva'
import { EnhancedLayoutElement } from '@/lib/types/layout-enhanced'
import KonvaLayoutElement from './KonvaLayoutElement'

interface ElementCanvasProps {
  elements: EnhancedLayoutElement[]
  selectedIds: string[]
  canvasWidth: number
  canvasHeight: number
  onElementsChange: (elements: EnhancedLayoutElement[]) => void
  onSelectionChange: (ids: string[]) => void
  onElementClick: (id: string, addToSelection?: boolean) => void
  snapToGuides: (
    position: { x: number; y: number },
    size: { width: number; height: number },
    excludeElementId?: string
  ) => { position: { x: number; y: number }; activeSnapLines?: any[] }
  zoom: number
}

export default function ElementCanvas({
  elements,
  selectedIds,
  canvasWidth,
  canvasHeight,
  onElementsChange,
  onSelectionChange,
  onElementClick,
  snapToGuides,
  zoom
}: ElementCanvasProps) {
  const transformerRef = useRef<Konva.Transformer>(null)
  const selectionRectRef = useRef<Konva.Rect>(null)

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current) return

    const selectedNodes: Konva.Node[] = []
    
    selectedIds.forEach(id => {
      const node = transformerRef.current?.getStage()?.findOne(`#${id}`)
      if (node) selectedNodes.push(node)
    })

    transformerRef.current.nodes(selectedNodes)
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedIds])

  // Handle element updates with snapping
  const handleElementUpdate = useCallback((id: string, updates: Partial<EnhancedLayoutElement>) => {
    const element = elements.find(el => el.id === id)
    if (!element) return

    let finalUpdates = updates

    // Apply snapping if position is being updated
    if (updates.position) {
      const snapped = snapToGuides(
        updates.position,
        updates.size || element.size,
        id
      )
      finalUpdates = { ...updates, position: snapped.position }
    }

    const updatedElements = elements.map(el =>
      el.id === id ? { ...el, ...finalUpdates } : el
    )
    onElementsChange(updatedElements)
  }, [elements, onElementsChange, snapToGuides])

  // Handle transformer events
  const handleTransformEnd = useCallback(() => {
    if (!transformerRef.current) return

    const nodes = transformerRef.current.nodes()
    if (nodes.length === 0) return

    const updates: { [id: string]: Partial<EnhancedLayoutElement> } = {}

    nodes.forEach(node => {
      const id = node.id()
      const element = elements.find(el => el.id === id)
      if (!element) return

      // Calculate new position and size as percentages
      const newX = (node.x() / canvasWidth) * 100
      const newY = (node.y() / canvasHeight) * 100
      const newWidth = ((node.width() * node.scaleX()) / canvasWidth) * 100
      const newHeight = ((node.height() * node.scaleY()) / canvasHeight) * 100

      updates[id] = {
        position: {
          x: Math.max(0, Math.min(100 - newWidth, newX)),
          y: Math.max(0, Math.min(100 - newHeight, newY))
        },
        size: {
          width: Math.max(5, Math.min(95, newWidth)),
          height: Math.max(5, Math.min(95, newHeight))
        },
        rotation: node.rotation()
      }

      // Reset scale to prevent cumulative scaling
      node.scaleX(1)
      node.scaleY(1)
    })

    // Apply all updates
    const updatedElements = elements.map(el => 
      updates[el.id] ? { ...el, ...updates[el.id] } : el
    )
    onElementsChange(updatedElements)
  }, [elements, onElementsChange, canvasWidth, canvasHeight])

  // Boundary function for transformer
  const boundBoxFunc = useCallback((oldBox: any, newBox: any) => {
    // Ensure elements stay within canvas bounds
    return {
      ...newBox,
      x: Math.max(0, Math.min(canvasWidth - newBox.width, newBox.x)),
      y: Math.max(0, Math.min(canvasHeight - newBox.height, newBox.y)),
      width: Math.max(20, Math.min(canvasWidth - newBox.x, newBox.width)),
      height: Math.max(20, Math.min(canvasHeight - newBox.y, newBox.height))
    }
  }, [canvasWidth, canvasHeight])

  return (
    <>
      {/* Render all elements */}
      {elements.map(element => {
        // Skip locked or hidden elements from interaction
        if (element.locked || element.visible === false) {
          return (
            <KonvaLayoutElement
              key={element.id}
              element={element}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              isSelected={false}
              onSelect={() => {}}
              onUpdate={() => {}}
              renderAsBackground={true}
            />
          )
        }

        return (
          <KonvaLayoutElement
            key={element.id}
            element={element}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            isSelected={selectedIds.includes(element.id)}
            onSelect={() => onElementClick(element.id)}
            onUpdate={(updates) => handleElementUpdate(element.id, updates)}
          />
        )
      })}

      {/* Multi-selection transformer */}
      {selectedIds.length > 0 && (
        <Transformer
          ref={transformerRef}
          onTransformEnd={handleTransformEnd}
          boundBoxFunc={boundBoxFunc}
          // Styling
          borderStroke="#0066cc"
          borderStrokeWidth={2 / zoom}
          anchorFill="#ffffff"
          anchorStroke="#0066cc"
          anchorStrokeWidth={2 / zoom}
          anchorSize={8 / zoom}
          // Controls
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-right', 'middle-left',
            'bottom-left', 'bottom-center', 'bottom-right'
          ]}
          rotateAnchorOffset={20 / zoom}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          keepRatio={false}
          centeredScaling={false}
          flipEnabled={false}
          // Multi-selection handling
          shouldOverdrawWholeArea={selectedIds.length > 1}
        />
      )}
    </>
  )
}