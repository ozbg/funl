'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { css } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'
import { Button } from '@/components/ui/button'

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
      href: '/admin/businesses',
      label: 'Businesses'
    },
    {
      href: '/admin/orders',
      label: 'Orders'
    },
    {
      href: '/admin/subscriptions',
      label: 'Subscriptions'
    },
    {
      href: '/admin/plans',
      label: 'Plans'
    },
    {
      href: '/admin/products',
      label: 'Products'
    },
    {
      href: '/admin/qr-batches',
      label: 'QR Batches'
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
        <Button
          key={item.href}
          onClick={() => router.push(item.href)}
          variant="ghost"
          size="sm"
          className={css({
            borderBottom: isActive(item.href, item.exact) ? '2px solid' : 'none',
            borderColor: isActive(item.href, item.exact) ? 'accent.default' : 'transparent',
            color: isActive(item.href, item.exact) ? 'fg.default' : 'fg.muted',
            borderRadius: 0,
          })}
        >
          {item.label}
        </Button>
      ))}
    </Flex>
  )
}