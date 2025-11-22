'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { css } from '@/styled-system/css';
import { Flex } from '@/styled-system/jsx';
import { NotificationBadge } from '@/components/messaging';
import { useUnreadMessageCount } from '@/hooks/use-unread-count';

interface DashboardNavProps {
  businessId: string;
}

export function DashboardNav({ businessId }: DashboardNavProps) {
  const pathname = usePathname();
  const unreadCount = useUnreadMessageCount();

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
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

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
            gap: 2,
            px: '1',
            pt: '1',
            fontSize: 'sm',
            fontWeight: 'medium',
            position: 'relative',
            textDecoration: 'none',
            _hover: {
              borderColor: isActive(item.href, item.exact) ? 'accent.default' : 'border.default',
              color: 'fg.default',
              textDecoration: 'none',
            },
          })}
        >
          {item.label}
          {item.badge !== undefined && item.badge > 0 && (
            <NotificationBadge count={item.badge} size="sm" />
          )}
        </Link>
      ))}
    </Flex>
  );
}