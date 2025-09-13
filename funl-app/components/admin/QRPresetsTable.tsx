'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'
import { EditQRPresetDialog } from './EditQRPresetDialog'
import { QRPreview } from './QRPreview'

interface BusinessCategory {
  id: string
  name: string
  slug: string
  is_active: boolean
}

interface QRPreset {
  id: string
  name: string
  slug: string
  description: string | null
  style_config: Record<string, unknown>
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  category_qr_presets: {
    business_categories: BusinessCategory
  }[]
}

interface QRPresetsTableProps {
  qrPresets: QRPreset[]
  categories: BusinessCategory[]
}

export function QRPresetsTable({ qrPresets: initialQRPresets, categories }: QRPresetsTableProps) {
  const [qrPresets, setQRPresets] = useState(initialQRPresets)
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setLoading(id)
    try {
      const response = await fetch(`/api/admin/qr-presets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_active: !currentStatus 
        })
      })

      if (response.ok) {
        const { qrPreset } = await response.json()
        setQRPresets(prev => prev.map(qp => 
          qp.id === id ? { ...qp, ...qrPreset } : qp
        ))
      }
    } catch (error) {
      console.error('Error toggling QR preset status:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR preset?')) return

    setLoading(id)
    try {
      const response = await fetch(`/api/admin/qr-presets/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setQRPresets(prev => prev.filter(qp => qp.id !== id))
      }
    } catch (error) {
      console.error('Error deleting QR preset:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleUpdate = (updatedQRPreset: QRPreset) => {
    setQRPresets(prev => prev.map(qp => 
      qp.id === updatedQRPreset.id ? updatedQRPreset : qp
    ))
  }

  return (
    <Box overflowX="auto">
      <table className={css({ w: 'full', fontSize: 'sm' })}>
        <thead className={css({ bg: 'bg.muted', borderBottom: '1px solid', borderColor: 'border.default' })}>
          <tr>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Preview</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Name</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Slug</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Description</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Categories</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Status</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Sort Order</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Actions</th>
          </tr>
        </thead>
        <tbody className={css({ '& > tr + tr': { borderTop: '1px solid', borderColor: 'border.default' } })}>
          {qrPresets.map((qrPreset) => (
            <tr key={qrPreset.id} className={css({ _hover: { bg: 'bg.muted' } })}>
              <td className={css({ px: 4, py: 3 })}>
                <QRPreview 
                  style_config={qrPreset.style_config} 
                  size={60}
                />
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <div className={css({ fontWeight: 'medium' })}>{qrPreset.name}</div>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <code className={css({ fontSize: 'xs', bg: 'bg.muted', px: 1, py: 0.5, rounded: 'sm' })}>
                  {qrPreset.slug}
                </code>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <div className={css({ maxW: '200px', truncate: true })}>
                  {qrPreset.description || '-'}
                </div>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <div className={css({ maxW: '150px' })}>
                  {qrPreset.category_qr_presets.length > 0 ? (
                    <div className={css({ fontSize: 'xs' })}>
                      {qrPreset.category_qr_presets.map((cqp, index) => (
                        <span key={cqp.business_categories.id}>
                          {cqp.business_categories.name}
                          {index < qrPreset.category_qr_presets.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>None</span>
                  )}
                </div>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <Button
                  size="xs"
                  variant={qrPreset.is_active ? 'solid' : 'outline'}
                  colorPalette={qrPreset.is_active ? 'green' : 'gray'}
                  disabled={loading === qrPreset.id}
                  onClick={() => handleToggleActive(qrPreset.id, qrPreset.is_active)}
                >
                  {loading === qrPreset.id ? '...' : (qrPreset.is_active ? 'Active' : 'Inactive')}
                </Button>
              </td>
              <td className={css({ px: 4, py: 3 })}>{qrPreset.sort_order}</td>
              <td className={css({ px: 4, py: 3 })}>
                <Flex gap={2}>
                  <EditQRPresetDialog 
                    qrPreset={qrPreset} 
                    categories={categories}
                    onUpdate={handleUpdate}
                  />
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="red"
                    disabled={loading === qrPreset.id}
                    onClick={() => handleDelete(qrPreset.id)}
                  >
                    {loading === qrPreset.id ? '...' : 'Delete'}
                  </Button>
                </Flex>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  )
}