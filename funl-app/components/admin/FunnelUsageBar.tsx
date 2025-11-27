import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface FunnelUsageBarProps {
  current: number
  limit: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function FunnelUsageBar({
  current,
  limit,
  size = 'md',
  showLabel = true
}: FunnelUsageBarProps) {
  const percentage = Math.min((current / limit) * 100, 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  const heightMap = {
    sm: '1',
    md: '2',
    lg: '3'
  }

  const getColor = () => {
    if (isAtLimit) return 'fg.muted'
    if (isNearLimit) return 'fg.default'
    return 'accent.default'
  }

  return (
    <Box w="full">
      {showLabel && (
        <Flex justify="space-between" mb={1}>
          <span className={css({ fontSize: 'sm', color: 'fg.default', fontWeight: 'medium' })}>
            Funnel Usage
          </span>
          <span className={css({
            fontSize: 'sm',
            color: isAtLimit ? 'fg.muted' : 'fg.muted',
            fontWeight: isAtLimit ? 'semibold' : 'normal'
          })}>
            {current} / {limit}
          </span>
        </Flex>
      )}
      <Box
        w="full"
        h={heightMap[size]}
        bg="gray.200"
        rounded="full"
        overflow="hidden"
      >
        <Box
          h="full"
          w={`${percentage}%`}
          bg={getColor()}
          transition="all 0.3s ease"
        />
      </Box>
    </Box>
  )
}
