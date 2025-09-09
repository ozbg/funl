'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createClient } from '@/lib/supabase/client'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack, Grid } from '@/styled-system/jsx'
import Canvas from '@/components/LayoutEditor/Canvas'
import ElementPalette from '@/components/LayoutEditor/ElementPalette'
import PropertiesPanel from '@/components/LayoutEditor/PropertiesPanel'
import { nanoid } from 'nanoid'

interface LayoutElement {
  id: string
  type: 'qr_code' | 'text' | 'image'
  field?: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  alignment?: 'left' | 'center' | 'right'
  fontSize?: number
  fontWeight?: string
}

export default function NewLayoutPage() {
  const [layoutName, setLayoutName] = useState('')
  const [printType, setPrintType] = useState<'A4_portrait' | 'A5_portrait' | 'A5_landscape'>('A4_portrait')
  const [elements, setElements] = useState<LayoutElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    // For now, assume logged in users are admins
    setIsAdmin(true)
  }

  const handleElementAdd = (elementData: Omit<LayoutElement, 'id'>) => {
    const newElement: LayoutElement = {
      ...elementData,
      id: nanoid()
    }
    setElements(prev => [...prev, newElement])
    setSelectedElementId(newElement.id)
  }

  const handleElementMove = (id: string, position: { x: number; y: number }) => {
    setElements(prev => 
      prev.map(el => 
        el.id === id ? { ...el, position } : el
      )
    )
  }

  const handleElementUpdate = (id: string, updates: Partial<LayoutElement>) => {
    setElements(prev => 
      prev.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    )
  }

  const handleElementDelete = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id))
    if (selectedElementId === id) {
      setSelectedElementId(undefined)
    }
  }

  const selectedElement = elements.find(el => el.id === selectedElementId)

  const handleSave = async () => {
    if (!layoutName.trim()) {
      alert('Please enter a layout name')
      return
    }

    // Validate that there's at least one QR code
    const hasQR = elements.some(el => el.type === 'qr_code')
    if (!hasQR) {
      alert('Layout must contain at least one QR code')
      return
    }

    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('print_layouts')
        .insert({
          name: layoutName,
          print_type: printType,
          is_active: true,
          is_default: false,
          layout_config: { elements }
        })

      if (error) {
        console.error('Error saving layout:', error)
        alert('Failed to save layout')
        return
      }

      router.push('/admin/layouts')
    } catch (error) {
      console.error('Error saving layout:', error)
      alert('Failed to save layout')
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <Box maxW="6xl" mx="auto" py={8}>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Access denied. Admin only.</p>
      </Box>
    )
  }

  const inputStyles = css({
    w: 'full',
    px: 3,
    py: 2,
    borderWidth: '1px',
    borderColor: 'border.default',
    bg: 'bg.default',
    color: 'fg.default',
    _focus: {
      outline: 'none',
      ringWidth: '2',
      ringColor: 'mint.default',
      borderColor: 'mint.default',
    },
  })

  const buttonStyles = css({
    px: 4,
    py: 2,
    fontSize: 'sm',
    fontWeight: 'medium',
    borderWidth: '1px',
    borderColor: 'border.default',
    bg: 'bg.default',
    cursor: 'pointer',
    _hover: {
      bg: 'bg.muted',
    },
  })

  const primaryButtonStyles = css({
    colorPalette: 'mint',
    px: 4,
    py: 2,
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'colorPalette.fg',
    bg: 'colorPalette.default',
    cursor: 'pointer',
    _hover: {
      bg: 'colorPalette.emphasized',
    },
    _disabled: {
      opacity: 'disabled',
      cursor: 'not-allowed',
    },
  })

  return (
    <DndProvider backend={HTML5Backend}>
      <Box maxW="7xl" mx="auto" py={8}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
              Create New Layout
            </h1>
            <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
              Design a new print layout using the drag-and-drop editor
            </p>
          </Box>
          <Flex gap={3}>
            <button
              onClick={() => router.back()}
              className={buttonStyles}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={primaryButtonStyles}
            >
              {saving ? 'Saving...' : 'Save Layout'}
            </button>
          </Flex>
        </Flex>

        {/* Layout Settings */}
        <Box bg="bg.default" borderWidth="1px" borderColor="border.default" p={4} mb={6}>
          <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 4 })}>
            Layout Settings
          </h2>
          <Grid columns={{ base: 1, md: 2 }} gap={4}>
            <Box>
              <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1, display: 'block' })}>
                Layout Name
              </label>
              <input
                type="text"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder="e.g., A4 Modern Layout"
                className={inputStyles}
              />
            </Box>
            <Box>
              <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1, display: 'block' })}>
                Print Type
              </label>
              <select
                value={printType}
                onChange={(e) => setPrintType(e.target.value as any)}
                className={inputStyles}
              >
                <option value="A4_portrait">A4 Portrait</option>
                <option value="A5_portrait">A5 Portrait</option>
                <option value="A5_landscape">A5 Landscape</option>
              </select>
            </Box>
          </Grid>
        </Box>

        {/* Editor Interface */}
        <Grid columns={{ base: 1, lg: '300px 1fr 280px' }} gap={6}>
          {/* Element Palette */}
          <Box bg="bg.default" borderWidth="1px" borderColor="border.default" p={4} h="fit">
            <ElementPalette />
          </Box>

          {/* Canvas */}
          <Box bg="bg.default" borderWidth="1px" borderColor="border.default" p={6}>
            <Canvas
              printType={printType}
              elements={elements}
              selectedElement={selectedElementId}
              onElementAdd={handleElementAdd}
              onElementMove={handleElementMove}
              onElementSelect={setSelectedElementId}
              scale={0.5}
            />
          </Box>

          {/* Properties Panel */}
          <Box bg="bg.default" borderWidth="1px" borderColor="border.default" p={4} h="fit">
            <PropertiesPanel
              selectedElement={selectedElement || null}
              onElementUpdate={handleElementUpdate}
              onElementDelete={handleElementDelete}
            />
          </Box>
        </Grid>

        {/* Help Text */}
        <Box mt={6} p={4} bg="bg.subtle" borderWidth="1px" borderColor="border.default">
          <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
            Layout Editor Help
          </h3>
          <Stack gap={1}>
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              • Drag elements from the left palette onto the canvas
            </p>
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              • Click elements on the canvas to select and edit their properties
            </p>
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              • Use the properties panel on the right to fine-tune positioning and styling
            </p>
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              • Every layout must include at least one QR code element
            </p>
          </Stack>
        </Box>
      </Box>
    </DndProvider>
  )
}