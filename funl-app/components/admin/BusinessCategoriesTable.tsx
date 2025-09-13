'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'
import { EditCategoryDialog } from './EditCategoryDialog'

interface BusinessCategory {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface BusinessCategoriesTableProps {
  categories: BusinessCategory[]
}

export function BusinessCategoriesTable({ categories: initialCategories }: BusinessCategoriesTableProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setLoading(id)
    try {
      const response = await fetch(`/api/admin/business-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_active: !currentStatus 
        })
      })

      if (response.ok) {
        const { category } = await response.json()
        setCategories(prev => prev.map(cat => 
          cat.id === id ? { ...cat, ...category } : cat
        ))
      }
    } catch (error) {
      console.error('Error toggling category status:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    setLoading(id)
    try {
      const response = await fetch(`/api/admin/business-categories/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat.id !== id))
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleUpdate = (updatedCategory: BusinessCategory) => {
    setCategories(prev => prev.map(cat => 
      cat.id === updatedCategory.id ? updatedCategory : cat
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
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Status</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Sort Order</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Actions</th>
          </tr>
        </thead>
        <tbody className={css({ '& > tr + tr': { borderTop: '1px solid', borderColor: 'border.default' } })}>
          {categories.map((category) => (
            <tr key={category.id} className={css({ _hover: { bg: 'bg.muted' } })}>
              <td className={css({ px: 4, py: 3 })}>
                <div className={css({ fontWeight: 'medium' })}>{category.name}</div>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <code className={css({ fontSize: 'xs', bg: 'bg.muted', px: 1, py: 0.5, rounded: 'sm' })}>
                  {category.slug}
                </code>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <div className={css({ maxW: '200px', truncate: true })}>
                  {category.description || '-'}
                </div>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <Button
                  size="xs"
                  variant={category.is_active ? 'solid' : 'outline'}
                  colorPalette={category.is_active ? 'green' : 'gray'}
                  disabled={loading === category.id}
                  onClick={() => handleToggleActive(category.id, category.is_active)}
                >
                  {loading === category.id ? '...' : (category.is_active ? 'Active' : 'Inactive')}
                </Button>
              </td>
              <td className={css({ px: 4, py: 3 })}>{category.sort_order}</td>
              <td className={css({ px: 4, py: 3 })}>
                <Flex gap={2}>
                  <EditCategoryDialog 
                    category={category} 
                    onUpdate={handleUpdate}
                  />
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="red"
                    disabled={loading === category.id}
                    onClick={() => handleDelete(category.id)}
                  >
                    {loading === category.id ? '...' : 'Delete'}
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