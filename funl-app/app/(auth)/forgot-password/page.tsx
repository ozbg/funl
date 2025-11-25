'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack } from '@/styled-system/jsx'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSubmitted(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
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
            Check your email
          </h1>

          <p className={css({ fontSize: 'md', color: 'fg.muted', mb: 6, lineHeight: '1.6' })}>
            We&apos;ve sent password reset instructions to <strong>{email}</strong>
          </p>

          <Box
            bg="bg.subtle"
            border="1px solid"
            borderColor="border.default"
            rounded="md"
            p={4}
            mb={6}
            textAlign="left"
          >
            <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
              Next steps:
            </h3>
            <ol className={css({ fontSize: 'sm', color: 'fg.muted', lineHeight: '1.8', pl: 4, listStyleType: 'decimal' })}>
              <li>Check your email inbox</li>
              <li>Click the reset password link</li>
              <li>Enter your new password</li>
            </ol>
          </Box>

          <Link
            href="/login"
            className={css({
              display: 'inline-block',
              fontSize: 'sm',
              color: 'accent.default',
              _hover: { color: 'accent.emphasized' }
            })}
          >
            ← Back to login
          </Link>
        </Box>
      </Box>
    )
  }

  return (
    <Box bg="bg.default" py={8} px={4} boxShadow="md">
      <Box mx={{ sm: 'auto' }} w={{ sm: 'full' }} maxW={{ sm: 'md' }}>
        <h2 className={css({ textAlign: 'center', fontSize: '3xl', fontWeight: 'extrabold', color: 'fg.default' })}>
          Reset your password
        </h2>
        <p className={css({ mt: 2, textAlign: 'center', fontSize: 'sm', color: 'fg.muted' })}>
          Enter your email and we&apos;ll send you a link to reset your password
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
              htmlFor="email"
              className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? 'Sending...' : 'Send reset link'}
          </button>

          <Flex justify="center">
            <Link
              href="/login"
              className={css({ fontSize: 'sm', colorPalette: 'mint', color: 'colorPalette.default', _hover: { color: 'colorPalette.emphasized' } })}
            >
              ← Back to login
            </Link>
          </Flex>
        </Stack>
      </form>
    </Box>
  )
}
