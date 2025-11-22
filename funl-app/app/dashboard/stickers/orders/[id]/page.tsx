import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import Link from 'next/link'

export default async function OrderDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ confirmed?: string }>
}) {
  const supabase = await createClient()
  const { id } = await params
  const { confirmed } = await searchParams

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch order
  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', id)
    .eq('business_id', user.id)
    .single()

  if (orderError || !order) {
    redirect('/dashboard/stickers/orders')
  }

  // Fetch allocated codes for this order
  const { data: codes } = await supabase
    .from('reserved_codes')
    .select('id, code, status')
    .eq('purchase_order_id', id)

  const items = order.items as Array<{
    batch_id: string
    quantity: number
    unit_price: number
    size: string
    style: {
      id?: string
      name?: string
      template?: string
      preview_url?: string
    }
  }>
  const shipping = order.shipping_address as {
    full_name: string
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code: string
    country: string
    phone?: string
  }

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
      {/* Confirmation Banner */}
      {confirmed === 'true' && (
        <Box mb={6} p={4} bg="green.subtle" borderWidth="1px" borderColor="green.default" rounded="md">
          <Flex align="center" gap={3}>
            <Box fontSize="2xl">✅</Box>
            <Box>
              <p className={css({ fontSize: 'md', fontWeight: 'semibold', color: 'green.text' })}>
                Order Confirmed!
              </p>
              <p className={css({ fontSize: 'sm', color: 'green.text', mt: 1 })}>
                Your order has been placed successfully. We&apos;ll send you tracking information once it ships.
              </p>
            </Box>
          </Flex>
        </Box>
      )}

      {/* Header */}
      <Flex justify="space-between" align="start" mb={8}>
        <Box>
          <Link
            href="/dashboard/stickers/orders"
            className={css({
              fontSize: 'sm',
              color: 'fg.muted',
              mb: 2,
              display: 'inline-block',
              _hover: { color: 'fg.default' }
            })}
          >
            ← Back to Orders
          </Link>
          <h1 className={css({ fontSize: '3xl', fontWeight: 'bold' })}>
            Order {order.order_number}
          </h1>
          <p className={css({ color: 'fg.muted', mt: 2 })}>
            Placed on {new Date(order.created_at).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </Box>
        <span className={css({
          px: 4,
          py: 2,
          bg: `${statusColors[order.status] || 'gray'}.subtle`,
          color: `${statusColors[order.status] || 'gray'}.text`,
          rounded: 'md',
          fontSize: 'sm',
          fontWeight: 'semibold'
        })}>
          {statusLabels[order.status] || order.status}
        </span>
      </Flex>

      <Grid gridTemplateColumns={{ base: '1', lg: '2fr 1fr' }} gap={8}>
        {/* Left Column */}
        <Box>
          {/* Order Items */}
          <Box mb={8}>
            <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 4 })}>
              Order Items
            </h2>
            <Box
              bg="bg.default"
              borderWidth="1px"
              borderColor="border.default"
              rounded="lg"
              overflow="hidden"
            >
              {items.map((item, idx) => (
                <Flex
                  key={idx}
                  justify="space-between"
                  align="center"
                  p={4}
                  borderBottomWidth={idx < items.length - 1 ? '1px' : '0'}
                  borderColor="border.default"
                >
                  <Box flex="1">
                    <p className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                      QR Sticker - {item.size?.charAt(0).toUpperCase() + item.size?.slice(1)}
                    </p>
                    <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                      {item.style?.name || 'Classic'} Style
                    </p>
                    <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                      Quantity: {item.quantity || 1}
                    </p>
                  </Box>
                  <Box textAlign="right">
                    <p className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                      ${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}
                    </p>
                    <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                      ${(item.unit_price || 0).toFixed(2)} each
                    </p>
                  </Box>
                </Flex>
              ))}
            </Box>
          </Box>

          {/* Allocated Codes */}
          {codes && codes.length > 0 && (
            <Box mb={8}>
              <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 4 })}>
                Your QR Codes
              </h2>
              <Box
                bg="bg.default"
                borderWidth="1px"
                borderColor="border.default"
                rounded="lg"
                p={4}
              >
                <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 4 })}>
                  These codes have been allocated to your account and are ready to use.
                </p>
                <Grid gridTemplateColumns={{ base: '1', md: '2' }} gap={3}>
                  {codes.map((code) => (
                    <Flex
                      key={code.id}
                      align="center"
                      justify="space-between"
                      p={3}
                      bg="bg.subtle"
                      rounded="md"
                    >
                      <Box>
                        <p className={css({ fontSize: 'sm', fontWeight: 'mono', fontFamily: 'monospace' })}>
                          {code.code}
                        </p>
                        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                          {code.status}
                        </p>
                      </Box>
                      <Link
                        href={`/dashboard/stickers/connect?code=${code.code}`}
                        className={css({
                          px: 3,
                          py: 1,
                          bg: 'accent.default',
                          color: 'white',
                          rounded: 'sm',
                          fontSize: 'xs',
                          fontWeight: 'medium',
                          _hover: { bg: 'accent.emphasized' }
                        })}
                      >
                        Connect
                      </Link>
                    </Flex>
                  ))}
                </Grid>
              </Box>
            </Box>
          )}

          {/* Shipping Address */}
          {shipping && (
            <Box>
              <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 4 })}>
                Shipping Address
              </h2>
              <Box
                p={4}
                bg="bg.default"
                borderWidth="1px"
                borderColor="border.default"
                rounded="lg"
              >
                <p className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                  {shipping.full_name}
                </p>
                <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 2 })}>
                  {shipping.address_line1}
                </p>
                {shipping.address_line2 && (
                  <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                    {shipping.address_line2}
                  </p>
                )}
                <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                  {shipping.city}, {shipping.state} {shipping.postal_code}
                </p>
                <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                  {shipping.country}
                </p>
                {shipping.phone && (
                  <p className={css({ fontSize: 'sm', color: 'fg.muted', mt: 2 })}>
                    Phone: {shipping.phone}
                  </p>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Right Column - Order Summary */}
        <Box>
          <Box
            position="sticky"
            top={4}
            p={6}
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border.default"
            rounded="lg"
          >
            <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 6 })}>
              Order Summary
            </h2>

            <Box mb={6}>
              <Flex justify="space-between" mb={3}>
                <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Subtotal:</span>
                <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                  ${parseFloat(order.subtotal).toFixed(2)}
                </span>
              </Flex>
              {order.tax > 0 && (
                <Flex justify="space-between" mb={3}>
                  <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Tax (GST):</span>
                  <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                    ${parseFloat(order.tax).toFixed(2)}
                  </span>
                </Flex>
              )}
              {order.shipping > 0 && (
                <Flex justify="space-between" mb={4} pb={4} borderBottomWidth="1px" borderColor="border.default">
                  <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Shipping:</span>
                  <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                    ${parseFloat(order.shipping).toFixed(2)}
                  </span>
                </Flex>
              )}
              <Flex justify="space-between">
                <span className={css({ fontSize: 'lg', fontWeight: 'bold' })}>Total:</span>
                <span className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'accent.default' })}>
                  ${parseFloat(order.total).toFixed(2)}
                </span>
              </Flex>
            </Box>

            {/* Tracking Information */}
            {order.tracking_number && (
              <Box pt={6} borderTopWidth="1px" borderColor="border.default">
                <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', mb: 3 })}>
                  Tracking Information
                </h3>
                <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 2 })}>
                  Carrier: {order.carrier || 'Australia Post'}
                </p>
                <p className={css({ fontSize: 'sm', fontFamily: 'monospace', fontWeight: 'medium' })}>
                  {order.tracking_number}
                </p>
              </Box>
            )}

            {/* Order Timeline */}
            <Box pt={6} mt={6} borderTopWidth="1px" borderColor="border.default">
              <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', mb: 4 })}>
                Order Timeline
              </h3>
              <Box>
                <TimelineItem
                  label="Order Placed"
                  date={order.created_at}
                  completed={true}
                />
                {order.paid_at && (
                  <TimelineItem
                    label="Payment Received"
                    date={order.paid_at}
                    completed={true}
                  />
                )}
                {order.shipped_at && (
                  <TimelineItem
                    label="Shipped"
                    date={order.shipped_at}
                    completed={true}
                  />
                )}
                {order.delivered_at && (
                  <TimelineItem
                    label="Delivered"
                    date={order.delivered_at}
                    completed={true}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Grid>
    </Box>
  )
}

function TimelineItem({ label, date, completed }: {
  label: string
  date: string
  completed: boolean
}) {
  return (
    <Flex gap={3} mb={4}>
      <Box
        w={2}
        h={2}
        mt={1}
        rounded="full"
        bg={completed ? 'accent.default' : 'border.default'}
        flexShrink={0}
      />
      <Box flex="1">
        <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: completed ? 'fg.default' : 'fg.muted' })}>
          {label}
        </p>
        <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
          {new Date(date).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </Box>
    </Flex>
  )
}
