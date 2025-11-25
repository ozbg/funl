'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack } from '@/styled-system/jsx'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Check if we have an access token from the email link
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')

    if (!accessToken) {
      setError('Invalid or expired reset link. Please request a new one.')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Box bg="bg.default" py={12} px={4}>
        <Box mx="auto" maxW="md" textAlign="center">
          <Flex justify="center" mb={6}>
            <Box
              w={16}
              h={16}
              rounded="full"
              bg="green.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <svg
                className={css({ w: 10, h: 10, color: 'green.600' })}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </Box>
          </Flex>

          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default', mb: 3 })}>
            Password updated!
          </h1>

          <p className={css({ fontSize: 'md', color: 'fg.muted', mb: 6 })}>
            Your password has been successfully reset. Redirecting you to login...
          </p>

          <Box
            className={css({
              display: 'inline-block',
              w: 8,
              h: 8,
              border: '2px solid',
              borderColor: 'accent.default',
              borderTopColor: 'transparent',
              rounded: 'full',
              animation: 'spin 1s linear infinite'
            })}
          />
        </Box>
      </Box>
    )
  }

  return (
    <Box bg="bg.default" py={8} px={4} boxShadow="md">
      <Box mx={{ sm: 'auto' }} w={{ sm: 'full' }} maxW={{ sm: 'md' }}>
        <h2 className={css({ textAlign: 'center', fontSize: '3xl', fontWeight: 'extrabold', color: 'fg.default' })}>
          Set new password
        </h2>
        <p className={css({ mt: 2, textAlign: 'center', fontSize: 'sm', color: 'fg.muted' })}>
          Enter your new password below
        </p>
      </Box>

      <form className={css({ mt: 8, colorPalette: 'mint' })} onSubmit={handleSubmit}>
        <Stack gap={6}>
          {error && (
            <Box bg="bg.subtle" borderWidth="1px" borderColor="red.600" borderLeftWidth="3px" rounded="md" p={3}>
              <Flex gap={2} align="start">
                <span className={css({ color: 'red.600', fontSize: 'sm', fontWeight: 'semibold' })}>⚠</span>
                <p className={css({ fontSize: 'sm', color: 'fg.default', flex: 1 })}>{error}</p>
              </Flex>
            </Box>
          )}

          <Box>
            <label
              htmlFor="password"
              className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={css({
                mt: 1,
                display: 'block',
                w: 'full',
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                boxShadow: 'sm',
                bg: 'bg.default',
                color: 'fg.default',
                rounded: 'md',
                _focus: {
                  outline: 'none',
                  ringWidth: '2',
                  ringColor: 'colorPalette.default',
                  borderColor: 'colorPalette.default',
                },
              })}
            />
            <p className={css({ mt: 1, fontSize: 'xs', color: 'fg.muted' })}>
              Must be at least 6 characters
            </p>
          </Box>

          <Box>
            <label
              htmlFor="confirmPassword"
              className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}
            >
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={css({
                mt: 1,
                display: 'block',
                w: 'full',
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                boxShadow: 'sm',
                bg: 'bg.default',
                color: 'fg.default',
                rounded: 'md',
                _focus: {
                  outline: 'none',
                  ringWidth: '2',
                  ringColor: 'colorPalette.default',
                  borderColor: 'colorPalette.default',
                },
              })}
            />
          </Box>

          <button
            type="submit"
            disabled={loading}
            className={css({
              colorPalette: 'mint',
              w: 'full',
              display: 'flex',
              justifyContent: 'center',
              py: 2,
              px: 4,
              borderWidth: '1px',
              borderColor: 'transparent',
              boxShadow: 'sm',
              fontSize: 'sm',
              fontWeight: 'medium',
              color: 'colorPalette.fg',
              bg: 'colorPalette.default',
              rounded: 'md',
              cursor: 'pointer',
              _hover: {
                bg: 'colorPalette.emphasized',
              },
              _focus: {
                outline: 'none',
                ringWidth: '2',
                ringOffset: '2',
                ringColor: 'colorPalette.default',
              },
              _disabled: {
                opacity: 'disabled',
                cursor: 'not-allowed',
              },
            })}
          >
            {loading ? 'Updating password...' : 'Reset password'}
          </button>
        </Stack>
      </form>
    </Box>
  )
}
