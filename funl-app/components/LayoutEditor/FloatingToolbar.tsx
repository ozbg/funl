'use client'

import React from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface FloatingToolbarProps {
  tool: 'select' | 'text' | 'qr' | 'image' | 'pan' | 'zoom'
  onToolChange: (tool: 'select' | 'text' | 'qr' | 'image' | 'pan' | 'zoom') => void
  zoom: number
  onZoomChange: (zoom: number) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  showGrid: boolean
  onToggleGrid: () => void
  showRulers: boolean
  onToggleRulers: () => void
  showGuides: boolean
  onToggleGuides: () => void
  selectedCount: number
  onGroup: () => void
  onUngroup: () => void
  onDuplicate: () => void
  onDelete: () => void
  onMoveToFront: () => void
  onMoveToBack: () => void
}

export default function FloatingToolbar({
  tool,
  onToolChange,
  zoom,
  onZoomChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showGrid,
  onToggleGrid,
  showRulers,
  onToggleRulers,
  showGuides,
  onToggleGuides,
  selectedCount,
  onGroup,
  onUngroup,
  onDuplicate,
  onDelete,
  onMoveToFront,
  onMoveToBack
}: FloatingToolbarProps) {
  const toolButtonStyles = (isActive: boolean) => css({
    px: 3,
    py: 2,
    bg: isActive ? 'mint.default' : 'bg.default',
    color: isActive ? 'mint.fg' : 'fg.default',
    borderWidth: '1px',
    borderColor: isActive ? 'mint.default' : 'border.default',
    borderRadius: 'md',
    cursor: 'pointer',
    fontSize: 'sm',
    fontWeight: 'medium',
    _hover: {
      bg: isActive ? 'mint.emphasized' : 'bg.muted'
    },
    _active: {
      transform: 'scale(0.98)'
    }
  })

  const iconButtonStyles = css({
    w: 8,
    h: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bg: 'bg.default',
    borderWidth: '1px',
    borderColor: 'border.default',
    borderRadius: 'md',
    cursor: 'pointer',
    _hover: {
      bg: 'bg.muted'
    },
    _disabled: {
      opacity: 'disabled',
      cursor: 'not-allowed'
    }
  })

  const separatorStyles = css({
    w: '1px',
    h: 6,
    bg: 'border.default',
    mx: 2
  })

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={1000}
      bg="bg.default"
      borderBottomWidth="1px"
      borderColor="border.default"
      px={4}
      py={3}
      boxShadow="sm"
    >
      <Flex align="center" gap={2} flexWrap="wrap">
        {/* Main Tools */}
        <Flex gap={1}>
          <button
            onClick={() => onToolChange('select')}
            className={toolButtonStyles(tool === 'select')}
            title="Select (V)"
          >
            ↖️ Select
          </button>
          <button
            onClick={() => onToolChange('text')}
            className={toolButtonStyles(tool === 'text')}
            title="Text Tool (T)"
          >
            📝 Text
          </button>
          <button
            onClick={() => onToolChange('qr')}
            className={toolButtonStyles(tool === 'qr')}
            title="QR Code"
          >
            📱 QR
          </button>
          <button
            onClick={() => onToolChange('image')}
            className={toolButtonStyles(tool === 'image')}
            title="Image"
          >
            🖼️ Image
          </button>
          <button
            onClick={() => onToolChange('pan')}
            className={toolButtonStyles(tool === 'pan')}
            title="Pan Tool (H)"
          >
            ✋ Pan
          </button>
        </Flex>

        <div className={separatorStyles} />

        {/* History */}
        <Flex gap={1}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={iconButtonStyles}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={iconButtonStyles}
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>
        </Flex>

        <div className={separatorStyles} />

        {/* Zoom Controls */}
        <Flex align="center" gap={2}>
          <button
            onClick={() => onZoomChange(Math.max(0.1, zoom / 1.25))}
            className={iconButtonStyles}
            title="Zoom Out"
          >
            −
          </button>
          <Box
            minW="60px"
            textAlign="center"
            fontSize="sm"
            fontWeight="medium"
          >
            {Math.round(zoom * 100)}%
          </Box>
          <button
            onClick={() => onZoomChange(Math.min(5, zoom * 1.25))}
            className={iconButtonStyles}
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => onZoomChange(1)}
            className={css({
              px: 2,
              py: 1,
              fontSize: 'xs',
              bg: 'bg.default',
              borderWidth: '1px',
              borderColor: 'border.default',
              borderRadius: 'sm',
              cursor: 'pointer'
            })}
            title="Reset Zoom"
          >
            100%
          </button>
        </Flex>

        <div className={separatorStyles} />

        {/* View Options */}
        <Flex gap={1}>
          <button
            onClick={onToggleGrid}
            className={css({
              px: 2,
              py: 1,
              fontSize: 'xs',
              bg: showGrid ? 'mint.subtle' : 'bg.default',
              color: showGrid ? 'mint.text' : 'fg.default',
              borderWidth: '1px',
              borderColor: showGrid ? 'mint.default' : 'border.default',
              borderRadius: 'sm',
              cursor: 'pointer'
            })}
            title="Toggle Grid"
          >
            Grid
          </button>
          <button
            onClick={onToggleRulers}
            className={css({
              px: 2,
              py: 1,
              fontSize: 'xs',
              bg: showRulers ? 'mint.subtle' : 'bg.default',
              color: showRulers ? 'mint.text' : 'fg.default',
              borderWidth: '1px',
              borderColor: showRulers ? 'mint.default' : 'border.default',
              borderRadius: 'sm',
              cursor: 'pointer'
            })}
            title="Toggle Rulers"
          >
            Rulers
          </button>
          <button
            onClick={onToggleGuides}
            className={css({
              px: 2,
              py: 1,
              fontSize: 'xs',
              bg: showGuides ? 'mint.subtle' : 'bg.default',
              color: showGuides ? 'mint.text' : 'fg.default',
              borderWidth: '1px',
              borderColor: showGuides ? 'mint.default' : 'border.default',
              borderRadius: 'sm',
              cursor: 'pointer'
            })}
            title="Toggle Smart Guides"
          >
            Guides
          </button>
        </Flex>

        {/* Selection-based tools */}
        {selectedCount > 0 && (
          <>
            <div className={separatorStyles} />
            <Flex gap={1}>
              {selectedCount > 1 && (
                <button
                  onClick={onGroup}
                  className={iconButtonStyles}
                  title="Group Selection (Ctrl+G)"
                >
                  📦
                </button>
              )}
              <button
                onClick={onUngroup}
                className={iconButtonStyles}
                title="Ungroup Selection (Ctrl+Shift+G)"
              >
                📤
              </button>
              <button
                onClick={onDuplicate}
                className={iconButtonStyles}
                title="Duplicate (Ctrl+D)"
              >
                📋
              </button>
              <button
                onClick={onMoveToFront}
                className={iconButtonStyles}
                title="Bring to Front"
              >
                🔼
              </button>
              <button
                onClick={onMoveToBack}
                className={iconButtonStyles}
                title="Send to Back"
              >
                🔽
              </button>
              <button
                onClick={onDelete}
                className={css({
                  ...iconButtonStyles,
                  colorPalette: 'red',
                  borderColor: 'red.default',
                  color: 'red.default',
                  _hover: {
                    bg: 'red.subtle'
                  }
                })}
                title="Delete (Del)"
              >
                🗑️
              </button>
            </Flex>
          </>
        )}

        {/* Right side info */}
        <Box ml="auto" fontSize="xs" color="fg.muted">
          {selectedCount > 0 && `${selectedCount} selected`}
        </Box>
      </Flex>
    </Box>
  )
}