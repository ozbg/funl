'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

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
              className={css({ w: 10, h: 10, color: 'blue.600' })}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </Box>
        </Flex>

        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default', mb: 3 })}>
          Check your email
        </h1>

        <p className={css({ fontSize: 'md', color: 'fg.muted', mb: 6, lineHeight: '1.6' })}>
          We&apos;ve sent a confirmation link to{' '}
          {email && <strong className={css({ color: 'fg.default' })}>{email}</strong>}
          {!email && 'your email address'}.
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
            <li>Open the email from FunL</li>
            <li>Click the confirmation link</li>
            <li>You&apos;ll be redirected back to complete your setup</li>
          </ol>
        </Box>

        <Box mb={6}>
          <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 2 })}>
            Didn&apos;t receive the email?
          </p>
          <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
            Check your spam folder or{' '}
            <Link
              href="/signup"
              className={css({ color: 'accent.default', textDecoration: 'underline', _hover: { color: 'accent.emphasized' } })}
            >
              try signing up again
            </Link>
          </p>
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
