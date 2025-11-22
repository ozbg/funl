'use client'

import { Box, Flex } from '@/styled-system/jsx'
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
    business_name: string
    email: string
  }
}

interface OrdersTableProps {
  orders: Order[]
  onSelectOrder: (order: Order) => void
}

export function OrdersTable({ orders, onSelectOrder }: OrdersTableProps) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow.text'
      case 'processing': return 'blue.text'
      case 'shipped': return 'purple.text'
      case 'delivered': return 'green.text'
      case 'cancelled': return 'red.text'
      default: return 'fg.muted'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow.text'
      case 'paid': return 'green.text'
      case 'failed': return 'red.text'
      case 'refunded': return 'orange.text'
      default: return 'fg.muted'
    }
  }

  if (orders.length === 0) {
    return (
      <Box p={12} textAlign="center" color="fg.muted">
        <Box fontSize="4xl" mb={4}>📦</Box>
        <p className={css({ fontSize: 'lg', fontWeight: 'medium' })}>
          No orders found
        </p>
      </Box>
    )
  }

  return (
    <Box overflowX="auto">
      <table className={css({
        w: 'full',
        borderCollapse: 'collapse',
        fontSize: 'sm'
      })}>
        <thead>
          <tr className={css({ bg: 'bg.subtle', borderBottomWidth: '1px', borderColor: 'border.default' })}>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold' })}>Order #</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold' })}>Customer</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold' })}>Total</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold' })}>Payment</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold' })}>Status</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold' })}>Created</th>
            <th className={css({ px: 4, py: 3, textAlign: 'left', fontWeight: 'semibold' })}>Paid</th>
            <th className={css({ px: 4, py: 3, textAlign: 'right', fontWeight: 'semibold' })}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className={css({
                borderBottomWidth: '1px',
                borderColor: 'border.default',
                _hover: { bg: 'bg.subtle' }
              })}
            >
              <td className={css({ px: 4, py: 3 })}>
                <span className={css({ fontFamily: 'mono', fontSize: 'xs', fontWeight: 'medium' })}>
                  {order.order_number}
                </span>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <Box>
                  <p className={css({ fontWeight: 'medium' })}>{order.business.business_name}</p>
                  <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>{order.business.email}</p>
                </Box>
              </td>
              <td className={css({ px: 4, py: 3, fontWeight: 'medium' })}>
                ${order.total.toFixed(2)}
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <span className={css({
                  px: 2,
                  py: 1,
                  rounded: 'md',
                  fontSize: 'xs',
                  fontWeight: 'medium',
                  bg: order.payment_status === 'paid' ? 'green.subtle' : 'yellow.subtle',
                  color: getPaymentStatusColor(order.payment_status)
                })}>
                  {order.payment_status}
                </span>
              </td>
              <td className={css({ px: 4, py: 3 })}>
                <span className={css({
                  px: 2,
                  py: 1,
                  rounded: 'md',
                  fontSize: 'xs',
                  fontWeight: 'medium',
                  bg: 'bg.subtle',
                  color: getStatusColor(order.status)
                })}>
                  {order.status}
                </span>
              </td>
              <td className={css({ px: 4, py: 3, fontSize: 'xs', color: 'fg.muted' })}>
                {formatDate(order.created_at)}
              </td>
              <td className={css({ px: 4, py: 3, fontSize: 'xs', color: 'fg.muted' })}>
                {formatDate(order.paid_at)}
              </td>
              <td className={css({ px: 4, py: 3, textAlign: 'right' })}>
                <button
                  onClick={() => onSelectOrder(order)}
                  className={css({
                    px: 3,
                    py: 1,
                    bg: 'accent.default',
                    color: 'white',
                    rounded: 'md',
                    fontSize: 'xs',
                    fontWeight: 'medium',
                    cursor: 'pointer',
                    _hover: { bg: 'accent.emphasized' }
                  })}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  )
}
