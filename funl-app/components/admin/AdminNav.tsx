'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'

export function AdminNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    if (!mounted) return false
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <Flex gap="8" display={{ base: 'none', sm: 'flex' }}>
      {navItems.map((item) => (
        <button
          key={item.href}
          onClick={() => router.push(item.href)}
          className={css({
            background: 'transparent',
            border: 'none',
            borderBottom: isActive(item.href, item.exact) ? '2px solid' : 'none',
            borderColor: isActive(item.href, item.exact) ? 'accent.default' : 'transparent',
            color: isActive(item.href, item.exact) ? 'fg.default' : 'fg.muted',
            display: 'inline-flex',
            alignItems: 'center',
            px: '1',
            pt: '1',
            fontSize: 'sm',
            fontWeight: 'medium',
            cursor: 'pointer',
            _hover: {
              color: 'fg.default',
            },
          })}
        >
          {item.label}
        </button>
      ))}
    </Flex>
  )
}