'use client'

import { useState } from 'react'
import Link from 'next/link'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'
import ToggleButton from './ToggleButton'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import AssignCodeModal from '@/components/AssignCodeModal'
import { Funnel } from '@/lib/types'

interface FunnelRowProps {
  funnel: Funnel
}

export default function FunnelRow({ funnel }: FunnelRowProps) {
  const [status, setStatus] = useState(funnel.status)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Check if this funnel has an assigned code (from reserved_codes table)
  const assignedCode = (funnel as Funnel & { reserved_codes?: { code: string } | null }).reserved_codes
  const hasAssignedCode = Array.isArray(assignedCode) ? assignedCode.length > 0 : Boolean(assignedCode)
  const codeValue = Array.isArray(assignedCode) ? assignedCode[0]?.code : assignedCode?.code

  // Check if this funnel has a manual/generated code (not from reserved_codes)
  const hasManualCode = !funnel.reserved_code_id && funnel.short_url && funnel.code_source === 'generated'
  const manualCodeValue = hasManualCode ? funnel.short_url : null

  // Determine if funnel has any code at all (either assigned or manual)
  const hasAnyCode = hasAssignedCode || hasManualCode
  const displayCode = codeValue || manualCodeValue
  
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as typeof funnel.status)
  }
  
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/funnels/${funnel.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        // Show success message with code release info if applicable
        if (data.codes_released && data.codes_released > 0) {
          const viewInventory = confirm(
            `${data.message}\n\nWould you like to view your QR sticker inventory?`
          )
          if (viewInventory) {
            window.location.href = '/dashboard/my-stickers'
            return
          }
        }
        // Refresh the page to update the funnel list
        window.location.reload()
      } else {
        console.error('Failed to delete funnel:', data.error)
        alert(data.error || 'Failed to delete funnel. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting funnel:', error)
      alert('Failed to delete funnel. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <Box px={{ base: 4, sm: 6 }} py={4}>
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={4}>
          <Box flexShrink={0}>
            <Badge 
              variant={status === 'active' ? 'solid' : 'subtle'}
              colorPalette={status === 'active' ? 'green' : status === 'paused' ? 'orange' : 'gray'}
              size="md"
              className={css({ borderRadius: '0' })}
            >
              <Flex align="center" gap={1.5}>
                <Box 
                  className={css({
                    w: 2, 
                    h: 2, 
                    borderRadius: 'full',
                    bg: status === 'active' ? 'green.500' : status === 'paused' ? 'orange.500' : 'gray.400',
                    animation: status === 'active' ? 'pulse 2s infinite' : undefined
                  })}
                />
                <span className={css({ fontSize: 'xs', fontWeight: 'medium', textTransform: 'capitalize' })}>
                  {status}
                </span>
              </Flex>
            </Badge>
          </Box>
          <Box>
            <Link
              href={`/dashboard/funnels/${funnel.id}`}
              className={css({
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'fg.default',
                textDecoration: 'none',
                _hover: {
                  textDecoration: 'underline'
                }
              })}
            >
              {funnel.name}
            </Link>
            <Flex align="center" gap={2} fontSize="sm" color="fg.muted">
              <span>Type: {funnel.type}</span>
              {hasAnyCode && (
                <>
                  <span>•</span>
                  <Badge
                    colorPalette={hasManualCode ? 'purple' : 'blue'}
                    size="sm"
                    variant="subtle"
                  >
                    {hasManualCode && '✏️ '}Code: {displayCode}
                  </Badge>
                </>
              )}
            </Flex>
            <Box fontSize="xs" color="fg.muted" mt={1}>
              Created {new Date(funnel.created_at).toISOString().split('T')[0]}
            </Box>
          </Box>
        </Flex>
        <Flex gap={2} flexWrap="wrap">
          <ToggleButton
            funnelId={funnel.id}
            currentStatus={status}
            onStatusChange={handleStatusChange}
          />

          {/* Assign Code Button - Only show if no code at all (neither assigned nor manual) */}
          {!hasAnyCode && (
            <button
              onClick={() => setShowAssignModal(true)}
              className={css({
                colorPalette: 'blue',
                px: 3,
                py: 1,
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'colorPalette.default',
                borderWidth: '1px',
                borderColor: 'colorPalette.default',
                bg: 'transparent',
                _hover: { bg: 'colorPalette.subtle' }
              })}
            >
              + Code
            </button>
          )}

          <IconButton
            size="sm"
            variant="ghost"
            onClick={() => setShowDeleteDialog(true)}
            className={css({
              color: 'red.600',
              _hover: { bg: 'red.50', color: 'red.700' },
            })}
            aria-label="Delete funnel"
          >
            <svg className={css({ w: 4, h: 4 })} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </IconButton>
          <Link
            href={`/dashboard/funnels/new?edit=${funnel.id}`}
            className={css({
              colorPalette: 'mint',
              px: 3,
              py: 1,
              fontSize: 'sm',
              fontWeight: 'medium',
              color: 'colorPalette.default',
              textDecoration: 'none',
              _hover: { color: 'colorPalette.emphasized' }
            })}
          >
            Edit
          </Link>
          <Link
            href={`/f/${displayCode || funnel.short_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className={css({
              colorPalette: 'mint',
              px: 3,
              py: 1,
              fontSize: 'sm',
              fontWeight: 'medium',
              color: 'colorPalette.default',
              textDecoration: 'none',
              _hover: { color: 'colorPalette.emphasized' }
            })}
          >
            Preview
          </Link>
          <Link
            href={`/dashboard/funnels/${funnel.id}`}
            className={css({
              colorPalette: 'mint',
              px: 3,
              py: 1,
              fontSize: 'sm',
              fontWeight: 'medium',
              color: 'colorPalette.default',
              textDecoration: 'none',
              _hover: { color: 'colorPalette.emphasized' }
            })}
          >
            Sticker
          </Link>
        </Flex>
      </Flex>
      
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        funnelName={funnel.name}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        isDeleting={isDeleting}
      />

      <AssignCodeModal
        isOpen={showAssignModal}
        funnelId={funnel.id}
        funnelName={funnel.name}
        onClose={() => setShowAssignModal(false)}
        stickerDownloaded={funnel.sticker_downloaded}
      />
    </Box>
  )
}