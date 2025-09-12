'use client'

import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'

interface DeviceBreakdownProps {
  data: { [key: string]: number }
  loading?: boolean
}

export default function DeviceBreakdown({ data, loading = false }: DeviceBreakdownProps) {
  if (loading) {
    return (
      <Box bg="bg.default" p={6} boxShadow="sm">
        <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'fg.default', mb: 4 })}>
          Device Breakdown
        </h2>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>Loading...</p>
      </Box>
    )
  }

  const total = Object.values(data).reduce((sum, value) => sum + value, 0)
  const devices = Object.entries(data).sort(([,a], [,b]) => b - a)

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return '📱'
      case 'desktop':
        return '💻'
      case 'tablet':
        return '📱'
      default:
        return '📊'
    }
  }

  const getDeviceColor = (device: string, index: number) => {
    const colors = ['mint.500', 'mint.400', 'mint.600', 'mint.300', 'mint.700']
    return colors[index % colors.length]
  }

  return (
    <Box bg="bg.default" p={6} boxShadow="sm">
      <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'fg.default', mb: 4 })}>
        Device Breakdown
      </h2>
      
      {total > 0 ? (
        <div>
          {/* Pie chart representation using bars */}
          <Box mb={6}>
            <div className={css({ display: 'flex', w: 'full', h: 4, borderRadius: 'full', overflow: 'hidden', bg: 'gray.100' })}>
              {devices.map(([device, count], index) => {
                const percentage = (count / total) * 100
                return (
                  <div
                    key={device}
                    className={css({ 
                      height: 'full',
                      transition: 'all 0.3s ease'
                    })}
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: `var(--colors-${getDeviceColor(device, index).replace('.', '-')})`
                    }}
                  />
                )
              })}
            </div>
          </Box>

          {/* Device list */}
          <div className={css({ space: '3' })}>
            {devices.map(([device, count], index) => {
              const percentage = Math.round((count / total) * 100)
              return (
                <Flex key={device} align="center" justify="space-between" py={2}>
                  <Flex align="center" gap={3}>
                    <span className={css({ fontSize: 'lg' })}>
                      {getDeviceIcon(device)}
                    </span>
                    <Box>
                      <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', textTransform: 'capitalize' })}>
                        {device}
                      </p>
                      <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                        {count} scans
                      </p>
                    </Box>
                  </Flex>
                  
                  <Box textAlign="right">
                    <p className={css({ fontSize: 'sm', fontWeight: 'bold', color: 'fg.default' })}>
                      {percentage}%
                    </p>
                  </Box>
                </Flex>
              )
            })}
          </div>
        </div>
      ) : (
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
          No device data available
        </p>
      )}
    </Box>
  )
}