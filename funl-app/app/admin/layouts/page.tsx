'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack, Grid } from '@/styled-system/jsx'
import Link from 'next/link'

interface PrintLayout {
  id: string
  name: string
  print_type: 'A4_portrait' | 'A5_portrait' | 'A5_landscape'
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export default function AdminLayoutsPage() {
  const [layouts, setLayouts] = useState<PrintLayout[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetchLayouts()
  }, [])

  const checkAdminAndFetchLayouts = async () => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    // For now, we'll assume logged in users are admins
    // In production, you'd check against an admin role or specific user IDs
    setIsAdmin(true)

    // Fetch layouts
    const { data, error } = await supabase
      .from('print_layouts')
      .select('*')
      .order('print_type', { ascending: true })
      .order('name', { ascending: true })

    if (!error && data) {
      setLayouts(data)
    }
    
    setLoading(false)
  }

  const toggleLayoutStatus = async (layoutId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('print_layouts')
      .update({ is_active: !currentStatus })
      .eq('id', layoutId)

    if (!error) {
      await checkAdminAndFetchLayouts()
    }
  }

  const setDefaultLayout = async (layoutId: string, printType: string) => {
    // First, unset any existing default for this print type
    await supabase
      .from('print_layouts')
      .update({ is_default: false })
      .eq('print_type', printType)
      .eq('is_default', true)

    // Then set the new default
    const { error } = await supabase
      .from('print_layouts')
      .update({ is_default: true })
      .eq('id', layoutId)

    if (!error) {
      await checkAdminAndFetchLayouts()
    }
  }

  if (loading) {
    return (
      <Box maxW="6xl" mx="auto" py={8}>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Loading...</p>
      </Box>
    )
  }

  if (!isAdmin) {
    return (
      <Box maxW="6xl" mx="auto" py={8}>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Access denied. Admin only.</p>
      </Box>
    )
  }

  const buttonStyles = css({
    px: 3,
    py: 1,
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
  })

  return (
    <Box maxW="6xl" mx="auto" py={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
          Print Layout Manager
        </h1>
        <Link
          href="/admin/layouts/new"
          className={primaryButtonStyles}
        >
          Create New Layout
        </Link>
      </Flex>

      {/* Layouts Grid */}
      <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        {layouts.map((layout) => (
          <Box
            key={layout.id}
            bg="bg.default"
            borderWidth="1px"
            borderColor="border.default"
            boxShadow="sm"
            p={4}
          >
            <Stack gap={3}>
              <Flex justify="space-between" align="start">
                <Box>
                  <h3 className={css({ fontSize: 'md', fontWeight: 'semibold', color: 'fg.default' })}>
                    {layout.name}
                  </h3>
                  <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
                    {layout.print_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </Box>
                <Flex gap={2}>
                  {layout.is_default && (
                    <span className={css({
                      px: 2,
                      py: 0.5,
                      fontSize: 'xs',
                      fontWeight: 'medium',
                      colorPalette: 'mint',
                      bg: 'colorPalette.subtle',
                      color: 'colorPalette.text',
                      borderRadius: 'full'
                    })}>
                      Default
                    </span>
                  )}
                  <span className={css({
                    px: 2,
                    py: 0.5,
                    fontSize: 'xs',
                    fontWeight: 'medium',
                    colorPalette: layout.is_active ? 'green' : 'gray',
                    bg: 'colorPalette.subtle',
                    color: 'colorPalette.text',
                    borderRadius: 'full'
                  })}>
                    {layout.is_active ? 'Active' : 'Inactive'}
                  </span>
                </Flex>
              </Flex>

              <Flex gap={2} mt={2}>
                <Link
                  href={`/admin/layouts/${layout.id}/edit`}
                  className={buttonStyles}
                >
                  Edit
                </Link>
                
                {!layout.is_default && (
                  <button
                    onClick={() => setDefaultLayout(layout.id, layout.print_type)}
                    className={buttonStyles}
                  >
                    Set as Default
                  </button>
                )}
                
                <button
                  onClick={() => toggleLayoutStatus(layout.id, layout.is_active)}
                  className={buttonStyles}
                >
                  {layout.is_active ? 'Disable' : 'Enable'}
                </button>
              </Flex>
            </Stack>
          </Box>
        ))}
      </Grid>

      {layouts.length === 0 && (
        <Box textAlign="center" py={12}>
          <p className={css({ fontSize: 'lg', color: 'fg.muted' })}>
            No layouts found. Create your first layout to get started.
          </p>
        </Box>
      )}
    </Box>
  )
}