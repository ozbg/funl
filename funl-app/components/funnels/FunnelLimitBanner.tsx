'use client'

import { useEffect, useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import Link from 'next/link'

interface FunnelLimitInfo {
  can_create: boolean
  current_count: number
  limit: number
  plan: string
  upgrade_url: string
}

export function FunnelLimitBanner() {
  const [limitInfo, setLimitInfo] = useState<FunnelLimitInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLimitInfo = async () => {
      try {
        const response = await fetch('/api/funnels/can-create')
        if (response.ok) {
          const data = await response.json()
          setLimitInfo(data)
        }
      } catch (error) {
        console.error('Error fetching funnel limit info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLimitInfo()
  }, [])

  if (isLoading || !limitInfo) {
    return null
  }

  const usagePercentage = (limitInfo.current_count / limitInfo.limit) * 100
  const isNearLimit = usagePercentage >= 80
  const isAtLimit = !limitInfo.can_create

  if (!isNearLimit && !isAtLimit) {
    return null
  }

  return (
    <Box
      bg={isAtLimit ? 'red.50' : 'orange.50'}
      borderWidth="1px"
      borderColor={isAtLimit ? 'red.200' : 'orange.200'}
      rounded="lg"
      p={4}
      mb={6}
    >
      <Flex justify="space-between" align="center">
        <Box>
          <p
            className={css({
              fontSize: 'sm',
              fontWeight: 'semibold',
              color: isAtLimit ? 'red.900' : 'orange.900',
              mb: 1,
            })}
          >
            {isAtLimit ? 'Funnel Limit Reached' : 'Approaching Funnel Limit'}
          </p>
          <p className={css({ fontSize: 'sm', color: isAtLimit ? 'red.800' : 'orange.800' })}>
            You&apos;ve used {limitInfo.current_count} of {limitInfo.limit} funnels on your{' '}
            {limitInfo.plan} plan.{' '}
            {isAtLimit
              ? 'Upgrade or purchase additional funnels to create more.'
              : 'Consider upgrading or purchasing additional funnels.'}
          </p>
        </Box>

        <Link
          href={limitInfo.upgrade_url}
          className={css({
            px: 4,
            py: 2,
            bg: isAtLimit ? 'red.600' : 'orange.600',
            color: 'white',
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'medium',
            whiteSpace: 'nowrap',
            _hover: { bg: isAtLimit ? 'red.700' : 'orange.700' },
          })}
        >
          {isAtLimit ? 'Upgrade Now' : 'View Plans'}
        </Link>
      </Flex>

      {/* Progress Bar */}
      <Box mt={3} bg="gray.200" rounded="full" height="6px" overflow="hidden">
        <Box
          bg={isAtLimit ? 'red.500' : 'orange.500'}
          height="100%"
          width={`${Math.min(usagePercentage, 100)}%`}
          transition="width 0.3s"
        />
      </Box>
    </Box>
  )
}
