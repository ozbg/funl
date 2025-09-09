'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Business } from '@/lib/types'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack } from '@/styled-system/jsx'

interface SettingsFormProps {
  business: Business
}

interface SettingsFormData {
  name: string
  type: 'individual' | 'agency'
  phone: string
  website: string
  vcard_data: {
    firstName: string
    lastName: string
    organization: string
    phone: string
    email: string
    website: string
  }
}

export default function SettingsForm({ business }: SettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsFormData>({
    defaultValues: {
      name: business.name || '',
      type: business.type || 'individual',
      phone: business.phone || '',
      website: business.website || '',
      vcard_data: {
        firstName: business.vcard_data?.firstName || '',
        lastName: business.vcard_data?.lastName || '',
        organization: business.vcard_data?.organization || '',
        phone: business.vcard_data?.phone || '',
        email: business.vcard_data?.email || business.email,
        website: business.vcard_data?.website || '',
      }
    }
  })

  const onSubmit = async (data: SettingsFormData) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/business/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update settings')
      }

      setSuccess(true)
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const inputStyles = css({
    w: 'full',
    px: 3,
    py: 2,
    borderWidth: '1px',
    borderColor: 'border.default',
    boxShadow: 'sm',
    bg: 'bg.default',
    color: 'fg.default',
    _focus: {
      outline: 'none',
      ringWidth: '2',
      ringColor: 'colorPalette.default',
      borderColor: 'colorPalette.default',
    },
  })

  const buttonStyles = css({
    colorPalette: 'mint',
    px: 4,
    py: 2,
    boxShadow: 'sm',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'colorPalette.fg',
    bg: 'colorPalette.default',
    cursor: 'pointer',
    _hover: {
      bg: 'colorPalette.emphasized',
    },
    _focus: {
      outline: 'none',
      ringWidth: '2',
      ringOffset: '2',
      ringColor: 'colorPalette.default',
    },
    _disabled: {
      opacity: 'disabled',
      cursor: 'not-allowed',
    },
  })

  return (
    <form className={css({ colorPalette: 'mint' })} onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={6}>
        {error && (
          <Box colorPalette="red" bg="colorPalette.default" p={4}>
            <p className={css({ colorPalette: 'red', fontSize: 'sm', color: 'colorPalette.fg' })}>{error}</p>
          </Box>
        )}

        {success && (
          <Box colorPalette="green" bg="colorPalette.default" p={4}>
            <p className={css({ colorPalette: 'green', fontSize: 'sm', color: 'colorPalette.fg' })}>Settings updated successfully!</p>
          </Box>
        )}

        {/* Business Information */}
        <Box>
          <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 4 })}>
            Business Information
          </h3>
          
          <Stack gap={4}>
            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Business Name
              </label>
              <input
                type="text"
                {...register('name', { required: 'Business name is required' })}
                className={inputStyles}
              />
              {errors.name && (
                <p className={css({ colorPalette: 'red', mt: 1, fontSize: 'sm', color: 'colorPalette.text' })}>{errors.name.message}</p>
              )}
            </Box>

            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Business Type
              </label>
              <select
                {...register('type')}
                className={inputStyles}
              >
                <option value="individual">Individual</option>
                <option value="agency">Agency</option>
              </select>
            </Box>

            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Phone Number
              </label>
              <input
                type="tel"
                {...register('phone')}
                className={inputStyles}
              />
            </Box>

            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Website
              </label>
              <input
                type="url"
                {...register('website')}
                className={inputStyles}
                placeholder="https://"
              />
            </Box>
          </Stack>
        </Box>

        {/* Contact Card Information */}
        <Box borderTopWidth="1px" borderColor="border.default" pt={6}>
          <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 4 })}>
            Contact Card Details
          </h3>
          <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 4 })}>
            This information will appear on your contact cards when prospects download them.
          </p>

          <Stack gap={4}>
            <Flex gap={4}>
              <Box flex={1}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                  First Name
                </label>
                <input
                  type="text"
                  {...register('vcard_data.firstName', { required: 'First name is required' })}
                  className={inputStyles}
                />
                {errors.vcard_data?.firstName && (
                  <p className={css({ colorPalette: 'red', mt: 1, fontSize: 'sm', color: 'colorPalette.text' })}>{errors.vcard_data.firstName.message}</p>
                )}
              </Box>

              <Box flex={1}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                  Last Name
                </label>
                <input
                  type="text"
                  {...register('vcard_data.lastName', { required: 'Last name is required' })}
                  className={inputStyles}
                />
                {errors.vcard_data?.lastName && (
                  <p className={css({ colorPalette: 'red', mt: 1, fontSize: 'sm', color: 'colorPalette.text' })}>{errors.vcard_data.lastName.message}</p>
                )}
              </Box>
            </Flex>

            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Organization
              </label>
              <input
                type="text"
                {...register('vcard_data.organization', { required: 'Organization is required' })}
                className={inputStyles}
              />
              {errors.vcard_data?.organization && (
                <p className={css({ colorPalette: 'red', mt: 1, fontSize: 'sm', color: 'colorPalette.text' })}>{errors.vcard_data.organization.message}</p>
              )}
            </Box>

            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Contact Phone
              </label>
              <input
                type="tel"
                {...register('vcard_data.phone', { required: 'Phone is required' })}
                className={inputStyles}
              />
              {errors.vcard_data?.phone && (
                <p className={css({ colorPalette: 'red', mt: 1, fontSize: 'sm', color: 'colorPalette.text' })}>{errors.vcard_data.phone.message}</p>
              )}
            </Box>

            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Email
              </label>
              <input
                type="email"
                {...register('vcard_data.email', { required: 'Email is required' })}
                className={inputStyles}
              />
              {errors.vcard_data?.email && (
                <p className={css({ colorPalette: 'red', mt: 1, fontSize: 'sm', color: 'colorPalette.text' })}>{errors.vcard_data.email.message}</p>
              )}
            </Box>

            <Box>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
                Website
              </label>
              <input
                type="url"
                {...register('vcard_data.website')}
                className={inputStyles}
                placeholder="https://"
              />
            </Box>
          </Stack>
        </Box>

        {/* Actions */}
        <Flex justify="end" pt={6} borderTop="1px solid" borderColor="border.default">
          <button
            type="submit"
            disabled={loading}
            className={buttonStyles}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </Flex>
      </Stack>
    </form>
  )
}