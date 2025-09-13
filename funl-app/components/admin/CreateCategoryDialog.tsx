'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'

export function CreateCategoryDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sort_order: 0
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/business-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsOpen(false)
        setFormData({ name: '', slug: '', description: '', sort_order: 0 })
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating category:', error)
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

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        Create Category
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
            Create Business Category
          </h2>
          <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.muted' })}>
            Add a new business category to organize your users
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
                placeholder="e.g., Real Estate Agent"
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
                placeholder="e.g., real-estate-agent"
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
                placeholder="Brief description of this business category"
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
              {loading ? 'Creating...' : 'Create Category'}
            </Button>
          </Flex>
        </form>
      </Box>
    </Box>
  )
}