'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

export default function EmailConfirmedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const confirmEmail = async () => {
      const supabase = createClient()

      // Get the hash from the URL (Supabase sends email link with #access_token=...)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          setError(error.message)
          setIsProcessing(false)
          return
        }

        if (data.user) {
          // Update email_confirmed_at timestamp
          const { error: updateError } = await supabase
            .from('businesses')
            .update({ email_confirmed_at: new Date().toISOString() })
            .eq('id', data.user.id)

          if (updateError) {
            console.error('Error updating email confirmation:', updateError)
          }

          setIsProcessing(false)
          // Redirect to plan selection after 2 seconds
          setTimeout(() => {
            router.push('/select-plan')
          }, 2000)
        }
      } else {
        setError('Invalid confirmation link')
        setIsProcessing(false)
      }
    }

    confirmEmail()
  }, [router, searchParams])

  if (error) {
    return (
      <Box bg="bg.default" py={12} px={4}>
        <Box mx="auto" maxW="md" textAlign="center">
          <Flex justify="center" mb={6}>
            <Box
              w={16}
              h={16}
              rounded="full"
              bg="red.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <svg
                className={css({ w: 10, h: 10, color: 'red.600' })}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Box>
          </Flex>

          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default', mb: 3 })}>
            Confirmation failed
          </h1>

          <p className={css({ fontSize: 'md', color: 'fg.muted', mb: 6 })}>
            {error}
          </p>

          <a
            href="/signup"
            className={css({
              display: 'inline-block',
              px: 6,
              py: 3,
              bg: 'accent.default',
              color: 'white',
              fontSize: 'sm',
              fontWeight: 'medium',
              rounded: 'md',
              _hover: { bg: 'accent.emphasized' }
            })}
          >
            Try signing up again
          </a>
        </Box>
      </Box>
    )
  }

  if (isProcessing) {
    return (
      <Box bg="bg.default" py={12} px={4}>
        <Box mx="auto" maxW="md" textAlign="center">
          <Flex justify="center" mb={6}>
            <Box
              w={16}
              h={16}
              rounded="full"
              bg="blue.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <svg
                className={css({ w: 10, h: 10, color: 'blue.600', animation: 'spin 1s linear infinite' })}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className={css({ opacity: 0.25 })}
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className={css({ opacity: 0.75 })}
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </Box>
          </Flex>

          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default', mb: 3 })}>
            Confirming your email...
          </h1>
        </Box>
      </Box>
    )
  }

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
          Email confirmed!
        </h1>

        <p className={css({ fontSize: 'md', color: 'fg.muted', mb: 6 })}>
          Your email has been successfully confirmed. Redirecting you to select your plan...
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
