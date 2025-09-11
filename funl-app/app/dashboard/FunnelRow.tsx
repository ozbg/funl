'use client'

import { useState } from 'react'
import Link from 'next/link'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import ToggleButton from './ToggleButton'
import { Funnel } from '@/lib/types'

interface FunnelRowProps {
  funnel: Funnel
}

export default function FunnelRow({ funnel }: FunnelRowProps) {
  const [status, setStatus] = useState(funnel.status)

  return (
    <Box px={{ base: 4, sm: 6 }} py={4}>
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={4}>
          <Box flexShrink={0}>
            <Flex
              h={10}
              w={10}
              borderRadius="full"
              colorPalette="mint"
              bg="colorPalette.default"
              align="center"
              justify="center"
            >
              <span className={css({ colorPalette: 'mint', color: 'colorPalette.fg', fontWeight: 'medium', fontSize: 'sm' })}>
                {funnel.name.charAt(0).toUpperCase()}
              </span>
            </Flex>
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
            <Box fontSize="sm" color="fg.muted">
              Type: {funnel.type} • Status: {status}
            </Box>
            <Box fontSize="xs" color="fg.muted" mt={1}>
              Created {new Date(funnel.created_at).toLocaleDateString()}
            </Box>
          </Box>
        </Flex>
        <Flex gap={2}>
          <ToggleButton 
            funnelId={funnel.id}
            currentStatus={status}
            onStatusChange={setStatus}
          />
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
    </Box>
  )
}