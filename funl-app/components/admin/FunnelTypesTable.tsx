'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'
import { EditFunnelTypeDialog } from './EditFunnelTypeDialog'

interface BusinessCategory {
  id: string
  name: string
  slug: string
  is_active: boolean
}

interface FunnelType {
  id: string
  name: string
  slug: string
  description: string | null
  template_config: any
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  category_funnel_types: {
    business_categories: BusinessCategory
  }[]
}

interface FunnelTypesTableProps {
  funnelTypes: FunnelType[]
  categories: BusinessCategory[]
}

export function FunnelTypesTable({ funnelTypes: initialFunnelTypes, categories }: FunnelTypesTableProps) {
  const [funnelTypes, setFunnelTypes] = useState(initialFunnelTypes)
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setLoading(id)
    try {
      const response = await fetch(`/api/admin/funnel-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_active: !currentStatus 
        })
      })

      if (response.ok) {
        const { funnelType } = await response.json()
        setFunnelTypes(prev => prev.map(ft => 
          ft.id === id ? { ...ft, ...funnelType } : ft
        ))
      }
    } catch (error) {
      console.error('Error toggling funnel type status:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this funnel type?')) return

    setLoading(id)
    try {
      const response = await fetch(`/api/admin/funnel-types/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFunnelTypes(prev => prev.filter(ft => ft.id !== id))
      }
    } catch (error) {
      console.error('Error deleting funnel type:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleUpdate = (updatedFunnelType: FunnelType) => {
    setFunnelTypes(prev => prev.map(ft => 
      ft.id === updatedFunnelType.id ? updatedFunnelType : ft
    ))
  }

  return (
    <Box overflowX="auto">
      <table className={css({ w: 'full', fontSize: 'sm' })}>
        <thead className={css({ bg: 'bg.muted', borderBottom: '1px solid', borderColor: 'border.default' })}>
          <tr>
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
          {funnelTypes.map((funnelType) => (
            <tr key={funnelType.id} className={css({ _hover: { bg: 'bg.muted' } })}>
              <td className={css({ px: 4, py: 3 })}>
                <div className={css({ fontWeight: 'medium' })}>{funnelType.name}</div>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <code className={css({ fontSize: 'xs', bg: 'bg.muted', px: 1, py: 0.5, rounded: 'sm' })}>
                  {funnelType.slug}
                </code>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <div className={css({ maxW: '200px', truncate: true })}>
                  {funnelType.description || '-'}
                </div>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <div className={css({ maxW: '150px' })}>
                  {funnelType.category_funnel_types.length > 0 ? (
                    <div className={css({ fontSize: 'xs' })}>
                      {funnelType.category_funnel_types.map((cft, index) => (
                        <span key={cft.business_categories.id}>
                          {cft.business_categories.name}
                          {index < funnelType.category_funnel_types.length - 1 && ', '}
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
                  variant={funnelType.is_active ? 'solid' : 'outline'}
                  colorPalette={funnelType.is_active ? 'green' : 'gray'}
                  disabled={loading === funnelType.id}
                  onClick={() => handleToggleActive(funnelType.id, funnelType.is_active)}
                >
                  {loading === funnelType.id ? '...' : (funnelType.is_active ? 'Active' : 'Inactive')}
                </Button>
              </td>
              <td className={css({ px: 4, py: 3 })}>{funnelType.sort_order}</td>
              <td className={css({ px: 4, py: 3 })}>
                <Flex gap={2}>
                  <EditFunnelTypeDialog 
                    funnelType={funnelType} 
                    categories={categories}
                    onUpdate={handleUpdate}
                  />
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="red"
                    disabled={loading === funnelType.id}
                    onClick={() => handleDelete(funnelType.id)}
                  >
                    {loading === funnelType.id ? '...' : 'Delete'}
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