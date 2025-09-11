'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Stage, Layer, Line, Rect } from 'react-konva'
import Konva from 'konva'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { EnhancedLayoutElement } from '@/lib/types/layout-enhanced'
import { nanoid } from 'nanoid'

// Import hooks
import { useLayoutEditor } from './hooks/useLayoutEditor'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useSnapGuides } from './hooks/useSnapGuides'

// Placeholder components - these will be implemented later
const FloatingToolbar = ({ ...props }: any) => <div>Toolbar Placeholder</div>
const LayerPanel = ({ ...props }: any) => <div>Layer Panel Placeholder</div>
const CanvasRulers = ({ ...props }: any) => <div>Rulers Placeholder</div>
const SmartGuides = ({ ...props }: any) => null
const ElementCanvas = ({ ...props }: any) => null

interface ProfessionalLayoutEditorProps {
  printType: 'A4_portrait' | 'A5_portrait' | 'A5_landscape'
  elements: EnhancedLayoutElement[]
  onElementsChange: (elements: EnhancedLayoutElement[]) => void
  onSelectionChange: (ids: string[]) => void
}

export default function ProfessionalLayoutEditor({
  printType,
  elements,
  onElementsChange,
  onSelectionChange
}: ProfessionalLayoutEditorProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const [tool, setTool] = useState<'select' | 'text' | 'qr' | 'image' | 'pan' | 'zoom'>('select')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [showRulers, setShowRulers] = useState(true)
  const [showGuides, setShowGuides] = useState(true)

  // Custom hooks for editor functionality
  const {
    selectedIds,
    selectElement,
    selectMultiple,
    clearSelection,
    groupSelection,
    ungroupSelection,
    duplicateSelection,
    deleteSelection,
    moveToFront,
    moveToBack,
    undo,
    redo,
    canUndo,
    canRedo,
    history
  } = useLayoutEditor(elements, onElementsChange, onSelectionChange)

  const { snapLines, snapToGuides } = useSnapGuides(elements, showGuides)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onCopy: duplicateSelection,
    onDelete: deleteSelection,
    onSelectAll: () => selectMultiple(elements.map(el => el.id)),
    onDeselect: clearSelection,
    onGroup: groupSelection,
    onUngroup: ungroupSelection
  })

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
  const baseScale = 2.5 // Higher base scale for better quality
  const canvasWidth = dimensions.width * baseScale * zoom
  const canvasHeight = dimensions.height * baseScale * zoom

  // Handle canvas interaction based on current tool
  const handleCanvasClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === 'select') {
      if (e.target === stageRef.current) {
        clearSelection()
      }
      return
    }

    // Tool-based creation
    const stage = stageRef.current
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    const x = ((pos.x - pan.x) / canvasWidth) * 100
    const y = ((pos.y - pan.y) / canvasHeight) * 100

    let newElement: EnhancedLayoutElement

    switch (tool) {
      case 'text':
        newElement = {
          id: nanoid(),
          type: 'text',
          field: 'custom_message',
          position: { x: Math.max(0, x), y: Math.max(0, y) },
          size: { width: 30, height: 8 },
          fontSize: 14,
          fontWeight: 'normal',
          textAlign: 'left',
          color: '#000000'
        }
        break

      case 'qr':
        newElement = {
          id: nanoid(),
          type: 'qr_code',
          position: { x: Math.max(0, x), y: Math.max(0, y) },
          size: { width: 20, height: 20 },
          borderWidth: 1,
          borderColor: '#000000'
        }
        break

      case 'image':
        newElement = {
          id: nanoid(),
          type: 'image',
          position: { x: Math.max(0, x), y: Math.max(0, y) },
          size: { width: 25, height: 20 },
          borderWidth: 1,
          borderColor: '#cccccc'
        }
        break

      default:
        return
    }

    const updatedElements = [...elements, newElement]
    onElementsChange(updatedElements)
    selectElement(newElement.id)
    setTool('select') // Auto-switch back to select tool
  }, [tool, pan, canvasWidth, canvasHeight, elements, onElementsChange, selectElement, clearSelection])

  // Handle zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const scaleBy = 1.1
    const stage = stageRef.current
    if (!stage) return

    const oldScale = zoom
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    const clampedScale = Math.max(0.1, Math.min(5, newScale))

    setZoom(clampedScale)

    // Adjust pan to zoom towards mouse position
    const mousePointTo = {
      x: (pointer.x - pan.x) / oldScale,
      y: (pointer.y - pan.y) / oldScale
    }

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    }

    setPan(newPos)
  }, [zoom, pan])

  // Grid lines
  const gridLines = []
  if (showGrid) {
    const gridSize = 10 * baseScale * zoom
    const cols = Math.ceil(canvasWidth / gridSize)
    const rows = Math.ceil(canvasHeight / gridSize)

    // Vertical lines
    for (let i = 0; i <= cols; i++) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, canvasHeight]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
          opacity={0.5}
        />
      )
    }

    // Horizontal lines
    for (let i = 0; i <= rows; i++) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, canvasWidth, i * gridSize]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
          opacity={0.5}
        />
      )
    }
  }

  return (
    <Box className={css({ height: '100vh', display: 'flex', flexDirection: 'column' })}>
      {/* Top Toolbar */}
      <FloatingToolbar
        tool={tool}
        onToolChange={setTool}
        zoom={zoom}
        onZoomChange={setZoom}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        showRulers={showRulers}
        onToggleRulers={() => setShowRulers(!showRulers)}
        showGuides={showGuides}
        onToggleGuides={() => setShowGuides(!showGuides)}
        selectedCount={selectedIds.length}
        onGroup={groupSelection}
        onUngroup={ungroupSelection}
        onDuplicate={duplicateSelection}
        onDelete={deleteSelection}
        onMoveToFront={moveToFront}
        onMoveToBack={moveToBack}
      />

      <Flex flex={1} overflow="hidden">
        {/* Left Sidebar - Layers Panel */}
        <LayerPanel
          elements={elements}
          selectedIds={selectedIds}
          onElementsChange={onElementsChange}
          onSelectionChange={selectMultiple}
        />

        {/* Main Canvas Area */}
        <Box flex={1} position="relative" overflow="hidden" bg="#f5f5f5">
          {/* Rulers */}
          {showRulers && (
            <CanvasRulers
              width={canvasWidth}
              height={canvasHeight}
              zoom={zoom}
              pan={pan}
              baseScale={baseScale}
            />
          )}

          {/* Canvas */}
          <Box
            position="absolute"
            top={showRulers ? "20px" : "0"}
            left={showRulers ? "20px" : "0"}
            right="0"
            bottom="0"
            overflow="auto"
          >
            <Stage
              ref={stageRef}
              width={canvasWidth}
              height={canvasHeight}
              x={pan.x}
              y={pan.y}
              scaleX={zoom}
              scaleY={zoom}
              onClick={handleCanvasClick}
              onTap={handleCanvasClick}
              onWheel={handleWheel}
              draggable={tool === 'pan'}
              onDragEnd={(e) => {
                setPan({ x: e.target.x(), y: e.target.y() })
              }}
            >
              <Layer>
                {/* Paper Background */}
                <Rect
                  width={canvasWidth / zoom}
                  height={canvasHeight / zoom}
                  fill="#ffffff"
                  stroke="#cccccc"
                  strokeWidth={1 / zoom}
                  shadowColor="#000000"
                  shadowBlur={10 / zoom}
                  shadowOffset={{ x: 2 / zoom, y: 2 / zoom }}
                  shadowOpacity={0.1}
                />

                {/* Grid */}
                {gridLines}

                {/* Smart Guides */}
                <SmartGuides
                  snapLines={snapLines}
                  zoom={zoom}
                  visible={showGuides}
                />

                {/* Elements */}
                <ElementCanvas
                  elements={elements}
                  selectedIds={selectedIds}
                  canvasWidth={canvasWidth / zoom}
                  canvasHeight={canvasHeight / zoom}
                  onElementsChange={onElementsChange}
                  onSelectionChange={selectMultiple}
                  onElementClick={selectElement}
                  snapToGuides={snapToGuides}
                  zoom={zoom}
                />
              </Layer>
            </Stage>
          </Box>
        </Box>

        {/* Right Sidebar - Properties will be handled by parent */}
      </Flex>

      {/* Status Bar */}
      <Box
        px={4}
        py={2}
        bg="bg.muted"
        borderTopWidth="1px"
        borderColor="border.default"
        fontSize="xs"
        color="fg.muted"
      >
        <Flex justify="space-between" align="center">
          <span>
            {dimensions.width} × {dimensions.height}mm • {Math.round(zoom * 100)}% • {elements.length} elements
          </span>
          <span>
            {selectedIds.length > 0 && `${selectedIds.length} selected`}
          </span>
        </Flex>
      </Box>
    </Box>
  )
}