'use client'

import { useState, useCallback, useMemo } from 'react'
import { EnhancedLayoutElement } from '@/lib/types/layout-enhanced'
import { nanoid } from 'nanoid'

// Command pattern for undo/redo
interface Command {
  id: string
  type: 'add' | 'delete' | 'modify' | 'group' | 'ungroup' | 'reorder'
  timestamp: number
  elementIds: string[]
  beforeState?: EnhancedLayoutElement[]
  afterState?: EnhancedLayoutElement[]
  description: string
}

export function useLayoutEditor(
  elements: EnhancedLayoutElement[],
  onElementsChange: (elements: EnhancedLayoutElement[]) => void,
  onSelectionChange: (ids: string[]) => void
) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [history, setHistory] = useState<Command[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Execute command and add to history
  const executeCommand = useCallback((command: Command) => {
    if (command.afterState) {
      onElementsChange(command.afterState)
    }
    
    // Add to history (remove any future history if we're not at the end)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(command)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex, onElementsChange])

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      const command = history[historyIndex]
      if (command.beforeState) {
        onElementsChange(command.beforeState)
      }
      setHistoryIndex(historyIndex - 1)
    }
  }, [history, historyIndex, onElementsChange])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const command = history[historyIndex + 1]
      if (command.afterState) {
        onElementsChange(command.afterState)
      }
      setHistoryIndex(historyIndex + 1)
    }
  }, [history, historyIndex, onElementsChange])

  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < history.length - 1

  // Selection management
  const selectElement = useCallback((id: string, addToSelection = false) => {
    if (addToSelection) {
      setSelectedIds(prev => 
        prev.includes(id) 
          ? prev.filter(selectedId => selectedId !== id)
          : [...prev, id]
      )
    } else {
      setSelectedIds([id])
    }
  }, [])

  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(ids)
    onSelectionChange(ids)
  }, [onSelectionChange])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
    onSelectionChange([])
  }, [onSelectionChange])

  // Element operations
  const duplicateSelection = useCallback(() => {
    if (selectedIds.length === 0) return

    const selectedElements = elements.filter(el => selectedIds.includes(el.id))
    const duplicatedElements = selectedElements.map(el => ({
      ...el,
      id: nanoid(),
      position: {
        x: Math.min(95, el.position.x + 5),
        y: Math.min(95, el.position.y + 5)
      }
    }))

    const newElements = [...elements, ...duplicatedElements]
    const newIds = duplicatedElements.map(el => el.id)

    executeCommand({
      id: nanoid(),
      type: 'add',
      timestamp: Date.now(),
      elementIds: newIds,
      beforeState: elements,
      afterState: newElements,
      description: `Duplicate ${selectedIds.length} element(s)`
    })

    setSelectedIds(newIds)
    onSelectionChange(newIds)
  }, [selectedIds, elements, executeCommand, onSelectionChange])

  const deleteSelection = useCallback(() => {
    if (selectedIds.length === 0) return

    const newElements = elements.filter(el => !selectedIds.includes(el.id))

    executeCommand({
      id: nanoid(),
      type: 'delete',
      timestamp: Date.now(),
      elementIds: selectedIds,
      beforeState: elements,
      afterState: newElements,
      description: `Delete ${selectedIds.length} element(s)`
    })

    clearSelection()
  }, [selectedIds, elements, executeCommand, clearSelection])

  const updateElement = useCallback((id: string, updates: Partial<EnhancedLayoutElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )

    executeCommand({
      id: nanoid(),
      type: 'modify',
      timestamp: Date.now(),
      elementIds: [id],
      beforeState: elements,
      afterState: newElements,
      description: `Update element`
    })
  }, [elements, executeCommand])

  const groupSelection = useCallback(() => {
    if (selectedIds.length < 2) return

    // Create a group element that contains the selected elements
    const selectedElements = elements.filter(el => selectedIds.includes(el.id))
    const bounds = getSelectionBounds(selectedElements)
    
    const groupElement: EnhancedLayoutElement = {
      id: nanoid(),
      type: 'text' as const, // Groups are internally text elements with special handling
      position: bounds.topLeft,
      size: bounds.size,
      groupedElements: selectedElements.map(el => ({ ...el, position: {
        x: el.position.x - bounds.topLeft.x,
        y: el.position.y - bounds.topLeft.y
      }})),
      isGroup: true
    }

    const newElements = [
      ...elements.filter(el => !selectedIds.includes(el.id)),
      groupElement
    ]

    executeCommand({
      id: nanoid(),
      type: 'group',
      timestamp: Date.now(),
      elementIds: selectedIds,
      beforeState: elements,
      afterState: newElements,
      description: `Group ${selectedIds.length} elements`
    })

    setSelectedIds([groupElement.id])
    onSelectionChange([groupElement.id])
  }, [selectedIds, elements, executeCommand, onSelectionChange])

  const ungroupSelection = useCallback(() => {
    const selectedElement = elements.find(el => el.id === selectedIds[0])
    if (!selectedElement?.isGroup || !selectedElement.groupedElements) return

    const ungroupedElements = selectedElement.groupedElements.map(el => ({
      ...el,
      position: {
        x: el.position.x + selectedElement.position.x,
        y: el.position.y + selectedElement.position.y
      }
    }))

    const newElements = [
      ...elements.filter(el => el.id !== selectedIds[0]),
      ...ungroupedElements
    ]

    executeCommand({
      id: nanoid(),
      type: 'ungroup',
      timestamp: Date.now(),
      elementIds: [selectedIds[0]],
      beforeState: elements,
      afterState: newElements,
      description: 'Ungroup elements'
    })

    setSelectedIds(ungroupedElements.map(el => el.id))
    onSelectionChange(ungroupedElements.map(el => el.id))
  }, [selectedIds, elements, executeCommand, onSelectionChange])

  const moveToFront = useCallback(() => {
    if (selectedIds.length === 0) return

    const selectedElements = elements.filter(el => selectedIds.includes(el.id))
    const otherElements = elements.filter(el => !selectedIds.includes(el.id))
    const newElements = [...otherElements, ...selectedElements]

    executeCommand({
      id: nanoid(),
      type: 'reorder',
      timestamp: Date.now(),
      elementIds: selectedIds,
      beforeState: elements,
      afterState: newElements,
      description: 'Bring to front'
    })
  }, [selectedIds, elements, executeCommand])

  const moveToBack = useCallback(() => {
    if (selectedIds.length === 0) return

    const selectedElements = elements.filter(el => selectedIds.includes(el.id))
    const otherElements = elements.filter(el => !selectedIds.includes(el.id))
    const newElements = [...selectedElements, ...otherElements]

    executeCommand({
      id: nanoid(),
      type: 'reorder',
      timestamp: Date.now(),
      elementIds: selectedIds,
      beforeState: elements,
      afterState: newElements,
      description: 'Send to back'
    })
  }, [selectedIds, elements, executeCommand])

  return {
    selectedIds,
    selectElement,
    selectMultiple,
    clearSelection,
    updateElement,
    duplicateSelection,
    deleteSelection,
    groupSelection,
    ungroupSelection,
    moveToFront,
    moveToBack,
    undo,
    redo,
    canUndo,
    canRedo,
    history
  }
}

// Helper function to calculate selection bounds
function getSelectionBounds(elements: EnhancedLayoutElement[]) {
  if (elements.length === 0) {
    return { topLeft: { x: 0, y: 0 }, size: { width: 0, height: 0 } }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  elements.forEach(el => {
    minX = Math.min(minX, el.position.x)
    minY = Math.min(minY, el.position.y)
    maxX = Math.max(maxX, el.position.x + el.size.width)
    maxY = Math.max(maxY, el.position.y + el.size.height)
  })

  return {
    topLeft: { x: minX, y: minY },
    size: { width: maxX - minX, height: maxY - minY }
  }
}