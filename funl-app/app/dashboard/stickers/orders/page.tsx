import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import Link from 'next/link'

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch business
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', user.id)
    .single()

  if (!business) {
    redirect('/onboarding')
  }

  // Fetch orders
  const { data: orders } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('business_id', user.id)
    .order('created_at', { ascending: false })

  const statusColors: Record<string, string> = {
    pending: 'gray',
    processing: 'blue',
    paid: 'green',
    shipped: 'purple',
    delivered: 'teal',
    cancelled: 'red'
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending Payment',
    processing: 'Processing',
    paid: 'Paid',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  }

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <h1 className={css({ fontSize: '3xl', fontWeight: 'bold' })}>
            Order History
          </h1>
          <p className={css({ color: 'fg.muted', mt: 2 })}>
            View and track your QR sticker orders
          </p>
        </Box>
        <Link
          href="/dashboard/stickers/buy"
          className={css({
            px: 4,
            py: 2,
            bg: 'accent.default',
            color: 'white',
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'medium',
            _hover: { bg: 'accent.emphasized' }
          })}
        >
          Buy Stickers
        </Link>
      </Flex>

      {/* No Orders */}
      {!orders || orders.length === 0 ? (
        <Box p={12} textAlign="center" bg="bg.subtle" rounded="lg">
          <Box fontSize="4xl" mb={4}>📦</Box>
          <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 4 })}>
            No orders yet
          </h2>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 6 })}>
            Start by browsing our QR sticker inventory
          </p>
          <Link
            href="/dashboard/stickers/buy"
            className={css({
              px: 6,
              py: 3,
              bg: 'accent.default',
              color: 'white',
              rounded: 'md',
              fontSize: 'md',
              fontWeight: 'semibold',
              display: 'inline-block',
              _hover: { bg: 'accent.emphasized' }
            })}
          >
            Browse Stickers
          </Link>
        </Box>
      ) : (
        <Box>
          {/* Orders Table */}
          <Box
            bg="bg.default"
            borderWidth="1px"
            borderColor="border.default"
            rounded="lg"
            overflow="hidden"
          >
            {/* Table Header */}
            <Grid
              gridTemplateColumns="2fr 1fr 1fr 1fr 1fr auto"
              gap={4}
              p={4}
              bg="bg.subtle"
              borderBottomWidth="1px"
              borderColor="border.default"
            >
              <Box>
                <p className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.muted', textTransform: 'uppercase' })}>
                  Order
                </p>
              </Box>
              <Box>
                <p className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.muted', textTransform: 'uppercase' })}>
                  Date
                </p>
              </Box>
              <Box>
                <p className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.muted', textTransform: 'uppercase' })}>
                  Status
                </p>
              </Box>
              <Box>
                <p className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.muted', textTransform: 'uppercase' })}>
                  Items
                </p>
              </Box>
              <Box textAlign="right">
                <p className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.muted', textTransform: 'uppercase' })}>
                  Total
                </p>
              </Box>
              <Box />
            </Grid>

            {/* Table Body */}
            {orders.map((order) => {
              const items = order.items as any[]
              const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0)
              const orderDate = new Date(order.created_at).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })

              return (
                <Grid
                  key={order.id}
                  gridTemplateColumns="2fr 1fr 1fr 1fr 1fr auto"
                  gap={4}
                  p={4}
                  borderBottomWidth="1px"
                  borderColor="border.default"
                  _last={{ borderBottom: 'none' }}
                  _hover={{ bg: 'bg.subtle' }}
                >
                  <Box>
                    <p className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                      {order.order_number}
                    </p>
                    {order.order_type && (
                      <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                        {order.order_type === 'reprint' ? 'Reprint Order' : 'New Purchase'}
                      </p>
                    )}
                  </Box>
                  <Box>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                      {orderDate}
                    </p>
                  </Box>
                  <Box>
                    <span className={css({
                      px: 2,
                      py: 1,
                      bg: `${statusColors[order.status] || 'gray'}.subtle`,
                      color: `${statusColors[order.status] || 'gray'}.text`,
                      rounded: 'sm',
                      fontSize: 'xs',
                      fontWeight: 'medium'
                    })}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </Box>
                  <Box>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                      {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </p>
                  </Box>
                  <Box textAlign="right">
                    <p className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                      ${parseFloat(order.total).toFixed(2)}
                    </p>
                  </Box>
                  <Box>
                    <Link
                      href={`/dashboard/stickers/orders/${order.id}`}
                      className={css({
                        px: 3,
                        py: 1,
                        bg: 'bg.subtle',
                        borderWidth: '1px',
                        borderColor: 'border.default',
                        rounded: 'md',
                        fontSize: 'xs',
                        fontWeight: 'medium',
                        _hover: { bg: 'bg.muted' }
                      })}
                    >
                      View
                    </Link>
                  </Box>
                </Grid>
              )
            })}
          </Box>
        </Box>
      )}
    </Box>
  )
}
