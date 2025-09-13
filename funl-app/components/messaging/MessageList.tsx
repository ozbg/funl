'use client';

import { memo } from 'react';
import { MessageCard } from './MessageCard';
import type { Message } from '@/lib/messaging';

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  onAcknowledge?: (messageId: string) => void;
  onComplete?: (messageId: string) => void;
}

export const MessageList = memo<MessageListProps>(({ 
  messages, 
  loading = false,
  onAcknowledge,
  onComplete
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="h-16 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-3">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No messages
        </h3>
        <p className="text-gray-600">
          Callback requests will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <MessageCard
          key={message.id}
          message={message}
          onAcknowledge={onAcknowledge}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
});

MessageList.displayName = 'MessageList';