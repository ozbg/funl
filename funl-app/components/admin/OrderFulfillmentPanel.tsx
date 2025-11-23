'use client'

import { useState } from 'react'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface Order {
  id: string
  order_number: string
  business_id: string
  items: Array<{
    batch_id: string
    batch_name: string
    quantity: number
    size: string
    unit_price: number
    total_price: number
    style: {
      name: string
    }
  }>
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: string
  payment_status: string
  created_at: string
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  tracking_number: string | null
  shipping_address: {
    full_name: string
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code: string
    country: string
    phone?: string
  }
  business: {
    id: string
    name: string
    email: string
  }
}

interface OrderFulfillmentPanelProps {
  order: Order
  onClose: () => void
  onSuccess: () => void
}

export function OrderFulfillmentPanel({ order, onClose, onSuccess }: OrderFulfillmentPanelProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '')
  const [notes, setNotes] = useState('')

  const handleFulfill = async (action: 'ship' | 'deliver') => {
    try {
      setProcessing(true)
      setError(null)

      const response = await fetch(`/api/admin/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          tracking_number: trackingNumber || undefined,
          notes: notes || undefined
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update order')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Box
      position="fixed"
      top={0}
      right={0}
      bottom={0}
      w={{ base: 'full', md: '600px' }}
      bg="bg.default"
      borderLeftWidth="1px"
      borderColor="border.default"
      zIndex={50}
      overflowY="auto"
      boxShadow="lg"
    >
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        p={6}
        borderBottomWidth="1px"
        borderColor="border.default"
        bg="bg.subtle"
      >
        <h2 className={css({ fontSize: 'xl', fontWeight: 'bold' })}>
          Order {order.order_number}
        </h2>
        <button
          onClick={onClose}
          className={css({
            fontSize: 'xl',
            color: 'fg.muted',
            cursor: 'pointer',
            _hover: { color: 'fg.default' }
          })}
        >
          ×
        </button>
      </Flex>

      <Box p={6}>
        {error && (
          <Box mb={4} p={3} bg="red.subtle" borderWidth="1px" borderColor="red.default" rounded="md">
            <p className={css({ fontSize: 'sm', color: 'red.text' })}>{error}</p>
          </Box>
        )}

        {/* Status Summary */}
        <Box mb={6} p={4} bg="bg.subtle" rounded="lg">
          <Grid gridTemplateColumns="2" gap={4}>
            <Box>
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>Payment Status</p>
              <p className={css({ fontSize: 'sm', fontWeight: 'semibold', textTransform: 'capitalize' })}>
                {order.payment_status}
              </p>
            </Box>
            <Box>
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>Order Status</p>
              <p className={css({ fontSize: 'sm', fontWeight: 'semibold', textTransform: 'capitalize' })}>
                {order.status}
              </p>
            </Box>
            <Box>
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>Created</p>
              <p className={css({ fontSize: 'sm' })}>{formatDate(order.created_at)}</p>
            </Box>
            <Box>
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>Paid</p>
              <p className={css({ fontSize: 'sm' })}>{formatDate(order.paid_at)}</p>
            </Box>
          </Grid>
        </Box>

        {/* Customer Info */}
        <Box mb={6}>
          <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 3 })}>Customer</h3>
          <Box p={4} bg="bg.subtle" rounded="md">
            <p className={css({ fontWeight: 'medium' })}>{order.business.name}</p>
            <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>{order.business.email}</p>
          </Box>
        </Box>

        {/* Shipping Address */}
        <Box mb={6}>
          <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 3 })}>Shipping Address</h3>
          <Box p={4} bg="bg.subtle" rounded="md">
            <p className={css({ fontWeight: 'medium' })}>{order.shipping_address.full_name}</p>
            <p className={css({ fontSize: 'sm', mt: 1 })}>{order.shipping_address.address_line1}</p>
            {order.shipping_address.address_line2 && (
              <p className={css({ fontSize: 'sm' })}>{order.shipping_address.address_line2}</p>
            )}
            <p className={css({ fontSize: 'sm' })}>
              {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
            </p>
            <p className={css({ fontSize: 'sm' })}>{order.shipping_address.country}</p>
            {order.shipping_address.phone && (
              <p className={css({ fontSize: 'sm', mt: 2, color: 'fg.muted' })}>
                Phone: {order.shipping_address.phone}
              </p>
            )}
          </Box>
        </Box>

        {/* Order Items */}
        <Box mb={6}>
          <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 3 })}>Items</h3>
          <Box borderWidth="1px" borderColor="border.default" rounded="md">
            {order.items.map((item, idx) => (
              <Flex
                key={idx}
                justify="space-between"
                p={4}
                borderBottomWidth={idx < order.items.length - 1 ? '1px' : '0'}
                borderColor="border.default"
              >
                <Box>
                  <p className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                    {item.batch_name} - {item.size}
                  </p>
                  <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                    {item.style.name} × {item.quantity}
                  </p>
                  <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                    ${item.unit_price.toFixed(2)} each
                  </p>
                </Box>
                <Box textAlign="right">
                  <p className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                    ${item.total_price.toFixed(2)}
                  </p>
                </Box>
              </Flex>
            ))}
          </Box>
        </Box>

        {/* Order Total */}
        <Box mb={6} p={4} bg="bg.subtle" rounded="md">
          <Flex justify="space-between" mb={2}>
            <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Subtotal</span>
            <span className={css({ fontSize: 'sm' })}>${order.subtotal.toFixed(2)}</span>
          </Flex>
          <Flex justify="space-between" mb={2}>
            <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Tax</span>
            <span className={css({ fontSize: 'sm' })}>${order.tax.toFixed(2)}</span>
          </Flex>
          <Flex justify="space-between" mb={2} pb={2} borderBottomWidth="1px" borderColor="border.default">
            <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Shipping</span>
            <span className={css({ fontSize: 'sm' })}>${order.shipping.toFixed(2)}</span>
          </Flex>
          <Flex justify="space-between">
            <span className={css({ fontSize: 'lg', fontWeight: 'bold' })}>Total</span>
            <span className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'accent.default' })}>
              ${order.total.toFixed(2)}
            </span>
          </Flex>
        </Box>

        {/* Fulfillment Actions */}
        {order.payment_status === 'paid' && order.status !== 'delivered' && (
          <Box mb={6}>
            <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', mb: 3 })}>Fulfillment</h3>

            {order.status === 'processing' && (
              <>
                <Box mb={4}>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                    Tracking Number (optional)
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g., AU123456789"
                    className={css({
                      w: 'full',
                      px: 4,
                      py: 2,
                      borderWidth: '1px',
                      borderColor: 'border.default',
                      rounded: 'md',
                      fontSize: 'sm',
                      _focus: { outline: 'none', borderColor: 'accent.default' }
                    })}
                  />
                </Box>
                <Box mb={4}>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes about the shipment..."
                    className={css({
                      w: 'full',
                      px: 4,
                      py: 2,
                      borderWidth: '1px',
                      borderColor: 'border.default',
                      rounded: 'md',
                      fontSize: 'sm',
                      resize: 'vertical',
                      _focus: { outline: 'none', borderColor: 'accent.default' }
                    })}
                  />
                </Box>
                <button
                  onClick={() => handleFulfill('ship')}
                  disabled={processing}
                  className={css({
                    w: 'full',
                    px: 4,
                    py: 3,
                    bg: 'accent.default',
                    color: 'white',
                    rounded: 'md',
                    fontSize: 'sm',
                    fontWeight: 'semibold',
                    cursor: 'pointer',
                    _hover: { bg: 'accent.emphasized' },
                    _disabled: { opacity: 0.5, cursor: 'not-allowed' }
                  })}
                >
                  {processing ? 'Processing...' : 'Mark as Shipped'}
                </button>
              </>
            )}

            {order.status === 'shipped' && (
              <>
                {order.tracking_number && (
                  <Box mb={4} p={3} bg="bg.subtle" rounded="md">
                    <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 1 })}>Tracking Number</p>
                    <p className={css({ fontSize: 'sm', fontWeight: 'medium', fontFamily: 'mono' })}>
                      {order.tracking_number}
                    </p>
                  </Box>
                )}
                <button
                  onClick={() => handleFulfill('deliver')}
                  disabled={processing}
                  className={css({
                    w: 'full',
                    px: 4,
                    py: 3,
                    bg: 'green.default',
                    color: 'white',
                    rounded: 'md',
                    fontSize: 'sm',
                    fontWeight: 'semibold',
                    cursor: 'pointer',
                    _hover: { bg: 'green.emphasized' },
                    _disabled: { opacity: 0.5, cursor: 'not-allowed' }
                  })}
                >
                  {processing ? 'Processing...' : 'Mark as Delivered'}
                </button>
              </>
            )}
          </Box>
        )}

        {order.status === 'delivered' && order.delivered_at && (
          <Box p={4} bg="green.subtle" borderWidth="1px" borderColor="green.default" rounded="md">
            <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'green.text' })}>
              ✓ Delivered on {formatDate(order.delivered_at)}
            </p>
          </Box>
        )}
      </Box>
    </Box>
  )
}
