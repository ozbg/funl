'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    phone: '',
    businessCategoryId: '',
  })
  const [businessCategories, setBusinessCategories] = useState<Array<{id: string, name: string, created_at: string, updated_at: string | null}>>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: categories } = await supabase
        .from('business_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      
      if (categories) {
        setBusinessCategories(categories)
      }
    }

    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Use the API route for signup
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          businessName: formData.businessName,
          phone: formData.phone,
          businessCategoryId: formData.businessCategoryId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      // Refresh the session
      await supabase.auth.getSession()
      
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const inputStyles = css({
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
  })

  return (
    <Box bg="bg.default" py={8} px={4} boxShadow="md">
      <Box mx={{ sm: 'auto' }} w={{ sm: 'full' }} maxW={{ sm: 'md' }}>
        <h2 className={css({ textAlign: 'center', fontSize: '3xl', fontWeight: 'extrabold', color: 'fg.default' })}>
          Create your funl account
        </h2>
        <p className={css({ mt: 2, textAlign: 'center', fontSize: 'sm', color: 'fg.muted' })}>
          Or{' '}
          <Link 
            href="/login" 
            className={css({ fontWeight: 'medium', colorPalette: 'mint', color: 'colorPalette.default', _hover: { color: 'colorPalette.emphasized' } })}
          >
            sign in to existing account
          </Link>
        </p>
      </Box>

      <form className={css({ mt: 8, colorPalette: 'mint' })} onSubmit={handleSignup}>
        <Stack gap={6}>
          {error && (
            <Box colorPalette="red" bg="colorPalette.default" p={4}>
              <p className={css({ colorPalette: 'red', fontSize: 'sm', color: 'colorPalette.fg' })}>{error}</p>
            </Box>
          )}

          <Box>
            <label 
              htmlFor="businessName" 
              className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}
            >
              Business Name
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              required
              value={formData.businessName}
              onChange={handleChange}
              className={inputStyles}
            />
          </Box>

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
              value={formData.email}
              onChange={handleChange}
              className={inputStyles}
            />
          </Box>

          <Box>
            <label 
              htmlFor="phone" 
              className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}
            >
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className={inputStyles}
            />
          </Box>

          <Box>
            <label 
              htmlFor="businessCategoryId" 
              className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}
            >
              Business Category
            </label>
            <select
              id="businessCategoryId"
              name="businessCategoryId"
              value={formData.businessCategoryId}
              onChange={(e) => setFormData({ ...formData, businessCategoryId: e.target.value })}
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
            >
              <option value="">Select your business type</option>
              {businessCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className={css({ mt: 1, fontSize: 'xs', color: 'fg.muted' })}>
              This helps us show you relevant funnel types and QR code styles
            </p>
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
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className={inputStyles}
            />
          </Box>

          <Box>
            <label 
              htmlFor="confirmPassword" 
              className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className={inputStyles}
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </Stack>
      </form>
    </Box>
  )
}