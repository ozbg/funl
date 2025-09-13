'use client';

import { memo, useCallback, useState } from 'react';
import { MessageHeader } from './MessageHeader';
import { MessageFilters } from './MessageFilters';
import { MessageList } from './MessageList';
import { useMessages } from '@/hooks/use-messages';
import type { Message, MessageFilters as MessageFiltersType } from '@/lib/messaging';

interface MessageDashboardProps {
  businessId: string;
}

export const MessageDashboard = memo<MessageDashboardProps>(({ businessId }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  const {
    messages,
    loading,
    error,
    unreadCount,
    totalCount,
    currentFilters,
    selectedMessageIds,
    selectedMessages,
    acknowledgeMessage,
    bulkAcknowledgeMessages,
    deleteMessage,
    setFilters,
    clearFilters,
    refresh,
    selectMessage,
    deselectMessage,
    clearSelection,
    toggleMessageSelection
  } = useMessages(businessId);

  const handleFiltersChange = useCallback((newFilters: MessageFiltersType) => {
    setFilters(newFilters);
  }, [setFilters]);

  const handleMessageClick = useCallback((message: Message) => {
    setSelectedMessage(message);
    // You could open a modal or navigate to a detail page here
    console.log('Message clicked:', message);
  }, []);

  const handleBulkAcknowledge = useCallback(async () => {
    if (selectedMessages.length === 0) return;
    
    try {
      await bulkAcknowledgeMessages();
      // Success feedback could be added here (toast notification)
    } catch (error) {
      console.error('Bulk acknowledge failed:', error);
      // Error feedback could be added here
    }
  }, [selectedMessages, bulkAcknowledgeMessages]);

  const handleMessageAcknowledge = useCallback(async (messageId: string) => {
    try {
      await acknowledgeMessage(messageId);
      // Success feedback could be added here
    } catch (error) {
      console.error('Acknowledge failed:', error);
      // Error feedback could be added here
    }
  }, [acknowledgeMessage]);

  const handleMessageDelete = useCallback(async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    try {
      await deleteMessage(messageId);
      // Success feedback could be added here
    } catch (error) {
      console.error('Delete failed:', error);
      // Error feedback could be added here
    }
  }, [deleteMessage]);

  // Show error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Error Loading Messages
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <MessageHeader
        unreadCount={unreadCount}
        totalCount={totalCount}
        loading={loading}
        onRefresh={refresh}
        onBulkAcknowledge={selectedMessages.length > 0 ? handleBulkAcknowledge : undefined}
        selectedCount={selectedMessages.length}
      />

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          {selectedMessages.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedMessages.length} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear
              </button>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            Showing {messages.length} of {totalCount} messages
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <MessageFilters
          filters={currentFilters}
          onFiltersChange={handleFiltersChange}
          unreadCount={unreadCount}
        />
      )}

      {/* Message List */}
      <MessageList
        messages={messages}
        loading={loading}
        onAcknowledge={handleMessageAcknowledge}
        onDelete={handleMessageDelete}
        onClick={handleMessageClick}
      />

      {/* Pagination */}
      {totalCount > (currentFilters.limit || 20) && (
        <div className="flex items-center justify-between bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">
            Showing {(currentFilters.offset || 0) + 1} to {Math.min((currentFilters.offset || 0) + (currentFilters.limit || 20), totalCount)} of {totalCount} messages
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newOffset = Math.max(0, (currentFilters.offset || 0) - (currentFilters.limit || 20));
                handleFiltersChange({
                  ...currentFilters,
                  offset: newOffset
                });
              }}
              disabled={!currentFilters.offset || currentFilters.offset === 0}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Previous
            </button>
            
            <button
              onClick={() => {
                const newOffset = (currentFilters.offset || 0) + (currentFilters.limit || 20);
                if (newOffset < totalCount) {
                  handleFiltersChange({
                    ...currentFilters,
                    offset: newOffset
                  });
                }
              }}
              disabled={(currentFilters.offset || 0) + (currentFilters.limit || 20) >= totalCount}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Message Detail Modal/Sidebar could go here */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Message Details</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedMessage.contactName}</h3>
                  <p className="text-gray-600">{selectedMessage.contactPhone} • {selectedMessage.contactEmail}</p>
                </div>
                
                {selectedMessage.subject && (
                  <div>
                    <h4 className="font-medium text-gray-700">Subject</h4>
                    <p className="text-gray-900">{selectedMessage.subject}</p>
                  </div>
                )}
                
                {selectedMessage.message && (
                  <div>
                    <h4 className="font-medium text-gray-700">Message</h4>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                )}
                
                <div className="flex gap-4 pt-4 border-t">
                  {selectedMessage.status === 'unread' && (
                    <button
                      onClick={() => {
                        handleMessageAcknowledge(selectedMessage.id);
                        setSelectedMessage(null);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      handleMessageDelete(selectedMessage.id);
                      setSelectedMessage(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MessageDashboard.displayName = 'MessageDashboard';