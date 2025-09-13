'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack } from '@/styled-system/jsx'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box bg="bg.default" py={8} px={4} boxShadow="md">
      <Box mx={{ sm: 'auto' }} w={{ sm: 'full' }} maxW={{ sm: 'md' }}>
        <h2 className={css({ textAlign: 'center', fontSize: '3xl', fontWeight: 'extrabold', color: 'fg.default' })}>
          Sign in to funl
        </h2>
        <p className={css({ mt: 2, textAlign: 'center', fontSize: 'sm', color: 'fg.muted' })}>
          Or{' '}
          <Link 
            href="/signup" 
            className={css({ fontWeight: 'medium', colorPalette: 'mint', color: 'colorPalette.default', _hover: { color: 'colorPalette.emphasized' } })}
          >
            create a new account
          </Link>
        </p>
      </Box>

      <form className={css({ mt: 8, colorPalette: 'mint' })} onSubmit={handleLogin}>
        <Stack gap={6}>
          {error && (
            <Box colorPalette="red" bg="colorPalette.default" p={4}>
              <p className={css({ colorPalette: 'red', fontSize: 'sm', color: 'colorPalette.fg' })}>{error}</p>
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
                _focus: {
                  outline: 'none',
                  ringWidth: '2',
                  ringColor: 'colorPalette.default',
                  borderColor: 'colorPalette.default',
                },
              })}
            />
          </Box>

          <Box>
            <label 
              htmlFor="password" 
              className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
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
                _focus: {
                  outline: 'none',
                  ringWidth: '2',
                  ringColor: 'colorPalette.default',
                  borderColor: 'colorPalette.default',
                },
              })}
            />
          </Box>

          <Flex justify="space-between" align="center">
            <Link
              href="/forgot-password"
              className={css({ fontSize: 'sm', colorPalette: 'mint', color: 'colorPalette.default', _hover: { color: 'colorPalette.emphasized' } })}
            >
              Forgot your password?
            </Link>
          </Flex>

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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </Stack>
      </form>
    </Box>
  )
}