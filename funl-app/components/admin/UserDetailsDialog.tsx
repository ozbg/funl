'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'

interface BusinessCategory {
  id: string
  name: string
  slug: string
  is_active: boolean
}

interface User {
  id: string
  business_name: string
  email: string
  phone: string | null
  website: string | null
  type: 'individual' | 'agency'
  subscription_status: 'trial' | 'active' | 'cancelled'
  subscription_tier: 'basic' | 'pro' | 'enterprise'
  is_admin: boolean
  created_at: string
  updated_at: string
  business_categories: BusinessCategory | null
}

interface UserDetailsDialogProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
}

export function UserDetailsDialog({ user, isOpen, onClose }: UserDetailsDialogProps) {
  if (!isOpen || !user) {
    return null
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
      onClick={onClose}
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
            User Details
          </h2>
          <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.muted' })}>
            Complete information for {user.business_name}
          </p>
        </Box>

        <Grid gap={6}>
          {/* Business Information */}
          <Box>
            <h3 className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
              Business Information
            </h3>
            <Grid gap={3}>
              <Box>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  Business Name
                </label>
                <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.default' })}>
                  {user.business_name}
                </p>
              </Box>
              <Box>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  Email
                </label>
                <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.default' })}>
                  {user.email}
                </p>
              </Box>
              {user.phone && (
                <Box>
                  <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                    Phone
                  </label>
                  <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.default' })}>
                    {user.phone}
                  </p>
                </Box>
              )}
              {user.website && (
                <Box>
                  <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                    Website
                  </label>
                  <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.default' })}>
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={css({ color: 'accent.default', textDecoration: 'underline' })}
                    >
                      {user.website}
                    </a>
                  </p>
                </Box>
              )}
            </Grid>
          </Box>

          {/* Account Details */}
          <Box>
            <h3 className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
              Account Details
            </h3>
            <Grid gap={3}>
              <Box>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  Business Type
                </label>
                <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.default', textTransform: 'capitalize' })}>
                  {user.type}
                </p>
              </Box>
              <Box>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  Business Category
                </label>
                <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.default' })}>
                  {user.business_categories?.name || 'No category assigned'}
                </p>
              </Box>
              <Box>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  Subscription Status
                </label>
                <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.default', textTransform: 'capitalize' })}>
                  {user.subscription_status} - {user.subscription_tier}
                </p>
              </Box>
              <Box>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  Admin Status
                </label>
                <p className={css({ mt: 1, fontSize: 'sm', color: user.is_admin ? 'green.600' : 'fg.muted' })}>
                  {user.is_admin ? '✅ Admin User' : '👤 Regular User'}
                </p>
              </Box>
            </Grid>
          </Box>

          {/* Timestamps */}
          <Box>
            <h3 className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
              Account History
            </h3>
            <Grid gap={3}>
              <Box>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  Created
                </label>
                <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.muted' })}>
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </Box>
              <Box>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  Last Updated
                </label>
                <p className={css({ mt: 1, fontSize: 'sm', color: 'fg.muted' })}>
                  {new Date(user.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </Box>
              <Box>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                  User ID
                </label>
                <p className={css({ mt: 1, fontSize: 'xs', color: 'fg.muted', fontFamily: 'mono' })}>
                  {user.id}
                </p>
              </Box>
            </Grid>
          </Box>
        </Grid>

        <Flex gap={3} justify="flex-end" mt={6}>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              // TODO: Implement impersonate functionality
              console.log('Impersonate user:', user.id)
            }}
          >
            Impersonate User
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}