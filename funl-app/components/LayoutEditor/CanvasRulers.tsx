'use client'

import React from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'

interface CanvasRulersProps {
  width: number
  height: number
  zoom: number
  pan: { x: number; y: number }
  baseScale: number
}

export default function CanvasRulers({
  width,
  height,
  zoom,
  pan,
  baseScale
}: CanvasRulersProps) {
  const rulerSize = 20
  const mmPerPixel = 1 / baseScale / zoom
  
  // Generate ruler marks
  const generateMarks = (dimension: number, isVertical = false) => {
    const marks = []
    const step = Math.ceil(10 * mmPerPixel) // Step size in mm
    const pixelStep = step / mmPerPixel
    
    const start = Math.floor((isVertical ? -pan.y : -pan.x) / pixelStep) * pixelStep
    const end = dimension + Math.abs(isVertical ? pan.y : pan.x)
    
    for (let pos = start; pos <= end; pos += pixelStep) {
      const mmValue = pos * mmPerPixel
      const displayPos = pos + (isVertical ? pan.y : pan.x)
      
      if (displayPos >= 0 && displayPos <= dimension) {
        marks.push({
          position: displayPos,
          value: Math.round(mmValue),
          isMajor: mmValue % (step * 5) === 0
        })
      }
    }
    
    return marks
  }

  const horizontalMarks = generateMarks(width, false)
  const verticalMarks = generateMarks(height, true)

  return (
    <>
      {/* Horizontal Ruler */}
      <Box
        position="absolute"
        top="0"
        left={`${rulerSize}px`}
        width={`${width}px`}
        height={`${rulerSize}px`}
        bg="bg.muted"
        borderBottomWidth="1px"
        borderColor="border.default"
        fontSize="xs"
        overflow="hidden"
        zIndex={10}
      >
        <svg width={width} height={rulerSize}>
          {horizontalMarks.map((mark, index) => (
            <g key={index}>
              {/* Tick mark */}
              <line
                x1={mark.position}
                y1={mark.isMajor ? 0 : rulerSize / 2}
                x2={mark.position}
                y2={rulerSize}
                stroke="#666"
                strokeWidth={mark.isMajor ? 1 : 0.5}
              />
              {/* Label for major marks */}
              {mark.isMajor && (
                <text
                  x={mark.position + 2}
                  y={rulerSize - 4}
                  fontSize="10"
                  fill="#666"
                >
                  {mark.value}
                </text>
              )}
            </g>
          ))}
        </svg>
      </Box>

      {/* Vertical Ruler */}
      <Box
        position="absolute"
        top={`${rulerSize}px`}
        left="0"
        width={`${rulerSize}px`}
        height={`${height}px`}
        bg="bg.muted"
        borderRightWidth="1px"
        borderColor="border.default"
        fontSize="xs"
        overflow="hidden"
        zIndex={10}
      >
        <svg width={rulerSize} height={height}>
          {verticalMarks.map((mark, index) => (
            <g key={index}>
              {/* Tick mark */}
              <line
                x1={mark.isMajor ? 0 : rulerSize / 2}
                y1={mark.position}
                x2={rulerSize}
                y2={mark.position}
                stroke="#666"
                strokeWidth={mark.isMajor ? 1 : 0.5}
              />
              {/* Label for major marks */}
              {mark.isMajor && (
                <text
                  x={2}
                  y={mark.position - 2}
                  fontSize="10"
                  fill="#666"
                  transform={`rotate(-90, 2, ${mark.position - 2})`}
                >
                  {mark.value}
                </text>
              )}
            </g>
          ))}
        </svg>
      </Box>

      {/* Corner */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width={`${rulerSize}px`}
        height={`${rulerSize}px`}
        bg="bg.muted"
        borderRightWidth="1px"
        borderBottomWidth="1px"
        borderColor="border.default"
        zIndex={10}
      />
    </>
  )
}