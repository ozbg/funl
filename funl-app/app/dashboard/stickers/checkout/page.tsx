'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex, Grid } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { useCartStore } from '@/store/cartStore'
import Link from 'next/link'

export default function CheckoutPage() {
  const router = useRouter()
  const cart = useCartStore()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [shippingForm, setShippingForm] = useState({
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'AU',
    phone: ''
  })

  const handleShippingChange = (field: string, value: string) => {
    setShippingForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckout = async () => {
    // Validation
    if (!shippingForm.full_name || !shippingForm.address_line1 || !shippingForm.city ||
        !shippingForm.state || !shippingForm.postal_code) {
      setError('Please fill in all required shipping fields')
      return
    }

    if (cart.items.length === 0) {
      setError('Your cart is empty')
      return
    }

    try {
      setProcessing(true)
      setError(null)

      // Save shipping address to cart
      cart.setShippingAddress(shippingForm)

      // Process the purchase
      const response = await fetch('/api/stickers/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items,
          shipping_address: shippingForm,
          subtotal: cart.getSubtotal(),
          tax: cart.getTax(),
          shipping: cart.getShipping(),
          total: cart.getTotal()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Purchase failed')
      }

      const { order_id, order_number } = await response.json()

      // Clear cart
      cart.clearCart()

      // Redirect to confirmation
      router.push(`/dashboard/stickers/orders/${order_id}?confirmed=true`)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
    } finally {
      setProcessing(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <Box textAlign="center" py={12}>
        <Box fontSize="4xl" mb={4}>🛒</Box>
        <h2 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 4 })}>
          Your cart is empty
        </h2>
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
    )
  }

  return (
    <Box>
      <h1 className={css({ fontSize: '3xl', fontWeight: 'bold', mb: 8 })}>
        Checkout
      </h1>

      {error && (
        <Box mb={6} p={4} bg="red.subtle" borderWidth="1px" borderColor="red.default" rounded="md">
          <p className={css({ color: 'red.text', fontSize: 'sm' })}>{error}</p>
        </Box>
      )}

      <Grid gridTemplateColumns={{ base: '1', lg: '3fr 2fr' }} gap={8}>
        {/* Left Column - Shipping Form */}
        <Box>
          <Box mb={8}>
            <h2 className={css({ fontSize: 'xl', fontWeight: 'semibold', mb: 6 })}>
              Shipping Information
            </h2>

            <form onSubmit={(e) => { e.preventDefault(); handleCheckout() }}>
              {/* Full Name */}
              <Box mb={4}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={shippingForm.full_name}
                  onChange={(e) => handleShippingChange('full_name', e.target.value)}
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

              {/* Address Line 1 */}
              <Box mb={4}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  value={shippingForm.address_line1}
                  onChange={(e) => handleShippingChange('address_line1', e.target.value)}
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

              {/* Address Line 2 */}
              <Box mb={4}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={shippingForm.address_line2}
                  onChange={(e) => handleShippingChange('address_line2', e.target.value)}
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
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </Box>

              {/* City, State, Postal Code */}
              <Grid gridTemplateColumns="2fr 1fr 1fr" gap={4} mb={4}>
                <Box>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingForm.city}
                    onChange={(e) => handleShippingChange('city', e.target.value)}
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
                <Box>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingForm.state}
                    onChange={(e) => handleShippingChange('state', e.target.value)}
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
                    placeholder="NSW"
                  />
                </Box>
                <Box>
                  <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                    Postcode *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingForm.postal_code}
                    onChange={(e) => handleShippingChange('postal_code', e.target.value)}
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
              </Grid>

              {/* Country */}
              <Box mb={4}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                  Country *
                </label>
                <select
                  value={shippingForm.country}
                  onChange={(e) => handleShippingChange('country', e.target.value)}
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
                >
                  <option value="AU">Australia</option>
                  <option value="NZ">New Zealand</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </Box>

              {/* Phone */}
              <Box mb={6}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={shippingForm.phone}
                  onChange={(e) => handleShippingChange('phone', e.target.value)}
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
                  placeholder="For delivery updates (optional)"
                />
              </Box>
            </form>
          </Box>
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

            {/* Cart Items */}
            <Box mb={6}>
              {cart.items.map((item, idx) => (
                <Flex key={idx} justify="space-between" mb={4} pb={4} borderBottomWidth="1px" borderColor="border.default">
                  <Box flex="1">
                    <p className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                      {item.batch_name} - {item.size.charAt(0).toUpperCase() + item.size.slice(1)}
                    </p>
                    <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                      {item.style.name} × {item.quantity}
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

            {/* Price Breakdown */}
            <Box mb={6}>
              <Flex justify="space-between" mb={2}>
                <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Subtotal:</span>
                <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                  ${cart.getSubtotal().toFixed(2)}
                </span>
              </Flex>
              <Flex justify="space-between" mb={2}>
                <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Tax (GST):</span>
                <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                  ${cart.getTax().toFixed(2)}
                </span>
              </Flex>
              <Flex justify="space-between" mb={4} pb={4} borderBottomWidth="1px" borderColor="border.default">
                <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Shipping:</span>
                <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                  ${cart.getShipping().toFixed(2)}
                </span>
              </Flex>
              <Flex justify="space-between">
                <span className={css({ fontSize: 'lg', fontWeight: 'bold' })}>Total:</span>
                <span className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'accent.default' })}>
                  ${cart.getTotal().toFixed(2)}
                </span>
              </Flex>
            </Box>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={processing}
              className={css({
                w: 'full',
                px: 6,
                py: 3,
                bg: 'accent.default',
                color: 'white',
                rounded: 'md',
                fontSize: 'md',
                fontWeight: 'semibold',
                cursor: 'pointer',
                mb: 3,
                _hover: { bg: 'accent.emphasized' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' }
              })}
            >
              {processing ? 'Processing...' : `Pay $${cart.getTotal().toFixed(2)}`}
            </button>

            <p className={css({ fontSize: 'xs', color: 'fg.muted', textAlign: 'center' })}>
              Payment processing placeholder - Stripe integration coming soon
            </p>
          </Box>
        </Box>
      </Grid>
    </Box>
  )
}
