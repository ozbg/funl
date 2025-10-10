'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'

export function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if impersonation is active by checking cookie AND verifying session exists
    const checkImpersonation = async () => {
      const cookies = document.cookie.split(';')
      const impersonationCookie = cookies.find(c => c.trim().startsWith('impersonation-active='))
      const hasImpersonationCookie = impersonationCookie?.includes('true') || false

      if (!hasImpersonationCookie) {
        setIsImpersonating(false)
        return
      }

      // Also verify user is actually logged in
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      // Only show banner if cookie is set AND user has active session
      setIsImpersonating(hasImpersonationCookie && !!session)
    }

    checkImpersonation()

    // Check every 2 seconds in case cookie changes
    const interval = setInterval(checkImpersonation, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleStopImpersonation = async () => {
    setIsStopping(true)
    try {
      const supabase = createClient()

      const response = await fetch('/api/admin/stop-impersonation', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop impersonation')
      }

      // Sign out the impersonated user
      await supabase.auth.signOut()

      // Redirect to login page (admin will need to sign in again)
      window.location.href = '/login?message=impersonation_ended'
    } catch (error) {
      console.error('Error stopping impersonation:', error)
      alert(error instanceof Error ? error.message : 'Failed to stop impersonation')
      setIsStopping(false)
    }
  }

  if (!isImpersonating) {
    return null
  }

  return (
    <Box
      bg="red.600"
      color="white"
      py={1.5}
      px={4}
      boxShadow="sm"
    >
      <Flex justify="space-between" align="center" maxW="7xl" mx="auto" gap={4}>
        <Flex align="center" gap={2} flex="1" minW={0}>
          <Box
            className={css({
              w: 2,
              h: 2,
              borderRadius: 'full',
              bg: 'white',
              animation: 'pulse 2s infinite',
              flexShrink: 0
            })}
          />
          <Box fontWeight="medium" fontSize="xs" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
            ⚠️ Impersonating user
          </Box>
        </Flex>
        <Button
          size="xs"
          variant="solid"
          onClick={handleStopImpersonation}
          disabled={isStopping}
          className={css({
            bg: 'white',
            color: 'red.600',
            border: '1px solid',
            borderColor: 'red.700',
            fontSize: 'xs',
            fontWeight: 'semibold',
            px: 3,
            py: 1,
            flexShrink: 0,
            _hover: { bg: 'red.50', borderColor: 'red.800' },
            _disabled: { opacity: 0.6, cursor: 'not-allowed' }
          })}
        >
          {isStopping ? 'Stopping...' : 'Exit'}
        </Button>
      </Flex>
    </Box>
  )
}
