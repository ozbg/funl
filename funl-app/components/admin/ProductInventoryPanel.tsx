'use client'

import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'

interface InventoryItem {
  id: string
  quantity_allocated: number
  quantity_remaining: number
  batch: {
    id: string
    batch_name: string
    total_quantity: number
    used_quantity: number
  }
}

interface ProductInventoryPanelProps {
  productId: string
  inventory: never | InventoryItem[]
}

export function ProductInventoryPanel({ productId: _productId, inventory }: ProductInventoryPanelProps) {
  const items = (Array.isArray(inventory) ? inventory : []) as InventoryItem[]

  if (items.length === 0) {
    return (
      <Box p={4} bg="bg.muted" rounded="md" textAlign="center">
        <p className={css({ fontSize: 'sm', color: 'fg.muted' })}>
          No batches linked to this product yet
        </p>
      </Box>
    )
  }

  return (
    <Box>
      {items.map((item) => (
        <Box
          key={item.id}
          p={4}
          mb={3}
          bg="bg.muted"
          rounded="md"
          borderWidth="1px"
          borderColor="border.default"
        >
          <Flex justify="space-between" align="start" mb={2}>
            <Box>
              <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default' })}>
                {item.batch.batch_name}
              </p>
              <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                Batch: {item.batch.used_quantity} / {item.batch.total_quantity} used
              </p>
            </Box>
            <span className={css({
              px: 2,
              py: 1,
              fontSize: 'xs',
              fontWeight: 'medium',
              rounded: 'md',
              color: item.quantity_remaining > 0 ? 'green.700' : 'gray.700',
              bg: item.quantity_remaining > 0 ? 'green.100' : 'gray.100'
            })}>
              {item.quantity_remaining} / {item.quantity_allocated}
            </span>
          </Flex>
          <Box w="full" h="2" bg="gray.200" rounded="full" overflow="hidden">
            <Box
              h="full"
              w={`${(item.quantity_remaining / item.quantity_allocated) * 100}%`}
              bg="green.500"
              transition="all 0.3s ease"
            />
          </Box>
        </Box>
      ))}
    </Box>
  )
}
