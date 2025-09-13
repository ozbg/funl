'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const NotificationBadge = memo<NotificationBadgeProps>(({ 
  count,
  maxCount = 99,
  size = 'sm',
  pulse = true
}) => {
  if (count === 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5',
    md: 'text-sm px-2 py-1 min-w-[1.5rem] h-6',
    lg: 'text-base px-2.5 py-1.5 min-w-[2rem] h-8'
  };

  return (
    <Badge 
      variant="solid" 
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center font-semibold
        ${pulse ? 'animate-pulse' : ''}
      `}
    >
      {displayCount}
    </Badge>
  );
});

NotificationBadge.displayName = 'NotificationBadge';