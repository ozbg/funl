'use client'

import { useEffect, useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface Alert {
  type: string
  severity: 'critical' | 'warning' | 'info'
  product_id: string
  product_name: string
  current_stock: number | null
  threshold: number | null
  batch_id?: string
  batch_name?: string
  message: string
}

interface AlertsSummary {
  total: number
  critical: number
  warning: number
  info: number
}

export function InventoryAlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState<AlertsSummary>({ total: 0, critical: 0, warning: 0, info: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    loadAlerts()
    // Refresh every 5 minutes
    const interval = setInterval(loadAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [filterType])

  const loadAlerts = async () => {
    try {
      const response = await fetch(`/api/admin/inventory/alerts?type=${filterType}`)
      const data = await response.json()
      setAlerts(data.alerts || [])
      setSummary(data.summary || { total: 0, critical: 0, warning: 0, info: 0 })
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg.default', border: 'border.default', text: 'fg.default', icon: '🔴' }
      case 'warning':
        return { bg: 'bg.default', border: 'border.default', text: 'fg.default', icon: '⚠️' }
      case 'info':
        return { bg: 'bg.default', border: 'border.default', text: 'fg.default', icon: 'ℹ️' }
      default:
        return { bg: 'bg.default', border: 'border.default', text: 'fg.default', icon: '•' }
    }
  }

  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <p className={css({ color: 'fg.muted' })}>Loading inventory alerts...</p>
      </Box>
    )
  }

  return (
    <Box>
      {/* Summary Stats */}
      <Flex gap={4} mb={6}>
        <Box flex={1} p={4} bg="bg.default" borderWidth="1px" borderColor="border.default" rounded="md">
          <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>Critical</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            {summary.critical}
          </p>
        </Box>
        <Box flex={1} p={4} bg="bg.default" borderWidth="1px" borderColor="border.default" rounded="md">
          <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>Warning</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            {summary.warning}
          </p>
        </Box>
        <Box flex={1} p={4} bg="bg.default" borderWidth="1px" borderColor="border.default" rounded="md">
          <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>Info</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default' })}>
            {summary.info}
          </p>
        </Box>
        <Box flex={1} p={4} bg="bg.default" borderWidth="1px" borderColor="border.default" rounded="md">
          <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>Total</p>
          <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'accent.default' })}>
            {summary.total}
          </p>
        </Box>
      </Flex>

      {/* Filter */}
      <Flex justify="space-between" align="center" mb={4}>
        <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
          Alerts
        </h3>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={css({
            px: 3,
            py: 2,
            fontSize: 'sm',
            bg: 'bg.default',
            borderWidth: '1px',
            borderColor: 'border.default',
            rounded: 'md',
            outline: 'none',
            cursor: 'pointer',
            _focus: {
              borderColor: 'accent.default',
              ring: '2px',
              ringColor: 'accent.default',
              ringOffset: '0'
            }
          })}
        >
          <option value="all">All Alerts</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="batch_depleting">Batch Depleting</option>
        </select>
      </Flex>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Box p={8} textAlign="center" bg="bg.default" borderWidth="1px" borderColor="border.default" rounded="md">
          <p className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'accent.default' })}>
            ✓ No inventory alerts
          </p>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 1 })}>
            All products are well-stocked
          </p>
        </Box>
      ) : (
        <Box>
          {alerts.map((alert, index) => {
            const colors = getSeverityColor(alert.severity)
            return (
              <Box
                key={index}
                mb={3}
                p={4}
                bg={colors.bg}
                borderWidth="1px"
                borderColor={colors.border}
                rounded="md"
              >
                <Flex gap={3} align="start">
                  <span className={css({ fontSize: 'lg' })}>{colors.icon}</span>
                  <Box flex={1}>
                    <Flex justify="space-between" align="start" mb={1}>
                      <p className={css({ fontSize: 'sm', fontWeight: 'semibold', color: colors.text })}>
                        {alert.message}
                      </p>
                      <span className={css({
                        px: 2,
                        py: 0.5,
                        fontSize: 'xs',
                        fontWeight: 'medium',
                        rounded: 'md',
                        color: 'fg.muted',
                        bg: 'bg.subtle',
                        textTransform: 'uppercase'
                      })}>
                        {alert.type.replace('_', ' ')}
                      </span>
                    </Flex>
                    <Flex gap={4} mt={2}>
                      <p className={css({ fontSize: 'xs', color: colors.text })}>
                        Product: {alert.product_name}
                      </p>
                      {alert.batch_name && (
                        <p className={css({ fontSize: 'xs', color: colors.text })}>
                          Batch: {alert.batch_name}
                        </p>
                      )}
                      {alert.current_stock !== null && (
                        <p className={css({ fontSize: 'xs', color: colors.text })}>
                          Stock: {alert.current_stock}
                          {alert.threshold && ` (threshold: ${alert.threshold})`}
                        </p>
                      )}
                    </Flex>
                  </Box>
                </Flex>
              </Box>
            )
          })}
        </Box>
      )}

      {/* Refresh Button */}
      <Flex justify="center" mt={4}>
        <button
          onClick={loadAlerts}
          className={css({
            px: 4,
            py: 2,
            fontSize: 'sm',
            fontWeight: 'medium',
            color: 'accent.default',
            cursor: 'pointer',
            _hover: { textDecoration: 'underline' }
          })}
        >
          Refresh Alerts
        </button>
      </Flex>
    </Box>
  )
}
