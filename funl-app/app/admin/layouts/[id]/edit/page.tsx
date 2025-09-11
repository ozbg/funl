'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createClient } from '@/lib/supabase/client'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack, Grid } from '@/styled-system/jsx'
import SimpleKonvaEditor from '@/components/LayoutEditor/SimpleKonvaEditor'
import EnhancedPropertiesPanel from '@/components/LayoutEditor/EnhancedPropertiesPanel'
import { nanoid } from 'nanoid'

import { EnhancedLayoutElement, EnhancedPrintLayout } from '@/lib/types/layout-enhanced'
import { importFromDatabase, exportToDatabase, validateForExport } from '@/lib/layout-converter'


interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditLayoutPage({ params }: PageProps) {
  const [layoutId, setLayoutId] = useState<string>('')
  const [layout, setLayout] = useState<EnhancedPrintLayout | null>(null)
  const [layoutName, setLayoutName] = useState('')
  const [printType, setPrintType] = useState<'A4_portrait' | 'A5_portrait' | 'A5_landscape'>('A4_portrait')
  const [elements, setElements] = useState<EnhancedLayoutElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const initializePage = async () => {
      const resolvedParams = await params
      setLayoutId(resolvedParams.id)
      await checkAdminAndLoadLayout(resolvedParams.id)
    }
    initializePage()
  }, [params])

  const checkAdminAndLoadLayout = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setIsAdmin(true)

    // Load existing layout
    const { data, error } = await supabase
      .from('print_layouts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Error loading layout:', error)
      router.push('/admin/layouts')
      return
    }

    setLayout(data)
    setLayoutName(data.name)
    setPrintType(data.print_type)
    
    // Convert from database format to enhanced format
    const enhancedElements = importFromDatabase(data.layout_config)
    setElements(enhancedElements)
    setLoading(false)
  }


  const handleElementUpdate = (id: string, updates: Partial<EnhancedLayoutElement>) => {
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

  const handleViewJSON = () => {
    const databaseConfig = exportToDatabase(elements)
    const jsonString = JSON.stringify(databaseConfig, null, 2)
    
    // Create a new window to display the JSON
    const newWindow = window.open('', '_blank', 'width=600,height=800')
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Layout JSON Export</title>
            <style>
              body { font-family: monospace; margin: 20px; }
              pre { background: #f5f5f5; padding: 20px; border-radius: 5px; overflow: auto; }
              button { margin: 10px 0; padding: 8px 16px; }
            </style>
          </head>
          <body>
            <h2>Database JSON Format</h2>
            <button onclick="navigator.clipboard.writeText(document.querySelector('pre').textContent)">Copy to Clipboard</button>
            <pre>${jsonString}</pre>
          </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

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

    // Validate elements for export
    const validation = validateForExport(elements)
    if (!validation.isValid) {
      alert(`Cannot save layout: ${validation.errors.join(', ')}`)
      return
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      const proceed = confirm(
        `The following features will be simplified when saving:\n\n${validation.warnings.join('\n')}\n\nContinue?`
      )
      if (!proceed) return
    }

    setSaving(true)
    
    try {
      // Convert enhanced format back to database format
      const databaseConfig = exportToDatabase(elements)
      
      const { error } = await supabase
        .from('print_layouts')
        .update({
          name: layoutName,
          print_type: printType,
          layout_config: databaseConfig
        })
        .eq('id', layoutId)

      if (error) {
        console.error('Error updating layout:', error)
        alert('Failed to update layout')
        return
      }

      router.push('/admin/layouts')
    } catch (error) {
      console.error('Error updating layout:', error)
      alert('Failed to update layout')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box maxW="6xl" mx="auto" py={8}>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Loading layout...</p>
      </Box>
    )
  }

  if (!isAdmin || !layout) {
    return (
      <Box maxW="6xl" mx="auto" py={8}>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Access denied or layout not found.</p>
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
              Edit Layout: {layout.name}
            </h1>
            <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
              Modify the print layout using the drag-and-drop editor
            </p>
          </Box>
          <Flex gap={3}>
            <button
              onClick={handleViewJSON}
              className={buttonStyles}
            >
              📄 View JSON
            </button>
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
              {saving ? 'Saving...' : 'Save Changes'}
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

        {/* Simple Konva Layout Editor */}
        <Box height="calc(100vh - 200px)" borderWidth="1px" borderColor="border.default">
          <SimpleKonvaEditor
            printType={printType}
            elements={elements}
            onElementsChange={setElements}
            onSelectionChange={(ids) => setSelectedElementId(ids[0] || undefined)}
          />
        </Box>
        
        {/* Properties Panel (if element selected) */}
        {selectedElement && (
          <Box mt={4} bg="bg.default" borderWidth="1px" borderColor="border.default" p={4}>
            <EnhancedPropertiesPanel
              selectedElement={selectedElement}
              onElementUpdate={handleElementUpdate}
              onElementDelete={handleElementDelete}
            />
          </Box>
        )}

        {/* Status Info */}
        {layout.is_default && (
          <Box mt={6} p={4} colorPalette="mint" bg="colorPalette.subtle" borderWidth="1px" borderColor="colorPalette.default">
            <p className={css({ fontSize: 'sm', color: 'colorPalette.text', fontWeight: 'medium' })}>
              ℹ️ This is the default layout for {printType.replace('_', ' ').toLowerCase()} format
            </p>
          </Box>
        )}
      </Box>
    </DndProvider>
  )
}