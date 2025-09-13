'use client';

import { memo, useCallback } from 'react';
// import { Badge } from '@/components/ui/badge';
import type { MessageFilters as MessageFiltersType, MessageStatus, MessagePriority, MessageType } from '@/lib/messaging';

interface MessageFiltersProps {
  filters: MessageFiltersType;
  onFiltersChange: (filters: MessageFiltersType) => void;
  unreadCount?: number;
}

export const MessageFilters = memo<MessageFiltersProps>(({ 
  filters, 
  onFiltersChange,
  unreadCount = 0
}) => {
  const handleStatusFilter = useCallback((status: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status as MessageStatus)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status as MessageStatus];
    
    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined
    });
  }, [filters, onFiltersChange]);

  const handlePriorityFilter = useCallback((priority: string) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = currentPriorities.includes(priority as MessagePriority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority as MessagePriority];
    
    onFiltersChange({
      ...filters,
      priority: newPriorities.length > 0 ? newPriorities : undefined
    });
  }, [filters, onFiltersChange]);

  const handleTypeFilter = useCallback((type: string) => {
    const currentTypes = filters.type || [];
    const newTypes = currentTypes.includes(type as MessageType)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type as MessageType];
    
    onFiltersChange({
      ...filters,
      type: newTypes.length > 0 ? newTypes : undefined
    });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      limit: filters.limit,
      offset: 0
    });
  }, [filters.limit, onFiltersChange]);

  const hasActiveFilters = !!(
    filters.status?.length || 
    filters.priority?.length || 
    filters.type?.length
  );

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Status Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'unread', label: 'Unread', count: unreadCount },
            { value: 'read', label: 'Read' },
            { value: 'acknowledged', label: 'Acknowledged' },
            { value: 'responded', label: 'Responded' },
            { value: 'archived', label: 'Archived' }
          ].map(({ value, label, count }) => {
            const isActive = filters.status?.includes(value as MessageStatus);
            return (
              <button
                key={value}
                onClick={() => handleStatusFilter(value)}
                className={`
                  px-3 py-1 rounded-md text-sm transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                  }
                `}
              >
                {label}
                {count !== undefined && count > 0 && (
                  <span className="ml-1 font-medium">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Priority Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Priority</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'urgent', label: 'Urgent', color: 'red' },
            { value: 'high', label: 'High', color: 'orange' },
            { value: 'medium', label: 'Medium', color: 'yellow' },
            { value: 'low', label: 'Low', color: 'gray' }
          ].map(({ value, label }) => {
            const isActive = filters.priority?.includes(value as MessagePriority);
            return (
              <button
                key={value}
                onClick={() => handlePriorityFilter(value)}
                className={`
                  px-3 py-1 rounded-md text-sm transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                  }
                `}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Type</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'callback_request', label: 'Callback Request' },
            { value: 'system', label: 'System' },
            { value: 'notification', label: 'Notification' },
            { value: 'reminder', label: 'Reminder' }
          ].map(({ value, label }) => {
            const isActive = filters.type?.includes(value as MessageType);
            return (
              <button
                key={value}
                onClick={() => handleTypeFilter(value)}
                className={`
                  px-3 py-1 rounded-md text-sm transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                  }
                `}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

MessageFilters.displayName = 'MessageFilters';