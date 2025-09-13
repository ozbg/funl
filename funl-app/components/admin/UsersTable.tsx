'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'
import { UserDetailsDialog } from './UserDetailsDialog'

interface BusinessCategory {
  id: string
  name: string
  slug: string
  is_active: boolean
}

interface User {
  id: string
  email: string
  business_name: string
  type: 'individual' | 'agency'
  phone: string | null
  website: string | null
  subscription_status: 'trial' | 'active' | 'cancelled'
  subscription_tier: 'basic' | 'pro' | 'enterprise'
  is_admin: boolean
  business_category_id: string | null
  created_at: string
  updated_at: string
  business_categories: BusinessCategory | null
}

interface UsersTableProps {
  users: User[]
  categories: BusinessCategory[]
}

export function UsersTable({ users: initialUsers, categories }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    setLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_admin: !currentStatus 
        })
      })

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, is_admin: !currentStatus } : user
        ))
      }
    } catch (error) {
      console.error('Error toggling admin status:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleUpdateCategory = async (userId: string, categoryId: string | null) => {
    setLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          business_category_id: categoryId 
        })
      })

      if (response.ok) {
        const selectedCategory = categoryId ? categories.find(c => c.id === categoryId) : null
        setUsers(prev => prev.map(user => 
          user.id === userId ? { 
            ...user, 
            business_category_id: categoryId,
            business_categories: selectedCategory || null
          } : user
        ))
      }
    } catch (error) {
      console.error('Error updating user category:', error)
    } finally {
      setLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'trial': return 'blue'
      case 'cancelled': return 'red'
      default: return 'gray'
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'purple'
      case 'pro': return 'blue'
      case 'basic': return 'gray'
      default: return 'gray'
    }
  }

  return (
    <Box overflowX="auto">
      <table className={css({ w: 'full', fontSize: 'sm' })}>
        <thead className={css({ bg: 'bg.muted', borderBottom: '1px solid', borderColor: 'border.default' })}>
          <tr>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>User</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Type</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Category</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Subscription</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Admin</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Contact</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Created</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'medium', color: 'fg.default' })}>Actions</th>
          </tr>
        </thead>
        <tbody className={css({ '& > tr + tr': { borderTop: '1px solid', borderColor: 'border.default' } })}>
          {users.map((user) => (
            <tr key={user.id} className={css({ _hover: { bg: 'bg.muted' } })}>
              <td className={css({ px: 4, py: 3 })}>
                <Box>
                  <div className={css({ fontWeight: 'medium' })}>{user.business_name}</div>
                  <div className={css({ fontSize: 'xs', color: 'fg.muted' })}>{user.email}</div>
                </Box>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <span className={css({ 
                  fontSize: 'xs', 
                  px: 2, 
                  py: 1, 
                  bg: 'bg.muted', 
                  rounded: 'sm',
                  textTransform: 'capitalize'
                })}>
                  {user.type}
                </span>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <select
                  value={user.business_category_id || ''}
                  onChange={(e) => handleUpdateCategory(user.id, e.target.value || null)}
                  disabled={loading === user.id}
                  className={css({
                    fontSize: 'xs',
                    px: 2,
                    py: 1,
                    borderWidth: '1px',
                    borderColor: 'border.default',
                    rounded: 'sm',
                    bg: 'bg.default',
                    _focus: { outline: 'none', borderColor: 'accent.default' }
                  })}
                >
                  <option value="">No Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <Flex gap={2} align="center">
                  <span className={css({ 
                    fontSize: 'xs', 
                    px: 2, 
                    py: 1, 
                    bg: `${getStatusColor(user.subscription_status)}.subtle`, 
                    color: `${getStatusColor(user.subscription_status)}.fg`,
                    rounded: 'sm',
                    textTransform: 'capitalize'
                  })}>
                    {user.subscription_status}
                  </span>
                  <span className={css({ 
                    fontSize: 'xs', 
                    px: 2, 
                    py: 1, 
                    bg: `${getTierColor(user.subscription_tier)}.subtle`, 
                    color: `${getTierColor(user.subscription_tier)}.fg`,
                    rounded: 'sm',
                    textTransform: 'uppercase'
                  })}>
                    {user.subscription_tier}
                  </span>
                </Flex>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <Button
                  size="xs"
                  variant={user.is_admin ? 'solid' : 'outline'}
                  colorPalette={user.is_admin ? 'red' : 'blue'}
                  disabled={loading === user.id}
                  onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                >
                  {loading === user.id ? '...' : (user.is_admin ? 'Admin' : 'User')}
                </Button>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <Box fontSize="xs" color="fg.muted">
                  {user.phone && <div>📞 {user.phone}</div>}
                  {user.website && <div>🌐 {user.website}</div>}
                </Box>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(user)
                    setIsDialogOpen(true)
                  }}
                >
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <UserDetailsDialog
        user={selectedUser}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedUser(null)
        }}
      />
    </Box>
  )
}