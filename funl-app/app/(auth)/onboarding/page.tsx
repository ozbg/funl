'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { css } from '@/styled-system/css'
import { Box, Flex, Grid } from '@/styled-system/jsx'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [business, setBusiness] = useState<{ id: string; business_name: string; name?: string; email: string; phone?: string } | null>(null)
  const [subscription, setSubscription] = useState<{ plan_id: string; status: string; trial_end: string | null; billing_period?: string; plan?: { name: string; funnel_limit?: number }; plans: { name: string; funnel_limit?: number } } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Load business details
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', user.id)
        .single()

      setBusiness(businessData)

      // Load subscription
      const { data: subData } = await supabase
        .from('subscription_history')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('business_id', user.id)
        .in('status', ['active', 'trialing'])
        .single()

      setSubscription(subData)
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleComplete = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Mark onboarding as completed
      const { error } = await supabase
        .from('businesses')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      if (error) throw error

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <Box bg="bg.default" minH="100vh" py={12} px={4}>
      <Box mx="auto" maxW="4xl">
        {/* Progress bar */}
        <Box mb={12}>
          <Flex justify="space-between" mb={2}>
            <span className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
              Step {step} of 3
            </span>
            <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              {Math.round((step / 3) * 100)}% complete
            </span>
          </Flex>
          <Box w="full" h={2} bg="bg.subtle" rounded="full" overflow="hidden">
            <Box
              h="full"
              bg="accent.default"
              style={{ width: `${(step / 3) * 100}%` }}
              className={css({ transition: 'width 0.3s ease' })}
            />
          </Box>
        </Box>

        {/* Step 1: Welcome & Plan Confirmation */}
        {step === 1 && (
          <Box>
            <Box textAlign="center" mb={8}>
              <h1 className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'fg.default', mb: 4 })}>
                Welcome to FunL! 🎉
              </h1>
              <p className={css({ fontSize: 'lg', color: 'fg.muted' })}>
                Let&apos;s get you set up in just a few steps
              </p>
            </Box>

            {subscription && (
              <Box
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border.default"
                rounded="lg"
                p={6}
                mb={8}
              >
                <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 4 })}>
                  Your Plan
                </h3>
                <Grid columns={2} gap={4}>
                  <Box>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Plan</p>
                    <p className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default' })}>
                      {subscription.plan?.name}
                    </p>
                  </Box>
                  <Box>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Funnel Limit</p>
                    <p className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default' })}>
                      {subscription.plan?.funnel_limit} funnels
                    </p>
                  </Box>
                  {subscription.status === 'trialing' && subscription.trial_end && (
                    <Box>
                      <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Trial ends</p>
                      <p className={css({ fontSize: 'md', fontWeight: 'medium', color: 'green.600' })}>
                        {new Date(subscription.trial_end).toLocaleDateString()}
                      </p>
                    </Box>
                  )}
                  <Box>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Billing</p>
                    <p className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default', textTransform: 'capitalize' })}>
                      {subscription.billing_period}
                    </p>
                  </Box>
                </Grid>
              </Box>
            )}
          </Box>
        )}

        {/* Step 2: Business Info Confirmation */}
        {step === 2 && business && (
          <Box>
            <Box textAlign="center" mb={8}>
              <h2 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default', mb: 4 })}>
                Confirm your business details
              </h2>
              <p className={css({ fontSize: 'md', color: 'fg.muted' })}>
                Make sure your information is correct
              </p>
            </Box>

            <Box
              bg="bg.subtle"
              borderWidth="1px"
              borderColor="border.default"
              rounded="lg"
              p={6}
              mb={8}
            >
              <Grid columns={1} gap={4}>
                <Box>
                  <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Business Name</p>
                  <p className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default' })}>
                    {business.name}
                  </p>
                </Box>
                <Box>
                  <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Email</p>
                  <p className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default' })}>
                    {business.email}
                  </p>
                </Box>
                {business.phone && (
                  <Box>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 1 })}>Phone</p>
                    <p className={css({ fontSize: 'md', fontWeight: 'medium', color: 'fg.default' })}>
                      {business.phone}
                    </p>
                  </Box>
                )}
              </Grid>

              <Box mt={4} pt={4} borderTopWidth="1px" borderColor="border.default">
                <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                  Need to update? You can change these later in your account settings.
                </p>
              </Box>
            </Box>
          </Box>
        )}

        {/* Step 3: Next Steps */}
        {step === 3 && (
          <Box>
            <Box textAlign="center" mb={8}>
              <h2 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default', mb: 4 })}>
                You&apos;re all set! 🚀
              </h2>
              <p className={css({ fontSize: 'md', color: 'fg.muted' })}>
                Here&apos;s what you can do next
              </p>
            </Box>

            <Grid columns={1} gap={4} mb={8}>
              <Box
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border.default"
                rounded="lg"
                p={6}
              >
                <Flex gap={4} align="start">
                  <Box
                    w={10}
                    h={10}
                    rounded="full"
                    bg="accent.default"
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    1
                  </Box>
                  <Box flex={1}>
                    <h3 className={css({ fontSize: 'md', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                      Create your first funnel
                    </h3>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                      Build a funnel to start collecting leads and driving conversions
                    </p>
                  </Box>
                </Flex>
              </Box>

              <Box
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border.default"
                rounded="lg"
                p={6}
              >
                <Flex gap={4} align="start">
                  <Box
                    w={10}
                    h={10}
                    rounded="full"
                    bg="accent.default"
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    2
                  </Box>
                  <Box flex={1}>
                    <h3 className={css({ fontSize: 'md', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                      Generate QR codes
                    </h3>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                      Create unlimited QR codes for your funnels
                    </p>
                  </Box>
                </Flex>
              </Box>

              <Box
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border.default"
                rounded="lg"
                p={6}
              >
                <Flex gap={4} align="start">
                  <Box
                    w={10}
                    h={10}
                    rounded="full"
                    bg="accent.default"
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    3
                  </Box>
                  <Box flex={1}>
                    <h3 className={css({ fontSize: 'md', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
                      Track your analytics
                    </h3>
                    <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                      Monitor scans, conversions, and engagement in real-time
                    </p>
                  </Box>
                </Flex>
              </Box>
            </Grid>
          </Box>
        )}

        {/* Navigation Buttons */}
        <Flex justify="space-between" mt={12}>
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={css({
              px: 6,
              py: 3,
              fontSize: 'sm',
              fontWeight: 'medium',
              color: 'fg.default',
              bg: 'bg.subtle',
              rounded: 'md',
              cursor: 'pointer',
              _hover: { bg: 'bg.muted' },
              _disabled: {
                opacity: 0.5,
                cursor: 'not-allowed',
              },
            })}
          >
            Back
          </button>

          <button
            onClick={nextStep}
            disabled={loading}
            className={css({
              px: 6,
              py: 3,
              fontSize: 'sm',
              fontWeight: 'medium',
              color: 'white',
              bg: 'accent.default',
              rounded: 'md',
              cursor: 'pointer',
              _hover: { bg: 'accent.emphasized' },
              _disabled: {
                opacity: 0.5,
                cursor: 'not-allowed',
              },
            })}
          >
            {loading ? 'Loading...' : step === 3 ? 'Go to Dashboard' : 'Continue'}
          </button>
        </Flex>
      </Box>
    </Box>
  )
}
