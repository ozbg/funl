'use client';

import { memo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import type { Message } from '@/lib/messaging';

interface MessageCardProps {
  message: Message;
  onAcknowledge?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onClick?: (message: Message) => void;
}

export const MessageCard = memo<MessageCardProps>(({ 
  message, 
  onAcknowledge,
  onDelete,
  onClick 
}) => {
  const handleAcknowledge = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAcknowledge?.(message.id);
  }, [message.id, onAcknowledge]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(message.id);
  }, [message.id, onDelete]);

  const handleClick = useCallback(() => {
    onClick?.(message);
  }, [message, onClick]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'solid';
      case 'read': return 'subtle';
      case 'acknowledged': return 'outline';
      case 'responded': return 'outline';
      case 'archived': return 'outline';
      default: return 'subtle';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'solid';
      case 'high': return 'solid';
      case 'medium': return 'subtle';
      case 'low': return 'outline';
      default: return 'subtle';
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown date';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.error('Date formatting error:', error, date);
      return 'Invalid date';
    }
  };

  return (
    <div 
      className={`
        rounded-lg border p-4 cursor-pointer transition-all
        hover:shadow-md hover:border-gray-300
        ${message.status === 'unread' ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={getStatusColor(message.status)}>
              {message.status}
            </Badge>
            <Badge variant={getPriorityColor(message.priority)}>
              {message.priority}
            </Badge>
            <Badge variant="outline">
              {message.type.replace('_', ' ')}
            </Badge>
          </div>

          {/* Contact Name */}
          <h3 className="font-semibold text-gray-900 mb-1">
            {message.contactName}
          </h3>

          {/* Contact Details */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            {message.contactPhone && (
              <span>📞 {message.contactPhone}</span>
            )}
            {message.contactEmail && (
              <span>✉️ {message.contactEmail}</span>
            )}
          </div>

          {/* Subject */}
          {message.subject && (
            <p className="text-sm font-medium text-gray-800 mb-1">
              {message.subject}
            </p>
          )}

          {/* Message Content */}
          {message.message && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {message.message}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-500 mt-2">
            {formatDate(message.createdAt)}
            {message.acknowledgedAt && (
              <span className="ml-2">
                • Acknowledged {formatDate(message.acknowledgedAt)}
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {message.status === 'unread' && onAcknowledge && (
            <button
              onClick={handleAcknowledge}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Acknowledge
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

MessageCard.displayName = 'MessageCard';