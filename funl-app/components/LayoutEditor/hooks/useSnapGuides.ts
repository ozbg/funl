'use client'

import { useMemo } from 'react'
import { EnhancedLayoutElement } from '@/lib/types/layout-enhanced'

interface SnapLine {
  x?: number
  y?: number
  type: 'center' | 'edge' | 'alignment'
  elementId?: string
}

export function useSnapGuides(elements: EnhancedLayoutElement[], enabled: boolean) {
  const snapLines = useMemo((): SnapLine[] => {
    if (!enabled) return []

    const lines: SnapLine[] = []

    // Add center lines for the canvas
    lines.push(
      { x: 50, type: 'center' }, // Vertical center
      { y: 50, type: 'center' }  // Horizontal center
    )

    // Add lines for each element's edges and centers
    elements.forEach(element => {
      const { position, size } = element
      
      // Vertical lines (x positions)
      lines.push(
        { x: position.x, type: 'edge', elementId: element.id }, // Left edge
        { x: position.x + size.width / 2, type: 'center', elementId: element.id }, // Center
        { x: position.x + size.width, type: 'edge', elementId: element.id } // Right edge
      )
      
      // Horizontal lines (y positions)
      lines.push(
        { y: position.y, type: 'edge', elementId: element.id }, // Top edge
        { y: position.y + size.height / 2, type: 'center', elementId: element.id }, // Center
        { y: position.y + size.height, type: 'edge', elementId: element.id } // Bottom edge
      )
    })

    return lines
  }, [elements, enabled])

  const snapToGuides = (
    position: { x: number; y: number },
    size: { width: number; height: number },
    excludeElementId?: string,
    threshold = 2 // Snap threshold in percentage
  ) => {
    if (!enabled) return position

    let snappedX = position.x
    let snappedY = position.y
    const activeSnapLines: SnapLine[] = []

    // Calculate element edges and center
    const elementLeft = position.x
    const elementRight = position.x + size.width
    const elementCenterX = position.x + size.width / 2
    const elementTop = position.y
    const elementBottom = position.y + size.height
    const elementCenterY = position.y + size.height / 2

    // Check for snapping to vertical lines
    snapLines.forEach(line => {
      if (line.x !== undefined && line.elementId !== excludeElementId) {
        // Snap left edge
        if (Math.abs(elementLeft - line.x) < threshold) {
          snappedX = line.x
          activeSnapLines.push(line)
        }
        // Snap right edge
        else if (Math.abs(elementRight - line.x) < threshold) {
          snappedX = line.x - size.width
          activeSnapLines.push(line)
        }
        // Snap center
        else if (Math.abs(elementCenterX - line.x) < threshold) {
          snappedX = line.x - size.width / 2
          activeSnapLines.push(line)
        }
      }
    })

    // Check for snapping to horizontal lines
    snapLines.forEach(line => {
      if (line.y !== undefined && line.elementId !== excludeElementId) {
        // Snap top edge
        if (Math.abs(elementTop - line.y) < threshold) {
          snappedY = line.y
          activeSnapLines.push(line)
        }
        // Snap bottom edge
        else if (Math.abs(elementBottom - line.y) < threshold) {
          snappedY = line.y - size.height
          activeSnapLines.push(line)
        }
        // Snap center
        else if (Math.abs(elementCenterY - line.y) < threshold) {
          snappedY = line.y - size.height / 2
          activeSnapLines.push(line)
        }
      }
    })

    return {
      position: { x: snappedX, y: snappedY },
      activeSnapLines
    }
  }

  return {
    snapLines,
    snapToGuides
  }
}