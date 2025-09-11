'use client'

import React from 'react'
import { Line } from 'react-konva'

interface SnapLine {
  x?: number
  y?: number
  type: 'center' | 'edge' | 'alignment'
  elementId?: string
}

interface SmartGuidesProps {
  snapLines: SnapLine[]
  zoom: number
  visible: boolean
  activeSnapLines?: SnapLine[]
}

export default function SmartGuides({ 
  snapLines, 
  zoom, 
  visible, 
  activeSnapLines = [] 
}: SmartGuidesProps) {
  if (!visible) return null

  return (
    <>
      {snapLines.map((line, index) => {
        const isActive = activeSnapLines.some(activeLine => 
          activeLine.x === line.x && activeLine.y === line.y
        )
        
        const strokeColor = isActive ? '#ff4444' : 
                           line.type === 'center' ? '#0066cc' : '#999999'
        const strokeWidth = (isActive ? 2 : 1) / zoom
        const opacity = isActive ? 1 : line.type === 'center' ? 0.6 : 0.3
        const dash = line.type === 'center' ? [5 / zoom, 5 / zoom] : undefined

        if (line.x !== undefined) {
          // Vertical line
          const x = (line.x / 100) * (window.innerWidth / zoom) // Convert percentage to pixels
          return (
            <Line
              key={`v-${index}`}
              points={[x, 0, x, window.innerHeight / zoom]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity={opacity}
              dash={dash}
              listening={false}
            />
          )
        }

        if (line.y !== undefined) {
          // Horizontal line
          const y = (line.y / 100) * (window.innerHeight / zoom) // Convert percentage to pixels
          return (
            <Line
              key={`h-${index}`}
              points={[0, y, window.innerWidth / zoom, y]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity={opacity}
              dash={dash}
              listening={false}
            />
          )
        }

        return null
      })}
    </>
  )
}