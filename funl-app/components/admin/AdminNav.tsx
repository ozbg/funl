'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { css } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'

export function AdminNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/admin',
      label: 'Overview',
      exact: true
    },
    {
      href: '/admin/business-categories',
      label: 'Business Categories'
    },
    {
      href: '/admin/funnel-types',
      label: 'Funnel Types'
    },
    {
      href: '/admin/qr-presets',
      label: 'QR Presets'
    },
    {
      href: '/admin/qr-batches',
      label: 'QR Batches'
    },
    {
      href: '/admin/users',
      label: 'Users'
    }
  ]

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <Flex gap="8" display={{ base: 'none', sm: 'flex' }}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={css({
            borderBottom: '2px solid',
            borderColor: isActive(item.href, item.exact) ? 'accent.default' : 'transparent',
            color: isActive(item.href, item.exact) ? 'fg.default' : 'fg.muted',
            display: 'inline-flex',
            alignItems: 'center',
            px: '1',
            pt: '1',
            fontSize: 'sm',
            fontWeight: 'medium',
            _hover: {
              borderColor: isActive(item.href, item.exact) ? 'accent.default' : 'border.default',
              color: 'fg.default',
            },
          })}
        >
          {item.label}
        </Link>
      ))}
    </Flex>
  )
}