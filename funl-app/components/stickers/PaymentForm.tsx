'use client'

import { useState, useEffect } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Box } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'

interface PaymentFormProps {
  orderId: string
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
}

export function PaymentForm({ orderId, amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!stripe) return

    // Check if payment already succeeded (returning from redirect)
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    )

    if (!clientSecret) return

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) return

      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('Payment succeeded!')
          onSuccess()
          break
        case 'processing':
          setMessage('Your payment is processing.')
          break
        case 'requires_payment_method':
          setMessage('Your payment was not successful, please try again.')
          onError('Payment failed')
          break
        default:
          setMessage('Something went wrong.')
          onError('Payment failed')
          break
      }
    })
  }, [stripe, onSuccess, onError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setMessage(null)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/stickers/orders/${orderId}?confirmed=true`,
        },
      })

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(error.message || 'Payment failed')
          onError(error.message || 'Payment failed')
        } else {
          setMessage('An unexpected error occurred.')
          onError('An unexpected error occurred.')
        }
      }
    } catch (err) {
      setMessage('An unexpected error occurred.')
      onError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Box mb={6}>
        <PaymentElement />
      </Box>

      {message && (
        <Box mb={4} p={3} bg={message.includes('succeeded') ? 'green.subtle' : 'red.subtle'} rounded="md">
          <p className={css({
            fontSize: 'sm',
            color: message.includes('succeeded') ? 'green.text' : 'red.text'
          })}>
            {message}
          </p>
        </Box>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
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
          _hover: { bg: 'accent.emphasized' },
          _disabled: { opacity: 0.5, cursor: 'not-allowed' }
        })}
      >
        {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>

      <p className={css({ fontSize: 'xs', color: 'fg.muted', textAlign: 'center', mt: 3 })}>
        Secure payment powered by Stripe
      </p>
    </form>
  )
}
