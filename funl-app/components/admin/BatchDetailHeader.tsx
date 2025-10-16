'use client'

import { useState } from 'react'
import Link from 'next/link'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { BatchExportDialog } from './BatchExportDialog'
import type { QRCodeBatch } from '@/lib/types/qr-reservation'

interface BatchDetailHeaderProps {
  batch: {
    id: string
    batch_number: string
    name: string
    description?: string
    status: string
    quantity: number
    created_at: string
    style_preset_id?: string
    qr_code_presets?: {
      name: string
      slug: string
    }
    admins?: {
      name: string
    }
    totalCodes: number
    availableCodes: number
    assignedCodes: number
    reservedCodes: number
    damagedCodes: number
  }
}

export function BatchDetailHeader({ batch }: BatchDetailHeaderProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return { bg: 'gray.100', color: 'gray.800' }
      case 'exporting': return { bg: 'blue.100', color: 'blue.800' }
      case 'printing': return { bg: 'orange.100', color: 'orange.800' }
      case 'printed': return { bg: 'green.100', color: 'green.800' }
      case 'shipped': return { bg: 'purple.100', color: 'purple.800' }
      case 'received': return { bg: 'green.100', color: 'green.800' }
      case 'active': return { bg: 'green.100', color: 'green.800' }
      case 'depleted': return { bg: 'red.100', color: 'red.800' }
      default: return { bg: 'gray.100', color: 'gray.800' }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusColors = getStatusColor(batch.status)

  return (
    <Box mb={6}>
      {/* Breadcrumb */}
      <Flex align="center" gap={2} mb={4}>
        <Link
          href="/admin/qr-batches"
          className={css({
            fontSize: 'sm',
            color: 'accent.default',
            _hover: { textDecoration: 'underline' }
          })}
        >
          QR Batches
        </Link>
        <span className={css({ color: 'fg.muted' })}>›</span>
        <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>
          {batch.batch_number}
        </span>
      </Flex>

      {/* Header Content */}
      <Flex justify="space-between" align="start" mb={4}>
        <Box>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'fg.default', mb: 2 })}>
            {batch.name}
          </h1>
          <p className={css({ fontSize: 'lg', color: 'fg.muted', mb: 2 })}>
            {batch.batch_number}
          </p>
          {batch.description && (
            <p className={css({ color: 'fg.muted', mb: 3 })}>
              {batch.description}
            </p>
          )}

          {/* Metadata */}
          <Flex align="center" gap={4} wrap="wrap">
            <span
              className={css({
                px: 3,
                py: 1,
                bg: statusColors.bg,
                color: statusColors.color,
                rounded: 'md',
                fontSize: 'sm',
                fontWeight: 'medium'
              })}
            >
              {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
            </span>

            <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              Created {formatDate(batch.created_at)}
            </span>

            {batch.admins?.name && (
              <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                by {batch.admins.name}
              </span>
            )}

            {batch.qr_code_presets?.name && (
              <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                Style: {batch.qr_code_presets.name}
              </span>
            )}
          </Flex>
        </Box>

        {/* Action Buttons */}
        <Flex gap={2}>
          <button
            className={css({
              px: 4,
              py: 2,
              border: '1px solid',
              borderColor: 'border.default',
              rounded: 'md',
              fontSize: 'sm',
              bg: 'bg.default',
              color: 'fg.default',
              _hover: { bg: 'bg.subtle' }
            })}
            onClick={() => window.open(`/api/admin/qr-codes/batches/${batch.id}/export`, '_blank')}
          >
            Export CSV
          </button>

          <button
            className={css({
              px: 4,
              py: 2,
              bg: 'accent.default',
              color: 'white',
              rounded: 'md',
              fontSize: 'sm',
              _hover: { bg: 'accent.emphasized' }
            })}
            onClick={() => setExportDialogOpen(true)}
          >
            Export PDFs
          </button>
        </Flex>
      </Flex>

      {/* Export Dialog */}
      {exportDialogOpen && (
        <BatchExportDialog
          batch={{
            id: batch.id,
            batch_number: batch.batch_number,
            name: batch.name,
            description: batch.description,
            quantity: batch.quantity,
            style_preset_id: batch.style_preset_id,
            status: batch.status as QRCodeBatch['status'],
            quantity_available: batch.availableCodes,
            quantity_reserved: batch.reservedCodes,
            quantity_assigned: batch.assignedCodes,
            quantity_damaged: batch.damagedCodes,
            sequence_counter: 0,
            export_settings: {},
            created_at: new Date(batch.created_at),
            updated_at: new Date(batch.created_at)
          }}
          isOpen={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
        />
      )}

      {/* Quick Stats Summary */}
      <Box p={4} bg="bg.subtle" rounded="lg" borderWidth="1px" borderColor="border.default">
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <div>
            <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>Usage: </span>
            <span className={css({ fontWeight: 'medium' })}>
              {batch.assignedCodes} assigned, {batch.availableCodes} available
            </span>
            {batch.reservedCodes > 0 && (
              <span className={css({ color: 'orange.600', ml: 2 })}>
                ({batch.reservedCodes} reserved)
              </span>
            )}
            {batch.damagedCodes > 0 && (
              <span className={css({ color: 'red.600', ml: 2 })}>
                ({batch.damagedCodes} damaged/lost)
              </span>
            )}
          </div>

          <div>
            <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>
              {Math.round((batch.assignedCodes / batch.totalCodes) * 100)}% utilized
            </span>
          </div>
        </Flex>
      </Box>
    </Box>
  )
}