import { useCallback, useEffect } from 'react';
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
  const store = useMessageStore();
  
  // Fetch messages
  const fetchMessages = useCallback(async (filters?: MessageFilters) => {
    if (!businessId) return;
    
    store.setLoading(true);
    store.setError(null);
    
    try {
      const filtersToUse = filters || store.currentFilters;
      const result = await messageApi.getMessages(businessId, filtersToUse);
      
      store.setMessages(result.data, result.meta.total);
      store.setFilters(filtersToUse);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      store.setError(error instanceof Error ? error.message : 'Failed to fetch messages');
    } finally {
      store.setLoading(false);
    }
  }, [businessId, store]);

  // Acknowledge single message
  const acknowledgeMessage = useCallback(async (messageId: string) => {
    if (!businessId) return;
    
    try {
      const result = await messageApi.acknowledgeMessage(messageId, businessId);
      store.updateMessage(messageId, result.data);
    } catch (error) {
      console.error('Failed to acknowledge message:', error);
      store.setError(error instanceof Error ? error.message : 'Failed to acknowledge message');
    }
  }, [businessId, store]);

  // Bulk acknowledge messages
  const bulkAcknowledgeMessages = useCallback(async (messageIds?: string[]) => {
    if (!businessId) return;
    
    const idsToAcknowledge = messageIds || Array.from(store.selectedMessageIds);
    if (idsToAcknowledge.length === 0) return;
    
    try {
      await messageApi.bulkAcknowledgeMessages(idsToAcknowledge, businessId);
      
      // Update local state
      idsToAcknowledge.forEach(id => {
        store.updateMessage(id, { 
          status: 'acknowledged', 
          acknowledgedAt: new Date(),
          acknowledgedBy: businessId
        });
      });
      
      store.clearSelection();
    } catch (error) {
      console.error('Failed to bulk acknowledge messages:', error);
      store.setError(error instanceof Error ? error.message : 'Failed to acknowledge messages');
    }
  }, [businessId, store]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!businessId) return;
    
    try {
      await messageApi.deleteMessage(messageId, businessId);
      store.removeMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      store.setError(error instanceof Error ? error.message : 'Failed to delete message');
    }
  }, [businessId, store]);

  // Create message (for testing or manual creation)
  const createMessage = useCallback(async (messageData: any) => {
    if (!businessId) return;
    
    try {
      const result = await messageApi.createMessage(messageData, businessId);
      store.addMessage(result.data);
      return result.data;
    } catch (error) {
      console.error('Failed to create message:', error);
      store.setError(error instanceof Error ? error.message : 'Failed to create message');
      throw error;
    }
  }, [businessId, store]);

  // Filter messages
  const setFilters = useCallback((filters: MessageFilters) => {
    store.setFilters(filters);
    fetchMessages(filters);
  }, [store, fetchMessages]);

  // Clear filters
  const clearFilters = useCallback(() => {
    store.clearFilters();
    fetchMessages({
      limit: store.currentFilters.limit || 20,
      offset: 0
    });
  }, [store, fetchMessages]);

  // Auto-fetch on mount and when businessId changes
  useEffect(() => {
    if (businessId) {
      fetchMessages();
    }
  }, [businessId, fetchMessages]);

  return {
    // State
    messages: store.messages,
    loading: store.loading,
    error: store.error,
    unreadCount: store.unreadCount,
    totalCount: store.totalCount,
    currentFilters: store.currentFilters,
    selectedMessageIds: store.selectedMessageIds,
    selectedMessages: store.getSelectedMessages(),
    
    // Actions
    fetchMessages,
    acknowledgeMessage,
    bulkAcknowledgeMessages,
    deleteMessage,
    createMessage,
    setFilters,
    clearFilters,
    
    // Selection
    selectMessage: store.selectMessage,
    deselectMessage: store.deselectMessage,
    selectAllMessages: store.selectAllMessages,
    clearSelection: store.clearSelection,
    toggleMessageSelection: store.toggleMessageSelection,
    
    // Computed
    getMessageById: store.getMessageById,
    getUnreadMessages: store.getUnreadMessages,
    
    // Utilities
    refresh: () => fetchMessages(store.currentFilters)
  };
}