'use client'

/**
 * PassKit Toggle Component
 *
 * Provides a toggle switch to enable/disable Apple Wallet Pass generation for a funnel
 */

import { useState } from 'react'
import type { Funnel } from '@/lib/types'
import { Box, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface PassKitToggleProps {
  funnel: Funnel
  onToggle: (enabled: boolean) => Promise<void>
  disabled?: boolean
}

export function PassKitToggle({ funnel, onToggle, disabled = false }: PassKitToggleProps) {
  const [isEnabled, setIsEnabled] = useState(funnel.wallet_pass_enabled || false)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    if (disabled || isLoading) return

    setIsLoading(true)
    try {
      const newState = !isEnabled
      await onToggle(newState)
      setIsEnabled(newState)
    } catch (error) {
      console.error('Failed to toggle PassKit:', error)
      alert('Failed to toggle PassKit. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      bg="bg.default"
      border="1px solid"
      borderColor="border.default"
      borderRadius="md"
      p={4}
      boxShadow="sm"
    >
      <Flex justify="space-between" align="center">
        <Box flex="1">
          <h3 className={css({
            fontSize: 'lg',
            fontWeight: 'semibold',
            color: 'fg.default',
            mb: 1
          })}>
            Apple Wallet Pass
          </h3>
          <p className={css({
            fontSize: 'sm',
            color: 'fg.muted'
          })}>
            Allow users to add this property to their Apple Wallet for quick access
          </p>
          {isEnabled && (
            <Flex align="center" mt={2} gap={1}>
              <svg
                className={css({ width: 4, height: 4 })}
                fill="green"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className={css({ fontSize: 'sm', color: 'green' })}>
                Wallet passes enabled
              </span>
            </Flex>
          )}
        </Box>

        <Flex align="center" gap={2}>
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled || isLoading}
            className={css({
              position: 'relative',
              display: 'inline-flex',
              height: '24px',
              width: '44px',
              alignItems: 'center',
              borderRadius: 'full',
              transition: 'all 0.2s',
              cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
              opacity: disabled || isLoading ? 0.5 : 1,
              bg: isEnabled ? 'blue.600' : 'gray.300',
              '&:focus': {
                outline: 'none',
                ring: '2px',
                ringColor: 'blue.500',
                ringOffset: '2px'
              }
            })}
          >
            <span className={css({ srOnly: true })}>
              {isEnabled ? 'Disable' : 'Enable'} Apple Wallet Pass
            </span>
            <span
              className={css({
                display: 'inline-block',
                height: '16px',
                width: '16px',
                borderRadius: 'full',
                bg: 'white',
                transition: 'transform 0.2s',
                transform: isEnabled ? 'translateX(24px)' : 'translateX(4px)'
              })}
            />
          </button>

          {isLoading && (
            <Box>
              <svg
                className={css({
                  animation: 'spin 1s linear infinite',
                  height: 4,
                  width: 4
                })}
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
          )}
        </Flex>
      </Flex>
    </Box>
  )
}
