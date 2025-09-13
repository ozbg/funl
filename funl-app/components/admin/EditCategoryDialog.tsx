'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'

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

interface EditCategoryDialogProps {
  category: BusinessCategory
  onUpdate: (category: BusinessCategory) => void
}

export function EditCategoryDialog({ category, onUpdate }: EditCategoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    is_active: category.is_active,
    sort_order: category.sort_order
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/business-categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const { category: updatedCategory } = await response.json()
        onUpdate(updatedCategory)
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error updating category:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button size="xs" variant="outline" onClick={() => setIsOpen(true)}>
        Edit
      </Button>
    )
  }

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.5)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={50}
      onClick={() => setIsOpen(false)}
    >
      <Box
        bg="bg.default"
        borderWidth="1px"
        borderColor="border.default"
        boxShadow="lg"
        maxW="lg"
        w="full"
        mx={4}
        p={6}
        onClick={(e) => e.stopPropagation()}
      >
        <Box mb={4}>
          <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'fg.default' })}>
            Edit Business Category
          </h2>
          <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.muted' })}>
            Update the category details
          </p>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid gap={4} mb={6}>
            <Box>
              <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={css({
                  mt: 1,
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  fontSize: 'sm',
                  _focus: { outline: 'none', borderColor: 'accent.default' }
                })}
              />
            </Box>

            <Box>
              <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className={css({
                  mt: 1,
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  fontSize: 'sm',
                  _focus: { outline: 'none', borderColor: 'accent.default' }
                })}
              />
            </Box>

            <Box>
              <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={css({
                  mt: 1,
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  fontSize: 'sm',
                  resize: 'vertical',
                  _focus: { outline: 'none', borderColor: 'accent.default' }
                })}
              />
            </Box>

            <Flex gap={4}>
              <Box flex={1}>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className={css({
                    mt: 1,
                    w: 'full',
                    px: 3,
                    py: 2,
                    borderWidth: '1px',
                    borderColor: 'border.default',
                    rounded: 'md',
                    fontSize: 'sm',
                    _focus: { outline: 'none', borderColor: 'accent.default' }
                  })}
                />
              </Box>
              <Box>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  Active
                </label>
                <Box mt={3}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className={css({ cursor: 'pointer' })}
                  />
                </Box>
              </Box>
            </Flex>
          </Grid>

          <Flex gap={3} justify="flex-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              Update Category
            </Button>
          </Flex>
        </form>
      </Box>
    </Box>
  )
}