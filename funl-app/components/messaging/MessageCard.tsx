'use client';

import { memo, useCallback } from 'react';
import type { Message } from '@/lib/messaging';

interface MessageCardProps {
  message: Message;
  onAcknowledge?: (messageId: string) => void;
  onComplete?: (messageId: string) => void;
}

export const MessageCard = memo<MessageCardProps>(({ 
  message, 
  onAcknowledge,
  onComplete
}) => {
  const handleAcknowledge = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAcknowledge?.(message.id);
  }, [message.id, onAcknowledge]);

  const handleComplete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete?.(message.id);
  }, [message.id, onComplete]);

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

  // Extract message parts
  const messageContent = message.message || '';
  const preferredTimeMatch = messageContent.match(/Preferred time: ([^\n]+)/);
  const preferredTime = preferredTimeMatch ? preferredTimeMatch[1] : null;
  const messageMatch = messageContent.match(/Message: (.+)$/);
  const extractedMessage = messageMatch ? messageMatch[1] : null;

  const isUnread = message.status === 'unread';

  return (
    <div className={`
      flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow
      ${isUnread ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'border-gray-200'}
    `}>
      {/* Left: Message content */}
      <div className="flex-1">
        <div className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
          {formatDate(message.createdAt)}  -  {message.contactName}  -  📞 {message.contactPhone}
          {preferredTime && `  -  Preferred time: ${preferredTime}`}
        </div>
        {extractedMessage && (
          <div className={`text-sm mt-1 ${isUnread ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
            Message: {extractedMessage}
          </div>
        )}
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-2 ml-4">
        {isUnread && onAcknowledge && (
          <button
            onClick={handleAcknowledge}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Read
          </button>
        )}
        
        {onComplete && (
          <button
            onClick={handleComplete}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Complete
          </button>
        )}
      </div>
    </div>
  );
});

MessageCard.displayName = 'MessageCard';