'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'

interface BusinessCategory {
  id: string
  name: string
  slug: string
  is_active: boolean
}

interface CreateFunnelTypeDialogProps {
  categories: BusinessCategory[]
}

export function CreateFunnelTypeDialog({ categories }: CreateFunnelTypeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
    category_ids: [] as string[]
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/funnel-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsOpen(false)
        setFormData({ name: '', slug: '', description: '', sort_order: 0, category_ids: [] })
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating funnel type:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }))
  }

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }))
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        Create Funnel Type
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
        maxW="2xl"
        w="full"
        mx={4}
        p={6}
        maxH="90vh"
        overflowY="auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Box mb={4}>
          <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'fg.default' })}>
            Create Funnel Type
          </h2>
          <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.muted' })}>
            Add a new funnel type and assign it to business categories
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
                onChange={(e) => handleNameChange(e.target.value)}
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
                placeholder="e.g., Property Listing"
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
                placeholder="e.g., property-listing"
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
                placeholder="Brief description of this funnel type"
              />
            </Box>

            <Box>
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
                placeholder="0"
              />
            </Box>

            <Box>
              <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 2, display: 'block' })}>
                Available in Categories
              </label>
              <Box 
                borderWidth="1px" 
                borderColor="border.default" 
                rounded="md" 
                p={3}
                maxH="200px"
                overflowY="auto"
              >
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className={css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 1,
                      cursor: 'pointer'
                    })}
                  >
                    <input
                      type="checkbox"
                      checked={formData.category_ids.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className={css({ cursor: 'pointer' })}
                    />
                    <span className={css({ fontSize: 'sm' })}>{category.name}</span>
                  </label>
                ))}
              </Box>
            </Box>
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
              Create Funnel Type
            </Button>
          </Flex>
        </form>
      </Box>
    </Box>
  )
}