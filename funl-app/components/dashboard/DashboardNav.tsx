'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { css } from '@/styled-system/css';
import { Flex } from '@/styled-system/jsx';
import { NotificationBadge } from '@/components/messaging';
import { useUnreadMessageCount } from '@/hooks/use-unread-count';

interface DashboardNavProps {
  businessId: string;
}

export function DashboardNav({ businessId }: DashboardNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const unreadCount = useUnreadMessageCount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      href: '/dashboard',
      label: 'Funnels',
      exact: true
    },
    {
      href: '/dashboard/my-assets',
      label: 'My Assets'
    },
    {
      href: '/dashboard/stickers/buy',
      label: 'Buy Stickers'
    },
    {
      href: '/dashboard/stickers/reprint',
      label: 'Reprint'
    },
    {
      href: '/dashboard/messages',
      label: 'Messages',
      badge: unreadCount
    },
    {
      href: '/dashboard/testimonials',
      label: 'Testimonials'
    },
    {
      href: '/dashboard/analytics',
      label: 'Analytics'
    },
    {
      href: '/dashboard/settings',
      label: 'Settings'
    }
  ];

  const isActive = (href: string, exact = false) => {
    if (!mounted) return false;
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

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
            gap: 2,
            px: '1',
            pt: '1',
            fontSize: 'sm',
            fontWeight: 'medium',
            position: 'relative',
            cursor: 'pointer',
            _hover: {
              color: 'fg.default',
            },
          })}
        >
          {item.label}
          {item.badge !== undefined && item.badge > 0 && (
            <NotificationBadge count={item.badge} size="sm" />
          )}
        </button>
      ))}
    </Flex>
  );
}