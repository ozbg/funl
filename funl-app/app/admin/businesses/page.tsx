'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'

interface Business {
  id: string
  name: string
  email: string
  phone: string | null
  created_at: string
  onboarding_completed: boolean
  email_confirmed_at: string | null
  funnel_count: number
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadBusinesses()
  }, [])

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setBusinesses(data || [])
    } catch (error) {
      console.error('Error loading businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBusiness = async (business: Business) => {
    const reason = prompt('Enter reason for deleting this business (min 10 characters):')
    if (!reason || reason.length < 10) {
      alert('Reason must be at least 10 characters')
      return
    }

    if (!confirm(`Are you sure you want to delete ${business.name}? This action cannot be undone.`)) {
      return
    }

    setDeletingId(business.id)
    try {
      const response = await fetch(`/api/admin/businesses/${business.id}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete business')
      }

      alert('Business deleted successfully')
      loadBusinesses()
    } catch (error) {
      console.error('Error deleting business:', error)
      alert('Failed to delete business. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleResetPassword = async (business: Business) => {
    const newPassword = prompt('Enter new password (min 6 characters):')
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    const reason = prompt('Enter reason for resetting password (min 10 characters):')
    if (!reason || reason.length < 10) {
      alert('Reason must be at least 10 characters')
      return
    }

    setResettingId(business.id)
    try {
      const response = await fetch(`/api/admin/businesses/${business.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, reason }),
      })

      if (!response.ok) {
        throw new Error('Failed to reset password')
      }

      alert('Password reset successfully')
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Failed to reset password. Please try again.')
    } finally {
      setResettingId(null)
    }
  }

  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Box p={6}>
        <p className={css({ color: 'fg.muted' })}>Loading...</p>
      </Box>
    )
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
          Business Management
        </h1>
      </Flex>

      {/* Search */}
      <Box mb={6}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={css({
            w: 'full',
            maxW: 'md',
            px: 4,
            py: 2,
            fontSize: 'sm',
            bg: 'bg.default',
            borderWidth: '1px',
            borderColor: 'border.default',
            rounded: 'md',
            _focus: {
              outline: 'none',
              borderColor: 'accent.default',
              ring: '2px',
              ringColor: 'accent.default',
            },
          })}
        />
      </Box>

      {/* Stats */}
      <Grid columns={{ base: 1, md: 4 }} gap={4} mb={6}>
        <Box bg="bg.default" borderWidth="1px" borderColor="border.default" rounded="lg" p={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Total Businesses</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            {businesses.length}
          </p>
        </Box>
        <Box bg="bg.default" borderWidth="1px" borderColor="border.default" rounded="lg" p={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Email Confirmed</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            {businesses.filter(b => b.email_confirmed_at).length}
          </p>
        </Box>
        <Box bg="bg.default" borderWidth="1px" borderColor="border.default" rounded="lg" p={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Onboarded</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            {businesses.filter(b => b.onboarding_completed).length}
          </p>
        </Box>
        <Box bg="bg.default" borderWidth="1px" borderColor="border.default" rounded="lg" p={4}>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Total Funnels</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            {businesses.reduce((sum, b) => sum + (b.funnel_count || 0), 0)}
          </p>
        </Box>
      </Grid>

      {/* Businesses Table */}
      <Box
        bg="bg.default"
        borderWidth="1px"
        borderColor="border.default"
        rounded="lg"
        overflow="hidden"
      >
        <Box overflowX="auto">
          <table className={css({ w: 'full', fontSize: 'sm' })}>
            <thead className={css({ bg: 'bg.subtle' })}>
              <tr>
                <th className={css({ textAlign: 'left', py: 3, px: 4, fontWeight: 'medium', color: 'fg.muted' })}>
                  Business
                </th>
                <th className={css({ textAlign: 'left', py: 3, px: 4, fontWeight: 'medium', color: 'fg.muted' })}>
                  Email
                </th>
                <th className={css({ textAlign: 'left', py: 3, px: 4, fontWeight: 'medium', color: 'fg.muted' })}>
                  Phone
                </th>
                <th className={css({ textAlign: 'left', py: 3, px: 4, fontWeight: 'medium', color: 'fg.muted' })}>
                  Funnels
                </th>
                <th className={css({ textAlign: 'left', py: 3, px: 4, fontWeight: 'medium', color: 'fg.muted' })}>
                  Status
                </th>
                <th className={css({ textAlign: 'left', py: 3, px: 4, fontWeight: 'medium', color: 'fg.muted' })}>
                  Created
                </th>
                <th className={css({ textAlign: 'right', py: 3, px: 4, fontWeight: 'medium', color: 'fg.muted' })}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((business) => (
                <tr
                  key={business.id}
                  className={css({ borderTopWidth: '1px', borderColor: 'border.default' })}
                >
                  <td className={css({ py: 3, px: 4, fontWeight: 'medium', color: 'fg.default' })}>
                    {business.name}
                  </td>
                  <td className={css({ py: 3, px: 4, color: 'fg.muted' })}>
                    {business.email}
                  </td>
                  <td className={css({ py: 3, px: 4, color: 'fg.muted' })}>
                    {business.phone || '-'}
                  </td>
                  <td className={css({ py: 3, px: 4, color: 'fg.default' })}>
                    {business.funnel_count || 0}
                  </td>
                  <td className={css({ py: 3, px: 4 })}>
                    <Flex gap={1} flexWrap="wrap">
                      {business.email_confirmed_at && (
                        <span className={css({
                          px: 2,
                          py: 0.5,
                          bg: 'bg.muted',
                          color: 'accent.default',
                          rounded: 'md',
                          fontSize: 'xs',
                          fontWeight: 'medium',
                        })}>
                          Verified
                        </span>
                      )}
                      {business.onboarding_completed && (
                        <span className={css({
                          px: 2,
                          py: 0.5,
                          bg: 'bg.muted',
                          color: 'fg.default',
                          rounded: 'md',
                          fontSize: 'xs',
                          fontWeight: 'medium',
                        })}>
                          Onboarded
                        </span>
                      )}
                    </Flex>
                  </td>
                  <td className={css({ py: 3, px: 4, color: 'fg.muted' })}>
                    {new Date(business.created_at).toLocaleDateString()}
                  </td>
                  <td className={css({ py: 3, px: 4 })}>
                    <Flex gap={2} justify="flex-end">
                      <button
                        onClick={() => handleResetPassword(business)}
                        disabled={resettingId === business.id}
                        className={css({
                          px: 3,
                          py: 1,
                          fontSize: 'xs',
                          fontWeight: 'medium',
                          color: 'accent.default',
                          bg: 'bg.subtle',
                          rounded: 'md',
                          cursor: 'pointer',
                          _hover: { bg: 'bg.muted' },
                          _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                        })}
                      >
                        {resettingId === business.id ? 'Resetting...' : 'Reset Password'}
                      </button>
                      <button
                        onClick={() => handleDeleteBusiness(business)}
                        disabled={deletingId === business.id}
                        className={css({
                          px: 3,
                          py: 1,
                          fontSize: 'xs',
                          fontWeight: 'medium',
                          color: 'white',
                          bg: 'red.600',
                          rounded: 'md',
                          cursor: 'pointer',
                          _hover: { bg: 'red.700' },
                          _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                        })}
                      >
                        {deletingId === business.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </Flex>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBusinesses.length === 0 && (
            <Box p={8} textAlign="center">
              <p className={css({ color: 'fg.muted' })}>No businesses found</p>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
