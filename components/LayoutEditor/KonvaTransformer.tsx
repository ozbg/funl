'use client'

import React, { useEffect, forwardRef, useImperativeHandle, useRef } from 'react'
import { Transformer } from 'react-konva'
import Konva from 'konva'
import { EnhancedLayoutElement } from '@/lib/types/layout-enhanced'

interface KonvaTransformerProps {
  selectedElement?: string | null
  onElementUpdate: (id: string, updates: Partial<EnhancedLayoutElement>) => void
  onElementDelete: (id: string) => void
}

const KonvaTransformer = forwardRef<Konva.Transformer, KonvaTransformerProps>(
  ({ selectedElement, onElementUpdate, onElementDelete }, ref) => {
    const transformerRef = useRef<Konva.Transformer>(null)

    // Expose the transformer ref to parent component
    useImperativeHandle(ref, () => transformerRef.current!, [])

    // Handle transform end - update element properties
    const handleTransformEnd = () => {
      if (!transformerRef.current || !selectedElement) return

      const nodes = transformerRef.current.nodes()
      if (nodes.length === 0) return

      const node = nodes[0]
      const stage = node.getStage()
      if (!stage) return

      // Calculate new position and size as percentages
      const stageWidth = stage.width()
      const stageHeight = stage.height()
      
      const newX = (node.x() / stageWidth) * 100
      const newY = (node.y() / stageHeight) * 100
      const newWidth = ((node.width() * node.scaleX()) / stageWidth) * 100
      const newHeight = ((node.height() * node.scaleY()) / stageHeight) * 100
      const newRotation = node.rotation()

      // Update the element
      onElementUpdate(selectedElement, {
        position: { 
          x: Math.max(0, Math.min(100 - newWidth, newX)), 
          y: Math.max(0, Math.min(100 - newHeight, newY)) 
        },
        size: { 
          width: Math.max(5, Math.min(95, newWidth)), 
          height: Math.max(5, Math.min(95, newHeight)) 
        },
        rotation: newRotation
      })

      // Reset scale to prevent cumulative scaling
      node.scaleX(1)
      node.scaleY(1)
    }

    // Boundary function to keep elements within stage bounds
    const boundBoxFunc = (oldBox: any, newBox: any) => {
      const stage = transformerRef.current?.getStage()
      if (!stage) return newBox

      // Limit to stage bounds
      const stageWidth = stage.width()
      const stageHeight = stage.height()
      
      return {
        ...newBox,
        x: Math.max(0, Math.min(stageWidth - newBox.width, newBox.x)),
        y: Math.max(0, Math.min(stageHeight - newBox.height, newBox.y)),
        width: Math.max(20, Math.min(stageWidth - newBox.x, newBox.width)),
        height: Math.max(20, Math.min(stageHeight - newBox.y, newBox.height))
      }
    }

    // Handle keyboard events for deletion
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
          onElementDelete(selectedElement)
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedElement, onElementDelete])

    return (
      <Transformer
        ref={transformerRef}
        onTransformEnd={handleTransformEnd}
        boundBoxFunc={boundBoxFunc}
        // Transformer styling
        borderStroke="#0066cc"
        borderStrokeWidth={2}
        anchorFill="#ffffff"
        anchorStroke="#0066cc"
        anchorStrokeWidth={2}
        anchorSize={8}
        // Enable all transform controls
        enabledAnchors={[
          'top-left', 'top-center', 'top-right',
          'middle-right', 'middle-left',
          'bottom-left', 'bottom-center', 'bottom-right'
        ]}
        rotateAnchorOffset={20}
        rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
        // Minimum size constraints
        keepRatio={false}
        centeredScaling={false}
        flipEnabled={false}
      />
    )
  }
)

KonvaTransformer.displayName = 'KonvaTransformer'

export default KonvaTransformer