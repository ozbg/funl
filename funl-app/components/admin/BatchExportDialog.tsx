'use client'

import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { QRPreview } from '@/components/QRPreview'
import { loadQRPresetsForBusiness, type QRPreset } from '@/lib/qr-generation'
import { createClient } from '@/lib/supabase/client'
import type { QRCodeBatch, PDFExportRequest } from '@/lib/types/qr-reservation'

interface BatchExportDialogProps {
  batch: QRCodeBatch
  isOpen: boolean
  onClose: () => void
}

const SIZE_OPTIONS = [
  { value: '25mm', label: '25mm × 25mm (Small stickers)' },
  { value: '50mm', label: '50mm × 50mm (Medium stickers)' },
  { value: '75mm', label: '75mm × 75mm (Large stickers)' },
  { value: '100mm', label: '100mm × 100mm (XL stickers)' },
  { value: '150mm', label: '150mm × 150mm (Poster size)' },
  { value: '200mm', label: '200mm × 200mm (Large poster)' }
] as const

const TEXT_SIZE_OPTIONS = [
  { value: 'tiny', label: 'Tiny (2mm)', description: 'Very small, minimal text' },
  { value: 'small', label: 'Small (3mm)', description: 'Standard size, good readability' },
  { value: 'medium', label: 'Medium (4mm)', description: 'Larger text, easy to read' }
] as const

export function BatchExportDialog({ batch, isOpen, onClose }: BatchExportDialogProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [qrPreset, setQrPreset] = useState<QRPreset | null>(null)
  const [allQrPresets, setAllQrPresets] = useState<QRPreset[]>([])

  const [exportSettings, setExportSettings] = useState<{
    size: '25mm' | '50mm' | '75mm' | '100mm' | '150mm' | '200mm'
    textSize: 'tiny' | 'small' | 'medium'
    includeIdText: boolean
    customWidth?: number
    customHeight?: number
    customTextSize?: number
    overrideStylePresetId?: string
  }>({
    size: '50mm',
    textSize: 'small',
    includeIdText: true,
    customWidth: undefined,
    customHeight: undefined,
    customTextSize: undefined,
    overrideStylePresetId: undefined
  })

  // Load QR presets for preview and style selection
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const presets = await loadQRPresetsForBusiness(supabase)
        setAllQrPresets(presets)

        // Set the current batch preset as default
        const currentPreset = presets.find(p => p.id === batch.style_preset_id)
        setQrPreset(currentPreset || presets[0] || null)
      } catch (error) {
        console.error('Error loading QR presets:', error)
      }
    }

    if (isOpen) {
      loadPresets()
    }
  }, [batch.style_preset_id, supabase, isOpen])

  // Update preview when style override changes
  useEffect(() => {
    if (exportSettings.overrideStylePresetId && allQrPresets.length > 0) {
      const overridePreset = allQrPresets.find(p => p.id === exportSettings.overrideStylePresetId)
      setQrPreset(overridePreset || null)
    } else if (!exportSettings.overrideStylePresetId && allQrPresets.length > 0) {
      const currentPreset = allQrPresets.find(p => p.id === batch.style_preset_id)
      setQrPreset(currentPreset || allQrPresets[0] || null)
    }
  }, [exportSettings.overrideStylePresetId, allQrPresets, batch.style_preset_id])

  const handleExport = async () => {
    setLoading(true)

    try {
      const exportRequest: Omit<PDFExportRequest, 'batchId'> = {
        size: exportSettings.size,
        customWidth: exportSettings.customWidth,
        customHeight: exportSettings.customHeight,
        textSize: exportSettings.textSize,
        customTextSize: exportSettings.customTextSize,
        includeIdText: exportSettings.includeIdText,
        overrideStylePresetId: exportSettings.overrideStylePresetId
      }

      const response = await fetch(`/api/admin/qr-codes/batches/${batch.id}/export-pdfs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportRequest)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export batch')
      }

      const result = await response.json()

      // Trigger download
      window.open(result.zipUrl, '_blank')

      // Close dialog
      onClose()

      alert(`Successfully exported ${result.totalCodes} QR codes!`)
    } catch (error) {
      console.error('Error exporting batch:', error)
      alert('Failed to export batch. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={css({
      position: 'fixed',
      inset: 0,
      bg: 'black/50',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    })}>
      <Box
        bg="bg.default"
        rounded="lg"
        p={6}
        maxW="4xl"
        w="90vw"
        maxH="90vh"
        overflow="auto"
        boxShadow="lg"
        borderWidth="1px"
        borderColor="border.default"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <h2 className={css({ fontSize: 'xl', fontWeight: 'bold' })}>
            Export QR Code Batch
          </h2>
          <button
            onClick={onClose}
            className={css({
              p: 1,
              rounded: 'md',
              _hover: { bg: 'bg.muted' }
            })}
          >
            ✕
          </button>
        </Flex>

        <Flex gap={6}>
          {/* Export Settings */}
          <Box flex="2">
            <div className={css({ mb: 4 })}>
              <h3 className={css({ fontSize: 'lg', fontWeight: 'medium', mb: 2 })}>
                Batch: {batch.name}
              </h3>
              <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                {batch.quantity} QR codes • {batch.batch_number}
              </p>
            </div>

            <div className={css({ spaceY: '4' })}>
              {/* Physical Size Selection */}
              <div>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                  Physical Size
                </label>
                <select
                  value={exportSettings.size}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    size: e.target.value as typeof exportSettings.size
                  }))}
                  className={css({
                    w: 'full',
                    px: 3,
                    py: 2,
                    border: '1px solid',
                    borderColor: 'border.default',
                    rounded: 'md',
                    fontSize: 'sm'
                  })}
                >
                  {SIZE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* QR Style Override */}
              <div>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                  QR Code Style (optional override)
                </label>
                <select
                  value={exportSettings.overrideStylePresetId || ''}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    overrideStylePresetId: e.target.value || undefined
                  }))}
                  className={css({
                    w: 'full',
                    px: 3,
                    py: 2,
                    border: '1px solid',
                    borderColor: 'border.default',
                    rounded: 'md',
                    fontSize: 'sm'
                  })}
                >
                  <option value="">Use batch default ({allQrPresets.find(p => p.id === batch.style_preset_id)?.name || 'Unknown'})</option>
                  {allQrPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                  Override the QR code style for this export only
                </p>
              </div>

              {/* ID Text Settings */}
              <div>
                <label className={css({ display: 'flex', alignItems: 'center', gap: 2, mb: 2 })}>
                  <input
                    type="checkbox"
                    checked={exportSettings.includeIdText}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      includeIdText: e.target.checked
                    }))}
                  />
                  <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                    Include ID text under QR codes
                  </span>
                </label>
                <p className={css({ fontSize: 'xs', color: 'fg.muted', ml: 6 })}>
                  Format: 1-{batch.batch_number.match(/(\d+)$/)?.[1] || '1'}-09-25-SAMPLE
                </p>
              </div>

              {/* Text Size Selection */}
              {exportSettings.includeIdText && (
                <div>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                    ID Text Size
                  </label>
                  <div className={css({ spaceY: '2' })}>
                    {TEXT_SIZE_OPTIONS.map((option) => (
                      <label key={option.value} className={css({ display: 'flex', alignItems: 'center', gap: 2 })}>
                        <input
                          type="radio"
                          name="textSize"
                          value={option.value}
                          checked={exportSettings.textSize === option.value}
                          onChange={(e) => setExportSettings(prev => ({
                            ...prev,
                            textSize: e.target.value as typeof exportSettings.textSize
                          }))}
                        />
                        <div>
                          <span className={css({ fontSize: 'sm' })}>{option.label}</span>
                          <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                            {option.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Information */}
              <Box mt={6} p={4} bg="bg.muted" rounded="md">
                <h4 className={css({ fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                  Export Details
                </h4>
                <ul className={css({ fontSize: 'xs', spaceY: '1' })}>
                  <li>• Each QR code will be exported as a separate PDF</li>
                  <li>• Files named as: [ID]_[style].pdf</li>
                  <li>• All PDFs packaged in a ZIP archive</li>
                  <li>• Professional vector quality for printing</li>
                  {exportSettings.includeIdText && (
                    <li>• ID text will be positioned below each QR code</li>
                  )}
                </ul>
              </Box>
            </div>
          </Box>

          {/* Preview Section */}
          <Box flex="1" minW="300px">
            <h3 className={css({ fontSize: 'md', fontWeight: 'medium', mb: 4 })}>
              Export Preview
            </h3>

            <QRPreview
              preset={qrPreset || undefined}
              codeText="SAMPLE"
              size={200}
              showLabel={false}
            />

            {exportSettings.includeIdText && (
              <Box mt={2} textAlign="center">
                <span className={css({
                  fontSize: exportSettings.textSize === 'tiny' ? 'xs' :
                           exportSettings.textSize === 'small' ? 'sm' :
                           exportSettings.textSize === 'medium' ? 'md' : 'sm',
                  fontFamily: 'mono',
                  color: 'fg.muted'
                })}>
                  1-{batch.batch_number.match(/(\d+)$/)?.[1] || '1'}-09-25-SAMPLE
                </span>
              </Box>
            )}

            <Box mt={4} p={3} bg="bg.muted" rounded="md">
              <h4 className={css({ fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                Export Size: {exportSettings.size}
              </h4>
              <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                Each PDF will be exactly {exportSettings.size} in size for professional printing.
              </p>
            </Box>
          </Box>
        </Flex>

        {/* Actions */}
        <Flex justify="flex-end" gap={3} mt={6} pt={4} borderTop="1px solid" borderColor="border.default">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={css({
              px: 4,
              py: 2,
              border: '1px solid',
              borderColor: 'border.default',
              rounded: 'md',
              fontSize: 'sm'
            })}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className={css({
              px: 4,
              py: 2,
              bg: 'accent.default',
              color: 'white',
              rounded: 'md',
              fontSize: 'sm',
              opacity: loading ? 0.5 : 1
            })}
          >
            {loading ? 'Generating PDFs...' : `Export ${batch.quantity} PDFs`}
          </button>
        </Flex>
      </Box>
    </div>
  )
}