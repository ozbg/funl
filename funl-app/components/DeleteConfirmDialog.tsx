'use client'

import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  funnelName: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
}

export default function DeleteConfirmDialog({
  isOpen,
  funnelName,
  onConfirm,
  onCancel,
  isDeleting = false
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null

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
      onClick={onCancel}
    >
      <Box
        bg="bg.default"
        borderWidth="1px"
        borderColor="border.default"
        boxShadow="lg"
        maxW="md"
        w="full"
        mx={4}
        p={6}
        onClick={(e) => e.stopPropagation()}
      >
        <Box mb={4}>
          <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'fg.default' })}>
            Delete Funnel
          </h2>
          <p className={css({ mt: 2, fontSize: 'sm', color: 'fg.muted' })}>
            Are you sure you want to delete <strong>{funnelName}</strong>?
          </p>
          <p className={css({ mt: 2, fontSize: 'sm', color: 'red.600' })}>
            This action cannot be undone. All analytics data and callback requests for this funnel will be permanently deleted.
          </p>
        </Box>

        <Flex gap={3} justify="flex-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className={css({
              px: 4,
              py: 2,
              borderWidth: '1px',
              borderColor: 'border.default',
              fontSize: 'sm',
              fontWeight: 'medium',
              color: 'fg.default',
              bg: 'bg.default',
              cursor: 'pointer',
              _hover: { bg: 'bg.muted' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' }
            })}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={css({
              px: 4,
              py: 2,
              fontSize: 'sm',
              fontWeight: 'medium',
              color: 'white',
              bg: 'red.600',
              cursor: 'pointer',
              _hover: { bg: 'red.700' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' }
            })}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </Flex>
      </Box>
    </Box>
  )
}