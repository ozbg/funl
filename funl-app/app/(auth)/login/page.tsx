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
    <Box bg="bg.default" py={8} px={4} boxShadow="md" borderRadius={{ sm: 'lg' }}>
      <Box mx={{ sm: 'auto' }} w={{ sm: 'full' }} maxW={{ sm: 'md' }}>
        <h2 className={css({ textAlign: 'center', fontSize: '3xl', fontWeight: 'extrabold', color: 'fg.default' })}>
          Sign in to FunL
        </h2>
        <p className={css({ mt: 2, textAlign: 'center', fontSize: 'sm', color: 'fg.muted' })}>
          Or{' '}
          <Link 
            href="/signup" 
            className={css({ fontWeight: 'medium', color: 'accent.default', _hover: { color: 'accent.emphasis' } })}
          >
            create a new account
          </Link>
        </p>
      </Box>

      <form className={css({ mt: 8 })} onSubmit={handleLogin}>
        <Stack gap={6}>
          {error && (
            <Box borderRadius="md" bg="red.50" p={4}>
              <p className={css({ fontSize: 'sm', color: 'red.800' })}>{error}</p>
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
                borderRadius: 'md',
                boxShadow: 'sm',
                bg: 'bg.default',
                color: 'fg.default',
                _focus: {
                  outline: 'none',
                  ringWidth: '2px',
                  ringColor: 'accent.default',
                  borderColor: 'accent.default',
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
                borderRadius: 'md',
                boxShadow: 'sm',
                bg: 'bg.default',
                color: 'fg.default',
                _focus: {
                  outline: 'none',
                  ringWidth: '2px',
                  ringColor: 'accent.default',
                  borderColor: 'accent.default',
                },
              })}
            />
          </Box>

          <Flex justify="space-between" align="center">
            <Link
              href="/forgot-password"
              className={css({ fontSize: 'sm', color: 'accent.default', _hover: { color: 'accent.emphasis' } })}
            >
              Forgot your password?
            </Link>
          </Flex>

          <button
            type="submit"
            disabled={loading}
            className={css({
              w: 'full',
              display: 'flex',
              justify: 'center',
              py: 2,
              px: 4,
              borderWidth: '1px',
              borderColor: 'transparent',
              borderRadius: 'md',
              boxShadow: 'sm',
              fontSize: 'sm',
              fontWeight: 'medium',
              color: 'white',
              bg: 'accent.default',
              cursor: 'pointer',
              _hover: {
                bg: 'accent.emphasis',
              },
              _focus: {
                outline: 'none',
                ringWidth: '2px',
                ringOffset: '2px',
                ringColor: 'accent.default',
              },
              _disabled: {
                opacity: 0.5,
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