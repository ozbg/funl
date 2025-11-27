'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price_monthly: number
  price_weekly: number
  billing_period: 'monthly' | 'weekly'
  funnel_limit: number
  trial_period_days: number
  is_active: boolean
  is_default: boolean
  featured: boolean
}

interface EditPlanDialogProps {
  plan: Plan
  onSuccess: () => void
}

export function EditPlanDialog({ plan, onSuccess }: EditPlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: plan.name,
    description: plan.description || '',
    price_monthly: (plan.price_monthly / 100).toFixed(2),
    price_weekly: (plan.price_weekly / 100).toFixed(2),
    billing_period: plan.billing_period,
    funnel_limit: plan.funnel_limit.toString(),
    trial_period_days: plan.trial_period_days.toString(),
    is_active: plan.is_active,
    is_default: plan.is_default,
    featured: plan.featured,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: plan.slug,
          description: formData.description || null,
          price_monthly: Math.round(parseFloat(formData.price_monthly) * 100),
          price_weekly: Math.round(parseFloat(formData.price_weekly) * 100),
          billing_period: formData.billing_period, // Default - customers can choose at checkout
          funnel_limit: parseInt(formData.funnel_limit),
          trial_period_days: parseInt(formData.trial_period_days),
          is_active: formData.is_active,
          is_default: formData.is_default,
          featured: formData.featured,
          reason: 'Updated plan settings via admin panel',
          notes: 'Updated from plans management interface'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update plan')
      }

      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error('Error updating plan:', error)
      alert(error instanceof Error ? error.message : 'Failed to update plan')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={css({
          px: 3,
          py: 1,
          fontSize: 'xs',
          fontWeight: 'medium',
          color: 'accent.default',
          cursor: 'pointer',
          _hover: { textDecoration: 'underline' }
        })}
      >
        Edit
      </button>
    )
  }

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.5)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={50}
      onClick={() => setIsOpen(false)}
    >
      <Box
        bg="bg.default"
        rounded="lg"
        boxShadow="lg"
        w="full"
        maxW="2xl"
        p={6}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: 4 })}>Edit Plan</h2>

        <form onSubmit={handleSubmit}>
          <Box mb={4}>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
              Plan Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={css({
                w: 'full',
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm'
              })}
            />
          </Box>

          <Box mb={4}>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={css({
                w: 'full',
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm'
              })}
            />
          </Box>

          <Flex gap={4} mb={4}>
            <Box flex={1}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                Monthly Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_monthly}
                onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                required
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  fontSize: 'sm'
                })}
              />
            </Box>

            <Box flex={1}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                Weekly Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_weekly}
                onChange={(e) => setFormData({ ...formData, price_weekly: e.target.value })}
                required
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  fontSize: 'sm'
                })}
              />
            </Box>
          </Flex>

          <Flex gap={4} mb={4}>
            <Box flex={1}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                Funnel Limit
              </label>
              <input
                type="number"
                value={formData.funnel_limit}
                onChange={(e) => setFormData({ ...formData, funnel_limit: e.target.value })}
                required
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  fontSize: 'sm'
                })}
              />
            </Box>

            <Box flex={1}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
                Trial Days
              </label>
              <input
                type="number"
                value={formData.trial_period_days}
                onChange={(e) => setFormData({ ...formData, trial_period_days: e.target.value })}
                required
                className={css({
                  w: 'full',
                  px: 3,
                  py: 2,
                  borderWidth: '1px',
                  borderColor: 'border.default',
                  rounded: 'md',
                  fontSize: 'sm'
                })}
              />
            </Box>
          </Flex>

          <Box mb={4}>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: 1 })}>
              Default Billing Period
            </label>
            <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 2 })}>
              Customers can choose their preferred billing frequency at checkout
            </p>
            <select
              value={formData.billing_period}
              onChange={(e) => setFormData({ ...formData, billing_period: e.target.value as 'monthly' | 'weekly' })}
              className={css({
                w: 'full',
                px: 3,
                py: 2,
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'md',
                fontSize: 'sm',
                cursor: 'pointer'
              })}
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </Box>

          <Flex gap={4} mb={4}>
            <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span className={css({ fontSize: 'sm' })}>Active</span>
            </label>

            <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              />
              <span className={css({ fontSize: 'sm' })}>Default Plan</span>
            </label>

            <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              />
              <span className={css({ fontSize: 'sm' })}>Featured</span>
            </label>
          </Flex>

          <Flex gap={3} justify="flex-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={css({
                px: 4,
                py: 2,
                fontSize: 'sm',
                fontWeight: 'medium',
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'md',
                cursor: 'pointer',
                _hover: { bg: 'bg.muted' }
              })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={css({
                px: 4,
                py: 2,
                fontSize: 'sm',
                fontWeight: 'medium',
                bg: 'accent.default',
                color: 'white',
                rounded: 'md',
                cursor: 'pointer',
                opacity: isLoading ? 0.5 : 1,
                _hover: { opacity: 0.9 }
              })}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </Flex>
        </form>
      </Box>
    </Box>
  )
}
