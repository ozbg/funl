'use client';

import { memo } from 'react';
import { MessageCard } from './MessageCard';
import type { Message } from '@/lib/messaging';

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  onAcknowledge?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onClick?: (message: Message) => void;
}

export const MessageList = memo<MessageListProps>(({ 
  messages, 
  loading = false,
  onAcknowledge,
  onDelete,
  onClick 
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="h-32 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No messages yet
        </h3>
        <p className="text-gray-600">
          When customers request callbacks through your funnels, they&apos;ll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageCard
          key={message.id}
          message={message}
          onAcknowledge={onAcknowledge}
          onDelete={onDelete}
          onClick={onClick}
        />
      ))}
    </div>
  );
});

MessageList.displayName = 'MessageList';