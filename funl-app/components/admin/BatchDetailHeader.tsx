'use client'

import { useState } from 'react'
import Link from 'next/link'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'
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
      case 'generated': return { bg: 'bg.muted', color: 'fg.muted' }
      case 'exporting': return { bg: 'bg.muted', color: 'fg.default' }
      case 'printing': return { bg: 'bg.muted', color: 'fg.default' }
      case 'printed': return { bg: 'bg.muted', color: 'accent.default' }
      case 'shipped': return { bg: 'bg.muted', color: 'fg.default' }
      case 'received': return { bg: 'bg.muted', color: 'accent.default' }
      case 'active': return { bg: 'bg.muted', color: 'accent.default' }
      case 'depleted': return { bg: 'bg.muted', color: 'fg.muted' }
      default: return { bg: 'bg.muted', color: 'fg.muted' }
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
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/admin/qr-codes/batches/${batch.id}/export`, '_blank')}>
            Export CSV
          </Button>

          <Button variant="solid" size="sm" onClick={() => setExportDialogOpen(true)}>
            Export PDFs
          </Button>
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
            asset_type: 'sticker',
            asset_metadata: {},
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
              <span className={css({ color: 'fg.muted', ml: 2 })}>
                ({batch.reservedCodes} reserved)
              </span>
            )}
            {batch.damagedCodes > 0 && (
              <span className={css({ color: 'fg.muted', ml: 2 })}>
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