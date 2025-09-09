'use client'

import React from 'react'
import { useDrag } from 'react-dnd'
import { css } from '@/styled-system/css'
import { Box, Stack, Grid } from '@/styled-system/jsx'

interface PaletteItemProps {
  type: 'qr_code' | 'text' | 'image'
  field?: string
  label: string
  icon: string
  description?: string
}

function PaletteItem({ type, field, label, icon, description }: PaletteItemProps) {
  const [{ isDragging }, drag] = useDrag({
    type,
    item: { type, field },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  return (
    <Box
      ref={drag}
      cursor="grab"
      opacity={isDragging ? 0.5 : 1}
      bg="bg.default"
      borderWidth="1px"
      borderColor="border.default"
      p={3}
      textAlign="center"
      _hover={{
        borderColor: 'mint.default',
        bg: 'mint.subtle'
      }}
      _active={{
        cursor: 'grabbing'
      }}
    >
      <Box fontSize="xl" mb={1}>
        {icon}
      </Box>
      <p className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.default', mb: 1 })}>
        {label}
      </p>
      {description && (
        <p className={css({ fontSize: '2xs', color: 'fg.muted' })}>
          {description}
        </p>
      )}
    </Box>
  )
}

export default function ElementPalette() {
  const qrElements = [
    {
      type: 'qr_code' as const,
      label: 'QR Code',
      icon: '📱',
      description: 'Scannable QR code'
    }
  ]

  const textElements = [
    {
      type: 'text' as const,
      field: 'business_name',
      label: 'Business Name',
      icon: '🏢',
      description: 'Company name'
    },
    {
      type: 'text' as const,
      field: 'custom_message',
      label: 'Custom Message',
      icon: '💬',
      description: 'Marketing message'
    },
    {
      type: 'text' as const,
      field: 'contact_phone',
      label: 'Phone Number',
      icon: '📞',
      description: 'Contact phone'
    },
    {
      type: 'text' as const,
      field: 'contact_email',
      label: 'Email',
      icon: '✉️',
      description: 'Contact email'
    },
    {
      type: 'text' as const,
      field: 'website',
      label: 'Website',
      icon: '🌐',
      description: 'Website URL'
    },
    {
      type: 'text' as const,
      field: 'funnel_name',
      label: 'Funnel Name',
      icon: '🎯',
      description: 'Name of funnel'
    }
  ]

  const imageElements = [
    {
      type: 'image' as const,
      field: 'logo',
      label: 'Logo',
      icon: '🖼️',
      description: 'Business logo'
    }
  ]

  return (
    <Box>
      <h3 className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.default', mb: 3 })}>
        Element Palette
      </h3>
      <p className={css({ fontSize: 'xs', color: 'fg.muted', mb: 4 })}>
        Drag elements onto the canvas to add them to your layout
      </p>

      <Stack gap={4}>
        {/* QR Code Section */}
        <Box>
          <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2, textTransform: 'uppercase', letterSpacing: 'wide' })}>
            QR Code
          </h4>
          <Grid columns={2} gap={2}>
            {qrElements.map((element, index) => (
              <PaletteItem
                key={index}
                type={element.type}
                field={element.field}
                label={element.label}
                icon={element.icon}
                description={element.description}
              />
            ))}
          </Grid>
        </Box>

        {/* Text Fields Section */}
        <Box>
          <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2, textTransform: 'uppercase', letterSpacing: 'wide' })}>
            Text Fields
          </h4>
          <Grid columns={2} gap={2}>
            {textElements.map((element, index) => (
              <PaletteItem
                key={index}
                type={element.type}
                field={element.field}
                label={element.label}
                icon={element.icon}
                description={element.description}
              />
            ))}
          </Grid>
        </Box>

        {/* Images Section */}
        <Box>
          <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2, textTransform: 'uppercase', letterSpacing: 'wide' })}>
            Images
          </h4>
          <Grid columns={2} gap={2}>
            {imageElements.map((element, index) => (
              <PaletteItem
                key={index}
                type={element.type}
                field={element.field}
                label={element.label}
                icon={element.icon}
                description={element.description}
              />
            ))}
          </Grid>
        </Box>
      </Stack>

      {/* Instructions */}
      <Box mt={6} p={3} bg="bg.subtle" borderWidth="1px" borderColor="border.default">
        <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'fg.default', mb: 2 })}>
          How to Use
        </h4>
        <Stack gap={1}>
          <p className={css({ fontSize: '2xs', color: 'fg.muted' })}>
            • Drag elements onto the canvas
          </p>
          <p className={css({ fontSize: '2xs', color: 'fg.muted' })}>
            • Click to select and edit properties
          </p>
          <p className={css({ fontSize: '2xs', color: 'fg.muted' })}>
            • Position with precision using the grid
          </p>
          <p className={css({ fontSize: '2xs', color: 'fg.muted' })}>
            • QR code is required for every layout
          </p>
        </Stack>
      </Box>
    </Box>
  )
}