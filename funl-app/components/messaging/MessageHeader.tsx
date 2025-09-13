'use client';

import { memo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';

interface MessageHeaderProps {
  unreadCount: number;
  totalCount: number;
  loading?: boolean;
  onRefresh?: () => void;
  onBulkAcknowledge?: () => void;
  selectedCount?: number;
}

export const MessageHeader = memo<MessageHeaderProps>(({ 
  unreadCount,
  totalCount,
  loading = false,
  onRefresh,
  onBulkAcknowledge,
  selectedCount = 0
}) => {
  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const handleBulkAcknowledge = useCallback(() => {
    onBulkAcknowledge?.();
  }, [onBulkAcknowledge]);

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Selected:</span>
              <Badge variant="outline">{selectedCount}</Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk Actions */}
          {selectedCount > 0 && onBulkAcknowledge && (
            <button
              onClick={handleBulkAcknowledge}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Acknowledge Selected ({selectedCount})
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`
              p-2 rounded-lg border transition-colors
              ${loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-700'
              }
            `}
            title="Refresh messages"
          >
            <svg 
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
});

MessageHeader.displayName = 'MessageHeader';