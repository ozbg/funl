'use client'

import { useEffect, useState } from 'react'
import { Box, Flex } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { OrdersTable } from '@/components/admin/OrdersTable'
import { OrderFulfillmentPanel } from '@/components/admin/OrderFulfillmentPanel'

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'shipped' | 'delivered'>('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      setOrders(data.orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'pending') return order.payment_status === 'pending'
    if (filter === 'paid') return order.payment_status === 'paid' && order.status === 'processing'
    if (filter === 'shipped') return order.status === 'shipped'
    if (filter === 'delivered') return order.status === 'delivered'
    return true
  })

  const handleFulfillment = async () => {
    await fetchOrders()
    setSelectedOrder(null)
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={8}>
        <h1 className={css({ fontSize: '3xl', fontWeight: 'bold' })}>
          Orders
        </h1>
      </Flex>

      {/* Filter Tabs */}
      <Flex gap={2} mb={6} borderBottomWidth="1px" borderColor="border.default">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending Payment' },
          { key: 'paid', label: 'Paid' },
          { key: 'shipped', label: 'Shipped' },
          { key: 'delivered', label: 'Delivered' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={css({
              px: 4,
              py: 2,
              fontSize: 'sm',
              fontWeight: 'medium',
              borderBottomWidth: '2px',
              borderColor: filter === tab.key ? 'accent.default' : 'transparent',
              color: filter === tab.key ? 'accent.default' : 'fg.muted',
              cursor: 'pointer',
              _hover: { color: 'accent.default' }
            })}
          >
            {tab.label}
            <span className={css({ ml: 2, fontSize: 'xs', color: 'fg.muted' })}>
              ({orders.filter(o => {
                if (tab.key === 'all') return true
                if (tab.key === 'pending') return o.payment_status === 'pending'
                if (tab.key === 'paid') return o.payment_status === 'paid' && o.status === 'processing'
                if (tab.key === 'shipped') return o.status === 'shipped'
                if (tab.key === 'delivered') return o.status === 'delivered'
                return false
              }).length})
            </span>
          </button>
        ))}
      </Flex>

      {loading ? (
        <Box p={8} textAlign="center" color="fg.muted">
          Loading orders...
        </Box>
      ) : (
        <>
          <OrdersTable
            orders={filteredOrders}
            onSelectOrder={setSelectedOrder}
          />

          {selectedOrder && (
            <OrderFulfillmentPanel
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              onSuccess={handleFulfillment}
            />
          )}
        </>
      )}
    </Box>
  )
}
