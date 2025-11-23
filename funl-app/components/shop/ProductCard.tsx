'use client'

import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  thumbnail_url?: string
  lowest_price: number
  in_stock: boolean
  low_stock: boolean
  current_stock: number
  featured: boolean
  tracks_inventory: boolean
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/dashboard/stickers/shop/${product.slug}`}>
      <Box
        bg="bg.default"
        rounded="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor="border.default"
        overflow="hidden"
        cursor="pointer"
        _hover={{ borderColor: 'blue.500', boxShadow: 'md' }}
        transition="all 0.2s"
        height="100%"
        display="flex"
        flexDirection="column"
      >
        {/* Product Image */}
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.name}
            className={css({ width: '100%', height: '240px', objectFit: 'cover' })}
          />
        ) : (
          <Box
            width="100%"
            height="240px"
            bg="gray.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box
              width="120px"
              height="120px"
              bg="gray.200"
              rounded="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className={css({ color: 'gray.400' })}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                <path d="M3 9h18M9 21V9" strokeWidth="2" />
              </svg>
            </Box>
          </Box>
        )}

        {/* Product Info */}
        <Box p={5} flex={1} display="flex" flexDirection="column">
          <Box flex={1}>
            {/* Product Name */}
            <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
              {product.name}
            </h3>

            {/* Description */}
            {product.description && (
              <p className={css({ fontSize: 'sm', color: 'fg.muted', mb: 3, lineClamp: 2 })}>
                {product.description}
              </p>
            )}
          </Box>

          {/* Stock Status */}
          {product.tracks_inventory && (
            <Flex gap={2} align="center" mb={3}>
              <Box
                w={2}
                h={2}
                rounded="full"
                bg={!product.in_stock ? 'red.500' : product.low_stock ? 'orange.500' : 'green.500'}
              />
              <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                {!product.in_stock
                  ? 'Out of stock'
                  : product.low_stock
                  ? `Only ${product.current_stock} left`
                  : 'In stock'}
              </p>
            </Flex>
          )}

          {/* Price */}
          <Flex justify="space-between" align="center">
            <Box>
              <p className={css({ fontSize: 'xs', color: 'fg.muted' })}>Starting from</p>
              <p className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'blue.600' })}>
                ${product.lowest_price.toFixed(2)}
              </p>
            </Box>

            {/* Shop Now Button */}
            <Box
              px={4}
              py={2}
              bg="blue.600"
              color="white"
              rounded="md"
              fontSize="sm"
              fontWeight="medium"
              _hover={{ bg: 'blue.700' }}
            >
              Shop Now
            </Box>
          </Flex>
        </Box>

        {/* Featured Badge */}
        {product.featured && (
          <Box
            position="absolute"
            top={3}
            right={3}
            px={2}
            py={1}
            bg="yellow.500"
            color="white"
            rounded="md"
            fontSize="xs"
            fontWeight="semibold"
            boxShadow="md"
          >
            Featured
          </Box>
        )}

        {/* Out of Stock Overlay */}
        {!product.in_stock && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.5)"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box
              px={4}
              py={2}
              bg="red.600"
              color="white"
              rounded="md"
              fontSize="sm"
              fontWeight="semibold"
            >
              Out of Stock
            </Box>
          </Box>
        )}
      </Box>
    </Link>
  )
}
