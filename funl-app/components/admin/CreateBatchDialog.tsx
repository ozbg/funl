'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { createClient } from '@/lib/supabase/client'
import { loadQRPresetsForBusiness, type QRPreset } from '@/lib/qr-generation'
import { QRPreview } from '@/components/QRPreview'
import type { GenerateBatchRequest, AssetType } from '@/lib/types/qr-reservation'

interface CreateBatchDialogProps {
  qrPresets?: Array<{
    id: string
    name: string
    slug: string
  }>
}

export function CreateBatchDialog({ qrPresets: initialPresets = [] }: CreateBatchDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [qrPresets, setQrPresets] = useState<QRPreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1000,
    prefix: 'PP',
    description: '',
    assetType: 'sticker' as AssetType,
    assetSize: '50mm',
    expiresInDays: undefined as number | undefined
  })

  // Load QR presets for the current user
  useEffect(() => {
    const loadPresets = async () => {
      try {
        console.log('🔧 Loading QR presets for admin user...')
        const presets = await loadQRPresetsForBusiness(supabase)
        console.log('🔧 Loaded presets:', presets.length, presets)
        setQrPresets(presets)
        if (presets.length > 0 && !selectedPresetId) {
          setSelectedPresetId(presets[0].id)
          console.log('🔧 Auto-selected first preset:', presets[0].id, presets[0].name)
        }
      } catch (error) {
        console.error('❌ Error loading QR presets:', error)
      }
    }

    loadPresets()
  }, [supabase, selectedPresetId])

  const selectedPreset = qrPresets.find(p => p.id === selectedPresetId)

  // Generate sample code for preview (similar to batch export ID format)
  const generateSampleCode = () => {
    const now = new Date()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const year = now.getFullYear().toString().slice(-2)
    const sampleCode = formData.prefix ? `${formData.prefix}SAMPLE` : 'PP123SAMPLE'
    return sampleCode
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedPresetId) {
      alert('Please select a QR style')
      return
    }

    setLoading(true)

    const data: GenerateBatchRequest = {
      name: formData.name,
      quantity: formData.quantity,
      stylePresetId: selectedPresetId,
      assetType: formData.assetType,
      assetMetadata: {
        size: formData.assetSize
      },
      prefix: formData.prefix || undefined,
      description: formData.description || undefined,
      expiresInDays: formData.expiresInDays || undefined
    }

    try {
      const response = await fetch('/api/admin/qr-codes/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create batch')
      }

      const result = await response.json()
      console.log('Batch created:', result)

      // Reset form and close dialog
      setFormData({
        name: '',
        quantity: 1000,
        prefix: 'PP',
        description: '',
        assetType: 'sticker' as AssetType,
        assetSize: '50mm',
        expiresInDays: undefined
      })

      const dialog = document.getElementById('batch-dialog') as HTMLDialogElement
      dialog?.close()

      // Refresh the page to show the new batch
      router.refresh()
      alert('Batch created successfully!')
    } catch (error) {
      console.error('Error creating batch:', error)
      alert('Failed to create batch. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <button
        className={css({
          px: 4,
          py: 2,
          bg: 'accent.default',
          color: 'white',
          rounded: 'md',
          fontSize: 'sm'
        })}
        onClick={() => {
          const dialog = document.getElementById('batch-dialog') as HTMLDialogElement
          dialog?.showModal()
        }}
      >
        Create Batch
      </button>

      <dialog
        id="batch-dialog"
        className={css({
          p: 0,
          rounded: 'lg',
          border: 'none',
          boxShadow: 'lg',
          maxW: '4xl',
          w: '90vw',
          maxH: '90vh',
          overflow: 'auto',
          '&::backdrop': {
            bg: 'black/50'
          }
        })}
      >
        <Box p={6}>
          <Flex justify="space-between" align="center" mb={4}>
            <h2 className={css({ fontSize: 'xl', fontWeight: 'bold' })}>
              Create QR Code Batch
            </h2>
            <button
              onClick={() => {
                const dialog = document.getElementById('batch-dialog') as HTMLDialogElement
                dialog?.close()
              }}
              className={css({
                p: 1,
                rounded: 'md',
                _hover: { bg: 'gray.100' }
              })}
            >
              ✕
            </button>
          </Flex>

          <Flex gap={6}>
            {/* Form Fields */}
            <Box flex="1">
              <form onSubmit={handleSubmit} className={css({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                <div>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                    Batch Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Holiday Campaign 2024"
                    className={css({
                      w: 'full',
                      px: 3,
                      py: 2,
                      border: '1px solid',
                      borderColor: 'border.default',
                      rounded: 'md',
                      fontSize: 'sm'
                    })}
                  />
                </div>

                <div className={css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 })}>
                  <div>
                    <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1000 })}
                      required
                      className={css({
                        w: 'full',
                        px: 3,
                        py: 2,
                        border: '1px solid',
                        borderColor: 'border.default',
                        rounded: 'md',
                        fontSize: 'sm'
                      })}
                    />
                  </div>

                  <div>
                    <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                      Code Prefix (optional)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={formData.prefix}
                      onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                      placeholder="PP"
                      className={css({
                        w: 'full',
                        px: 3,
                        py: 2,
                        border: '1px solid',
                        borderColor: 'border.default',
                        rounded: 'md',
                        fontSize: 'sm'
                      })}
                    />
                  </div>
                </div>

                <div className={css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 })}>
                  <div>
                    <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                      Asset Type
                    </label>
                    <select
                      value={formData.assetType}
                      onChange={(e) => setFormData({ ...formData, assetType: e.target.value as AssetType })}
                      required
                      className={css({
                        w: 'full',
                        px: 3,
                        py: 2,
                        border: '1px solid',
                        borderColor: 'border.default',
                        rounded: 'md',
                        fontSize: 'sm',
                        cursor: 'pointer'
                      })}
                    >
                      <option value="sticker">Sticker</option>
                      <option value="flyer">Flyer</option>
                      <option value="poster">Poster</option>
                      <option value="card">Card</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                      Size
                    </label>
                    <select
                      value={formData.assetSize}
                      onChange={(e) => setFormData({ ...formData, assetSize: e.target.value })}
                      required
                      className={css({
                        w: 'full',
                        px: 3,
                        py: 2,
                        border: '1px solid',
                        borderColor: 'border.default',
                        rounded: 'md',
                        fontSize: 'sm',
                        cursor: 'pointer'
                      })}
                    >
                      {formData.assetType === 'sticker' && (
                        <>
                          <option value="25mm">25mm × 25mm</option>
                          <option value="50mm">50mm × 50mm</option>
                          <option value="75mm">75mm × 75mm</option>
                          <option value="100mm">100mm × 100mm</option>
                          <option value="150mm">150mm × 150mm</option>
                          <option value="200mm">200mm × 200mm</option>
                        </>
                      )}
                      {formData.assetType === 'flyer' && (
                        <>
                          <option value="DL">DL (99mm × 210mm)</option>
                          <option value="A5">A5 (148mm × 210mm)</option>
                          <option value="A4">A4 (210mm × 297mm)</option>
                        </>
                      )}
                      {formData.assetType === 'poster' && (
                        <>
                          <option value="A3">A3 (297mm × 420mm)</option>
                          <option value="A2">A2 (420mm × 594mm)</option>
                          <option value="A1">A1 (594mm × 841mm)</option>
                        </>
                      )}
                      {formData.assetType === 'card' && (
                        <>
                          <option value="standard">Standard (90mm × 55mm)</option>
                          <option value="square">Square (85mm × 85mm)</option>
                        </>
                      )}
                      {formData.assetType === 'other' && (
                        <option value="custom">Custom Size</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                    QR Code Style
                  </label>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    required
                    className={css({
                      w: 'full',
                      px: 3,
                      py: 2,
                      border: '1px solid',
                      borderColor: 'border.default',
                      rounded: 'md',
                      fontSize: 'sm',
                      cursor: 'pointer'
                    })}
                  >
                    {qrPresets.length === 0 && (
                      <option value="">Loading styles...</option>
                    )}
                    {qrPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                    Expires in Days (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.expiresInDays || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      expiresInDays: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Never expires"
                    className={css({
                      w: 'full',
                      px: 3,
                      py: 2,
                      border: '1px solid',
                      borderColor: 'border.default',
                      rounded: 'md',
                      fontSize: 'sm'
                    })}
                  />
                </div>

                <div>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                    Description (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this batch..."
                    className={css({
                      w: 'full',
                      px: 3,
                      py: 2,
                      border: '1px solid',
                      borderColor: 'border.default',
                      rounded: 'md',
                      fontSize: 'sm'
                    })}
                  />
                </div>

                <div className={css({ display: 'flex', justifyContent: 'flex-end', gap: 3, pt: 4 })}>
                  <button
                    type="button"
                    onClick={() => {
                      const dialog = document.getElementById('batch-dialog') as HTMLDialogElement
                      dialog?.close()
                    }}
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
                    type="submit"
                    disabled={loading || !selectedPresetId}
                    className={css({
                      px: 4,
                      py: 2,
                      bg: 'accent.default',
                      color: 'white',
                      rounded: 'md',
                      fontSize: 'sm',
                      opacity: (loading || !selectedPresetId) ? 0.5 : 1
                    })}
                  >
                    {loading ? 'Creating...' : 'Create Batch'}
                  </button>
                </div>
              </form>
            </Box>

            {/* QR Preview */}
            <Box flex="1" maxW="300px">
              <h3 className={css({ fontSize: 'md', fontWeight: 'medium', mb: 4 })}>
                QR Code Preview
              </h3>

              <QRPreview
                preset={selectedPreset}
                codeText={generateSampleCode()}
                size={200}
                showLabel={true}
              />

              <Box mt={4} p={4} bg="gray.50" rounded="md">
                <h4 className={css({ fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                  About QR Code Batches
                </h4>
                <ul className={css({ fontSize: 'xs', color: 'fg.muted', spaceY: '1' })}>
                  <li>• QR codes are generated with your selected style</li>
                  <li>• Physical size is chosen when printing/exporting</li>
                  <li>• Each code will have a unique URL like: funl.app/f/{formData.prefix || ''}XXXXX</li>
                  <li>• Codes can be allocated to funnels on-demand</li>
                </ul>
              </Box>

              <Box mt={4}>
                <h4 className={css({ fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                  Available Print Sizes
                </h4>
                <div className={css({ fontSize: 'xs', color: 'fg.muted', spaceY: '1' })}>
                  <div>25mm × 25mm (Small stickers)</div>
                  <div>50mm × 50mm (Medium stickers)</div>
                  <div>75mm × 75mm (Large stickers)</div>
                  <div>100mm × 100mm (XL stickers)</div>
                  <div>+ Custom sizes available</div>
                </div>
              </Box>
            </Box>
          </Flex>
        </Box>
      </dialog>
    </Box>
  )
}