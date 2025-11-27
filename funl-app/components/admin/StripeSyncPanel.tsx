'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { Button } from '@/components/ui/button'

interface StripeSyncPanelProps {
  batchId: string
  stripeProductId?: string | null
  stripePriceId?: string | null
}

export function StripeSyncPanel({ batchId, stripeProductId, stripePriceId }: StripeSyncPanelProps) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setSyncStatus('idle')
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/admin/stripe/sync-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed')
      }

      setSyncStatus('success')
      router.refresh()
    } catch (error) {
      console.error('Stripe sync error:', error)
      setSyncStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleRemoveSync = async () => {
    if (!confirm('Remove Stripe sync? This will not delete the Stripe product, only the link.')) {
      return
    }

    setSyncing(true)
    setSyncStatus('idle')
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/admin/stripe/sync-product`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove sync')
      }

      setSyncStatus('success')
      router.refresh()
    } catch (error) {
      console.error('Error removing sync:', error)
      setSyncStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to remove sync')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Box p={6} bg="bg.default" rounded="lg" boxShadow="sm" borderWidth="1px" borderColor="border.default">
      <Flex justify="space-between" align="center" mb={4}>
        <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold' })}>
          Stripe Integration
        </h3>
        {stripeProductId && (
          <a
            href={`https://dashboard.stripe.com/${process.env.NEXT_PUBLIC_STRIPE_MODE === 'live' ? '' : 'test/'}products/${stripeProductId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={css({
              px: 3,
              py: 1,
              bg: 'bg.muted',
              color: 'fg.default',
              rounded: 'md',
              fontSize: 'xs',
              fontWeight: 'medium',
              textDecoration: 'none',
              _hover: { bg: 'bg.subtle' }
            })}
          >
            View in Stripe →
          </a>
        )}
      </Flex>

      {stripeProductId ? (
        <Box>
          <p className={css({ fontSize: 'sm', color: 'green.text', mb: 2, fontWeight: 'medium' })}>
            ✅ Synced to Stripe
          </p>
          <Box p={3} bg="bg.subtle" rounded="md" mb={3} borderWidth="1px" borderColor="border.default">
            <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>
              Product ID:
            </p>
            <p className={css({ fontSize: 'sm', fontFamily: 'mono', color: 'fg.default', wordBreak: 'break-all' })}>
              {stripeProductId}
            </p>
            {stripePriceId && (
              <>
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1, mt: 2 })}>
                  Price ID:
                </p>
                <p className={css({ fontSize: 'sm', fontFamily: 'mono', color: 'fg.default', wordBreak: 'break-all' })}>
                  {stripePriceId}
                </p>
              </>
            )}
          </Box>
          <Flex gap={2}>
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="solid"
              size="sm"
              className={css({
                bg: 'accent.default',
                _hover: { bg: 'accent.emphasized' }
              })}
            >
              {syncing ? 'Syncing...' : 'Re-sync to Stripe'}
            </Button>
            <Button
              onClick={handleRemoveSync}
              disabled={syncing}
              variant="outline"
              size="sm"
              className={css({
                color: 'red.text',
                borderColor: 'red.default',
                _hover: { bg: 'red.subtle' }
              })}
            >
              Remove Sync
            </Button>
          </Flex>
        </Box>
      ) : (
        <Box>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 3 })}>
            This batch is not synced to Stripe. Sync it to enable payment processing.
          </p>
          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="solid"
            size="sm"
          >
            {syncing ? 'Creating...' : 'Create Stripe Product'}
          </Button>
        </Box>
      )}

      {syncStatus === 'success' && (
        <Box mt={3} p={3} bg="green.subtle" borderWidth="1px" borderColor="green.default" rounded="md">
          <p className={css({ fontSize: 'sm', color: 'green.text' })}>
            ✅ Sync successful
          </p>
        </Box>
      )}

      {syncStatus === 'error' && (
        <Box mt={3} p={3} bg="red.subtle" borderWidth="1px" borderColor="red.default" rounded="md">
          <p className={css({ fontSize: 'sm', color: 'red.text' })}>
            ❌ {errorMessage || 'Sync failed. Check console for details.'}
          </p>
        </Box>
      )}
    </Box>
  )
}
