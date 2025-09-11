'use client'

import { useEffect } from 'react'

interface KeyboardShortcutsProps {
  onUndo: () => void
  onRedo: () => void
  onCopy: () => void
  onDelete: () => void
  onSelectAll: () => void
  onDeselect: () => void
  onGroup: () => void
  onUngroup: () => void
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onCopy,
  onDelete,
  onSelectAll,
  onDeselect,
  onGroup,
  onUngroup
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey

      // Undo/Redo
      if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        onUndo()
        return
      }

      if (isCtrlOrCmd && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        onRedo()
        return
      }

      // Copy/Duplicate
      if (isCtrlOrCmd && e.key === 'd') {
        e.preventDefault()
        onCopy()
        return
      }

      // Select All
      if (isCtrlOrCmd && e.key === 'a') {
        e.preventDefault()
        onSelectAll()
        return
      }

      // Deselect
      if (e.key === 'Escape') {
        e.preventDefault()
        onDeselect()
        return
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        onDelete()
        return
      }

      // Group
      if (isCtrlOrCmd && e.key === 'g' && !e.shiftKey) {
        e.preventDefault()
        onGroup()
        return
      }

      // Ungroup
      if (isCtrlOrCmd && e.key === 'g' && e.shiftKey) {
        e.preventDefault()
        onUngroup()
        return
      }

      // Tool shortcuts
      switch (e.key.toLowerCase()) {
        case 'v':
          // Select tool
          break
        case 't':
          // Text tool
          break
        case 'h':
          // Pan tool
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onUndo, onRedo, onCopy, onDelete, onSelectAll, onDeselect, onGroup, onUngroup])
}