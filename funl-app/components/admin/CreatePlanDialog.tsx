'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'

export function CreatePlanDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [funnelLimit, setFunnelLimit] = useState(3)
  const [priceMonthly, setPriceMonthly] = useState(0)
  const [priceWeekly, setPriceWeekly] = useState(0)
  const [defaultBillingPeriod, setDefaultBillingPeriod] = useState<'monthly' | 'weekly'>('monthly')
  const [trialPeriodDays, setTrialPeriodDays] = useState(14)
  const [features, setFeatures] = useState<string[]>([''])
  const [isDefault, setIsDefault] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showReasonTooltip, setShowReasonTooltip] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    const autoSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setSlug(autoSlug)
  }

  const handleAddFeature = () => {
    setFeatures([...features, ''])
  }

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...features]
    updated[index] = value
    setFeatures(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !slug || !reason || reason.length < 10) {
      setError('Please fill in all required fields (reason must be at least 10 characters)')
      return
    }

    if (priceMonthly <= 0 && priceWeekly <= 0) {
      setError('At least one price (monthly or weekly) must be greater than 0')
      return
    }

    setIsSubmitting(true)

    try {
      const cleanFeatures = features.filter(f => f.trim().length > 0)

      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          funnel_limit: funnelLimit,
          price_monthly: Math.round(priceMonthly * 100),
          price_weekly: Math.round(priceWeekly * 100),
          billing_period: defaultBillingPeriod, // Default - customers can choose at checkout
          trial_period_days: trialPeriodDays,
          features: cleanFeatures,
          is_default: isDefault,
          featured,
          reason,
          notes: notes || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create plan')
      }

      setIsOpen(false)
      resetForm()
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName('')
    setSlug('')
    setDescription('')
    setFunnelLimit(3)
    setPriceMonthly(0)
    setPriceWeekly(0)
    setDefaultBillingPeriod('monthly')
    setTrialPeriodDays(14)
    setFeatures([''])
    setIsDefault(false)
    setFeatured(false)
    setReason('')
    setNotes('')
    setError('')
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="solid"
        size="sm"
      >
        Create Plan
      </Button>
    )
  }

  return (
    <>
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="rgba(0, 0, 0, 0.5)"
        zIndex="40"
        onClick={() => setIsOpen(false)}
      />

      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        bg="bg.default"
        rounded="lg"
        boxShadow="xl"
        zIndex="50"
        w="full"
        maxW="4xl"
        maxH="90vh"
        overflowY="auto"
      >
        <form onSubmit={handleSubmit}>
          <Flex justify="space-between" align="center" p={6} borderBottomWidth="1px" borderColor="border.default">
            <h2 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default' })}>
              Create New Subscription Plan
            </h2>
            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
            >
              ✕
            </Button>
          </Flex>

          <Box p={6}>
            {error && (
              <Box mb={4} p={3} bg="bg.muted" borderWidth="1px" borderColor="border.default" borderLeftWidth="3px" rounded="md">
                <Flex gap={2} align="start">
                  <span className={css({ color: 'fg.default', fontSize: 'sm', fontWeight: 'semibold' })}>⚠</span>
                  <p className={css({ fontSize: 'sm', color: 'fg.default', flex: 1 })}>{error}</p>
                </Flex>
              </Box>
            )}

            <Flex gap={4} mb={4}>
              <Box flex={1}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Professional"
                  className={css({
                    w: 'full', px: 3, py: 2, fontSize: 'sm', bg: 'bg.default',
                    borderWidth: '1px', borderColor: 'border.default', rounded: 'md', outline: 'none',
                    _focus: { borderColor: 'accent.default', ring: '2px', ringColor: 'accent.default', ringOffset: '0' }
                  })}
                />
              </Box>
              <Box flex={1}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                  Slug *
                </label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="professional"
                  className={css({
                    w: 'full', px: 3, py: 2, fontSize: 'sm', bg: 'bg.default',
                    borderWidth: '1px', borderColor: 'border.default', rounded: 'md', outline: 'none',
                    _focus: { borderColor: 'accent.default', ring: '2px', ringColor: 'accent.default', ringOffset: '0' }
                  })}
                />
              </Box>
            </Flex>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                className={css({
                  w: 'full', px: 3, py: 2, fontSize: 'sm', bg: 'bg.default',
                  borderWidth: '1px', borderColor: 'border.default', rounded: 'md', outline: 'none', resize: 'vertical',
                  _focus: { borderColor: 'accent.default', ring: '2px', ringColor: 'accent.default', ringOffset: '0' }
                })}
              />
            </Box>

            <Flex gap={4} mb={4}>
              <Box flex={1}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>Monthly Price ($) *</label>
                <input type="number" value={priceMonthly} onChange={(e) => setPriceMonthly(parseFloat(e.target.value) || 0)} step="0.01" min="0"
                  className={css({ w: 'full', px: 3, py: 2, fontSize: 'sm', bg: 'bg.default', borderWidth: '1px', borderColor: 'border.default', rounded: 'md', outline: 'none', _focus: { borderColor: 'accent.default', ring: '2px', ringColor: 'accent.default', ringOffset: '0' } })}
                />
              </Box>
              <Box flex={1}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>Weekly Price ($) *</label>
                <input type="number" value={priceWeekly} onChange={(e) => setPriceWeekly(parseFloat(e.target.value) || 0)} step="0.01" min="0"
                  className={css({ w: 'full', px: 3, py: 2, fontSize: 'sm', bg: 'bg.default', borderWidth: '1px', borderColor: 'border.default', rounded: 'md', outline: 'none', _focus: { borderColor: 'accent.default', ring: '2px', ringColor: 'accent.default', ringOffset: '0' } })}
                />
              </Box>
            </Flex>

            <Flex gap={4} mb={4}>
              <Box flex={1}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>Funnel Limit *</label>
                <input type="number" value={funnelLimit} onChange={(e) => setFunnelLimit(parseInt(e.target.value) || 1)} min="1"
                  className={css({ w: 'full', px: 3, py: 2, fontSize: 'sm', bg: 'bg.default', borderWidth: '1px', borderColor: 'border.default', rounded: 'md', outline: 'none', _focus: { borderColor: 'accent.default', ring: '2px', ringColor: 'accent.default', ringOffset: '0' } })}
                />
              </Box>
              <Box flex={1}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>Trial Period (days)</label>
                <input type="number" value={trialPeriodDays} onChange={(e) => setTrialPeriodDays(parseInt(e.target.value) || 0)} min="0"
                  className={css({ w: 'full', px: 3, py: 2, fontSize: 'sm', bg: 'bg.default', borderWidth: '1px', borderColor: 'border.default', rounded: 'md', outline: 'none', _focus: { borderColor: 'accent.default', ring: '2px', ringColor: 'accent.default', ringOffset: '0' } })}
                />
              </Box>
            </Flex>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>
                Default Billing Period *
              </label>
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 2 })}>
                Customers can choose their preferred billing frequency at checkout
              </p>
              <select
                value={defaultBillingPeriod}
                onChange={(e) => setDefaultBillingPeriod(e.target.value as 'monthly' | 'weekly')}
                className={css({
                  w: 'full', px: 3, py: 2, fontSize: 'sm', bg: 'bg.default',
                  borderWidth: '1px', borderColor: 'border.default', rounded: 'md', outline: 'none',
                  cursor: 'pointer',
                  _focus: { borderColor: 'accent.default', ring: '2px', ringColor: 'accent.default', ringOffset: '0' }
                })}
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </Box>

            <Flex gap={6} mb={4}>
              <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className={css({ cursor: 'pointer' })} />
                <span className={css({ fontSize: 'sm' })}>Set as default plan</span>
              </label>
              <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className={css({ cursor: 'pointer' })} />
                <span className={css({ fontSize: 'sm' })}>Featured plan</span>
              </label>
            </Flex>

            <Box mb={4}>
              <Flex justify="space-between" align="center" mb={2}>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium' })}>Features</label>
                <Button type="button" onClick={handleAddFeature} variant="ghost" size="sm" className={css({ _hover: { textDecoration: 'underline' } })}>+ Add Feature</Button>
              </Flex>
              {features.map((feature, index) => (
                <Flex key={index} gap={2} mb={2} align="center">
                  <Box flex={1}>
                    <input type="text" value={feature} onChange={(e) => handleFeatureChange(index, e.target.value)} placeholder="Feature description..."
                      className={css({ w: 'full', px: 3, py: 2, fontSize: 'sm', bg: 'bg.default', borderWidth: '1px', borderColor: 'border.default', rounded: 'md', outline: 'none', _focus: { borderColor: 'accent.default', ring: '2px', ringColor: 'accent.default', ringOffset: '0' } })}
                    />
                  </Box>
                  {features.length > 1 && (
                    <Button type="button" onClick={() => handleRemoveFeature(index)} variant="ghost" size="sm" className={css({ color: 'fg.muted', _hover: { textDecoration: 'underline' } })}>Remove</Button>
                  )}
                </Flex>
              ))}
            </Box>

            <Box mb={4}>
              <Flex align="center" gap={2} mb={2}>
                <label className={css({ fontSize: 'sm', fontWeight: 'medium' })}>Reason * (min 10 characters)</label>
                <Box position="relative">
                  <span
                    onMouseEnter={() => setShowReasonTooltip(true)}
                    onMouseLeave={() => setShowReasonTooltip(false)}
                    className={css({
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      w: 5,
                      h: 5,
                      borderRadius: '50%',
                      bg: 'bg.muted',
                      color: 'fg.default',
                      fontSize: 'sm',
                      fontWeight: 'bold',
                      cursor: 'help',
                      _hover: { bg: 'bg.subtle' }
                    })}
                  >
                    ?
                  </span>
                  {showReasonTooltip && (
                    <Box
                      position="absolute"
                      left="0"
                      top="100%"
                      mt={2}
                      w="96"
                      maxW="500px"
                      bg="bg.default"
                      color="fg.default"
                      borderWidth="1px"
                      borderColor="border.default"
                      rounded="md"
                      p={4}
                      fontSize="sm"
                      boxShadow="lg"
                      zIndex={100}
                    >
                      <p className={css({ fontWeight: 'semibold', mb: 2, fontSize: 'md' })}>Audit trail for billing changes</p>
                      <p className={css({ mb: 2, color: 'fg.muted' })}>Examples:</p>
                      <ul className={css({ listStyle: 'disc', pl: 5, lineHeight: '1.6', color: 'fg.muted' })}>
                        <li>Initial plan setup for launch</li>
                        <li>Price increase based on competitor analysis</li>
                        <li>Holiday promotion - December 2024</li>
                        <li>Fixed funnel limit per customer feedback</li>
                        <li>A/B test variant - testing higher price point</li>
                      </ul>
                    </Box>
                  )}
                </Box>
              </Flex>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                placeholder="e.g., Initial plan setup for launch"
                className={css({ w: 'full', px: 3, py: 2, fontSize: 'sm', bg: 'bg.default', borderWidth: '1px', borderColor: 'border.default', rounded: 'md', outline: 'none', resize: 'vertical', _focus: { borderColor: 'accent.default', ring: '2px', ringColor: 'accent.default', ringOffset: '0' } })}
              />
              <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>{reason.length} / 10 characters minimum</p>
            </Box>

            <Box mb={4}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 2 })}>Additional Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className={css({ w: 'full', px: 3, py: 2, fontSize: 'sm', bg: 'bg.default', borderWidth: '1px', borderColor: 'border.default', rounded: 'md', outline: 'none', resize: 'vertical', _focus: { borderColor: 'accent.default', ring: '2px', ringColor: 'accent.default', ringOffset: '0' } })}
              />
            </Box>
          </Box>

          <Flex justify="flex-end" gap={3} p={6} borderTopWidth="1px" borderColor="border.default">
            <Button type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting} variant="outline" size="sm">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name || !slug || reason.length < 10 || (priceMonthly <= 0 && priceWeekly <= 0)} variant="solid" size="sm">
              {isSubmitting ? 'Creating...' : 'Create Plan'}
            </Button>
          </Flex>
        </form>
      </Box>
    </>
  )
}
