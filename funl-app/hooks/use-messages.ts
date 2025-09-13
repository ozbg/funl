import { useCallback, useEffect, useRef } from 'react';
import { useMessageStore } from '@/stores/message-store';
import type { MessageFilters } from '@/lib/messaging';

// API client functions (simplified - you'd implement these based on your API setup)
const messageApi = {
  async getMessages(businessId: string, filters?: MessageFilters) {
    const params = new URLSearchParams();
    
    if (filters?.status?.length) {
      filters.status.forEach(s => params.append('status', s));
    }
    if (filters?.type?.length) {
      filters.type.forEach(t => params.append('type', t));
    }
    if (filters?.priority?.length) {
      filters.priority.forEach(p => params.append('priority', p));
    }
    if (filters?.funnelId) {
      params.append('funnelId', filters.funnelId);
    }
    if (filters?.dateFrom) {
      params.append('dateFrom', filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      params.append('dateTo', filters.dateTo.toISOString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params.append('offset', filters.offset.toString());
    }
    
    params.append('businessId', businessId);
    
    const response = await fetch(`/api/messages?${params}`, {
      headers: {
        'x-business-id': businessId
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }
    
    return response.json();
  },

  async acknowledgeMessage(messageId: string, businessId: string) {
    const response = await fetch(`/api/messages/${messageId}/acknowledge`, {
      method: 'POST',
      headers: {
        'x-business-id': businessId
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to acknowledge message: ${response.statusText}`);
    }
    
    return response.json();
  },

  async bulkAcknowledgeMessages(messageIds: string[], businessId: string) {
    const response = await fetch('/api/messages/bulk-acknowledge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId
      },
      body: JSON.stringify({ messageIds })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to bulk acknowledge messages: ${response.statusText}`);
    }
    
    return response.json();
  },

  async deleteMessage(messageId: string, businessId: string) {
    const response = await fetch(`/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'x-business-id': businessId
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete message: ${response.statusText}`);
    }
    
    return response.json();
  },

  async createMessage(messageData: any, businessId: string) {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId
      },
      body: JSON.stringify(messageData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create message: ${response.statusText}`);
    }
    
    return response.json();
  }
};

export function useMessages(businessId: string) {
  const {
    messages,
    loading,
    error,
    unreadCount,
    totalCount,
    currentFilters,
    selectedMessageIds,
    setMessages,
    setLoading,
    setError,
    setFilters,
    clearFilters: storeClearFilters,
    updateMessage,
    removeMessage,
    selectMessage,
    deselectMessage,
    selectAllMessages,
    clearSelection,
    toggleMessageSelection,
    getSelectedMessages,
    getMessageById,
    getUnreadMessages
  } = useMessageStore();
  
  // Fetch messages
  const fetchMessages = useCallback(async (filters?: MessageFilters) => {
    if (!businessId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const filtersToUse = filters || currentFilters;
      const result = await messageApi.getMessages(businessId, filtersToUse);
      
      setMessages(result.data, result.meta.total);
      setFilters(filtersToUse);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [businessId, currentFilters, setMessages, setLoading, setError, setFilters]);

  // Acknowledge single message
  const acknowledgeMessage = useCallback(async (messageId: string) => {
    if (!businessId) return;
    
    try {
      const result = await messageApi.acknowledgeMessage(messageId, businessId);
      updateMessage(messageId, result.data);
    } catch (error) {
      console.error('Failed to acknowledge message:', error);
      setError(error instanceof Error ? error.message : 'Failed to acknowledge message');
    }
  }, [businessId, updateMessage, setError]);

  // Bulk acknowledge messages
  const bulkAcknowledgeMessages = useCallback(async (messageIds?: string[]) => {
    if (!businessId) return;
    
    const idsToAcknowledge = messageIds || Array.from(selectedMessageIds);
    if (idsToAcknowledge.length === 0) return;
    
    try {
      await messageApi.bulkAcknowledgeMessages(idsToAcknowledge, businessId);
      
      // Update local state
      idsToAcknowledge.forEach(id => {
        updateMessage(id, { 
          status: 'acknowledged', 
          acknowledgedAt: new Date(),
          acknowledgedBy: businessId
        });
      });
      
      clearSelection();
    } catch (error) {
      console.error('Failed to bulk acknowledge messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to acknowledge messages');
    }
  }, [businessId, selectedMessageIds, updateMessage, clearSelection, setError]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!businessId) return;
    
    try {
      await messageApi.deleteMessage(messageId, businessId);
      removeMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete message');
    }
  }, [businessId, removeMessage, setError]);

  // Create message (for testing or manual creation)
  const createMessage = useCallback(async (messageData: any) => {
    if (!businessId) return;
    
    try {
      const result = await messageApi.createMessage(messageData, businessId);
      // Note: We need to add the addMessage action to the store
      // For now, we'll refetch after creation
      await fetchMessages(currentFilters);
      return result.data;
    } catch (error) {
      console.error('Failed to create message:', error);
      setError(error instanceof Error ? error.message : 'Failed to create message');
      throw error;
    }
  }, [businessId, currentFilters, fetchMessages, setError]);

  // Filter messages
  const setFiltersWithFetch = useCallback((filters: MessageFilters) => {
    setFilters(filters);
    fetchMessages(filters);
  }, [setFilters, fetchMessages]);

  // Clear filters
  const clearFilters = useCallback(() => {
    storeClearFilters();
    fetchMessages({
      limit: currentFilters.limit || 20,
      offset: 0
    });
  }, [storeClearFilters, currentFilters.limit, fetchMessages]);

  // Auto-fetch on mount and when businessId changes
  // Use a ref to prevent infinite loops
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (businessId && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchMessages();
    }
  }, [businessId]); // Only depend on businessId, not fetchMessages

  return {
    // State
    messages,
    loading,
    error,
    unreadCount,
    totalCount,
    currentFilters,
    selectedMessageIds,
    selectedMessages: getSelectedMessages(),
    
    // Actions
    fetchMessages,
    acknowledgeMessage,
    bulkAcknowledgeMessages,
    deleteMessage,
    createMessage,
    setFilters: setFiltersWithFetch,
    clearFilters,
    
    // Selection
    selectMessage,
    deselectMessage,
    selectAllMessages,
    clearSelection,
    toggleMessageSelection,
    
    // Computed
    getMessageById,
    getUnreadMessages,
    
    // Utilities
    refresh: () => fetchMessages(currentFilters)
  };
}