'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { BatchExportDialog } from './BatchExportDialog'
import type { QRCodeBatch } from '@/lib/types/qr-reservation'

interface QRBatchesTableProps {
  batches: QRCodeBatch[]
}

export function QRBatchesTable({ batches }: QRBatchesTableProps) {
  const router = useRouter()
  const [loadingBatch, setLoadingBatch] = useState<string | null>(null)
  const [exportDialogBatch, setExportDialogBatch] = useState<QRCodeBatch | null>(null)

  const getStatusColor = (status: QRCodeBatch['status']) => {
    switch (status) {
      case 'generated': return 'gray'
      case 'exporting': return 'blue'
      case 'printing': return 'orange'
      case 'printed': return 'green'
      case 'shipped': return 'purple'
      case 'received': return 'green'
      case 'active': return 'green'
      case 'depleted': return 'red'
      default: return 'gray'
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleStatusUpdate = async (batchId: string, newStatus: QRCodeBatch['status']) => {
    setLoadingBatch(batchId)

    try {
      const response = await fetch(`/api/admin/qr-codes/batches/${batchId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating batch status:', error)
      alert('Failed to update batch status')
    } finally {
      setLoadingBatch(null)
    }
  }

  const getNextStatus = (currentStatus: QRCodeBatch['status']): QRCodeBatch['status'] | null => {
    switch (currentStatus) {
      case 'generated': return 'printing'
      case 'printing': return 'printed'
      case 'printed': return 'shipped'
      case 'shipped': return 'received'
      case 'received': return 'active'
      default: return null
    }
  }

  const getNextStatusLabel = (currentStatus: QRCodeBatch['status']): string => {
    switch (currentStatus) {
      case 'generated': return 'Mark as Printing'
      case 'printing': return 'Mark as Printed'
      case 'printed': return 'Mark as Shipped'
      case 'shipped': return 'Mark as Received'
      case 'received': return 'Activate Batch'
      default: return ''
    }
  }

  if (batches.length === 0) {
    return (
      <Box p={8} textAlign="center">
        <p className={css({ color: 'fg.muted', mb: 2 })}>No batches created yet</p>
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
          Create your first batch to get started with bulk QR code generation
        </p>
      </Box>
    )
  }

  return (
    <div className={css({ overflowX: 'auto' })}>
      <table className={css({ w: 'full', borderCollapse: 'collapse' })}>
        <thead>
          <tr className={css({ borderBottom: '1px solid', borderColor: 'border.default' })}>
            <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Batch</th>
            <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Asset Type</th>
            <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Description</th>
            <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Status</th>
            <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Quantity</th>
            <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Available</th>
            <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Assigned</th>
            <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Created</th>
            <th className={css({ p: 3, textAlign: 'left', fontSize: 'sm', fontWeight: 'medium' })}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.id} className={css({ borderBottom: '1px solid', borderColor: 'border.default' })}>
              <td className={css({ p: 3 })}>
                <Box>
                  <button
                    onClick={() => router.push(`/admin/qr-batches/${batch.id}`)}
                    className={css({
                      fontWeight: 'medium',
                      color: 'accent.default',
                      _hover: { textDecoration: 'underline' }
                    })}
                  >
                    {batch.name}
                  </button>
                  <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>{batch.batch_number}</p>
                </Box>
              </td>
              <td className={css({ p: 3 })}>
                <Box>
                  <span className={css({
                    px: 2,
                    py: 1,
                    bg: 'blue.100',
                    color: 'blue.800',
                    rounded: 'sm',
                    fontSize: 'xs',
                    fontWeight: 'medium',
                    textTransform: 'capitalize'
                  })}>
                    {batch.asset_type}
                  </span>
                  {batch.asset_metadata?.size && (
                    <p className={css({ fontSize: 'xs', color: 'fg.muted', mt: 1 })}>
                      {batch.asset_metadata.size}
                    </p>
                  )}
                </Box>
              </td>
              <td className={css({ p: 3 })}>
                <span className={css({ fontSize: 'sm', color: 'fg.muted' })}>
                  {batch.description || 'No description'}
                </span>
              </td>
              <td className={css({ p: 3 })}>
                <span className={css({
                  px: 2,
                  py: 1,
                  bg: getStatusColor(batch.status) === 'green' ? 'green.100' : 'gray.100',
                  color: getStatusColor(batch.status) === 'green' ? 'green.800' : 'gray.800',
                  rounded: 'sm',
                  fontSize: 'xs'
                })}>
                  {batch.status}
                </span>
              </td>
              <td className={css({ p: 3 })}>{batch.quantity.toLocaleString()}</td>
              <td className={css({ p: 3 })}>
                <span className={css({ color: batch.quantity_available > 0 ? 'green.600' : 'red.600' })}>
                  {batch.quantity_available.toLocaleString()}
                </span>
              </td>
              <td className={css({ p: 3 })}>{batch.quantity_assigned.toLocaleString()}</td>
              <td className={css({ p: 3 })}>{formatDate(batch.created_at)}</td>
              <td className={css({ p: 3 })}>
                <Box className={css({ display: 'flex', gap: '2', flexWrap: 'wrap' })}>
                  <button
                    className={css({
                      px: 2,
                      py: 1,
                      bg: 'green.600',
                      color: 'white',
                      rounded: 'sm',
                      fontSize: 'xs',
                      fontWeight: 'medium'
                    })}
                    onClick={() => router.push(`/admin/qr-batches/${batch.id}`)}
                  >
                    View Details
                  </button>

                  <button
                    className={css({
                      px: 2,
                      py: 1,
                      border: '1px solid',
                      borderColor: 'border.default',
                      rounded: 'sm',
                      fontSize: 'xs'
                    })}
                    onClick={() => window.open(`/api/admin/qr-codes/batches/${batch.id}/export`, '_blank')}
                  >
                    CSV
                  </button>

                  <button
                    className={css({
                      px: 2,
                      py: 1,
                      bg: 'blue.600',
                      color: 'white',
                      rounded: 'sm',
                      fontSize: 'xs'
                    })}
                    onClick={() => setExportDialogBatch(batch)}
                  >
                    Export PDFs
                  </button>

                  {getNextStatus(batch.status) && (
                    <button
                      className={css({
                        px: 2,
                        py: 1,
                        bg: 'accent.default',
                        color: 'white',
                        rounded: 'sm',
                        fontSize: 'xs',
                        opacity: loadingBatch === batch.id ? 0.5 : 1
                      })}
                      disabled={loadingBatch === batch.id}
                      onClick={() => handleStatusUpdate(batch.id, getNextStatus(batch.status)!)}
                    >
                      {getNextStatusLabel(batch.status)}
                    </button>
                  )}
                </Box>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Export Dialog */}
      {exportDialogBatch && (
        <BatchExportDialog
          batch={exportDialogBatch}
          isOpen={!!exportDialogBatch}
          onClose={() => setExportDialogBatch(null)}
        />
      )}
    </div>
  )
}