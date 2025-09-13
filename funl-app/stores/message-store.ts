import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Message, MessageFilters } from '@/lib/messaging';

interface MessageStore {
  // State
  messages: Message[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  totalCount: number;
  currentFilters: MessageFilters;
  selectedMessageIds: Set<string>;
  
  // Actions
  setMessages: (messages: Message[], total: number) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUnreadCount: (count: number) => void;
  setFilters: (filters: MessageFilters) => void;
  clearFilters: () => void;
  
  // Selection
  selectMessage: (id: string) => void;
  deselectMessage: (id: string) => void;
  selectAllMessages: () => void;
  clearSelection: () => void;
  toggleMessageSelection: (id: string) => void;
  
  // Computed
  getSelectedMessages: () => Message[];
  getUnreadMessages: () => Message[];
  getMessageById: (id: string) => Message | undefined;
}

export const useMessageStore = create<MessageStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      messages: [],
      loading: false,
      error: null,
      unreadCount: 0,
      totalCount: 0,
      currentFilters: {
        limit: 20,
        offset: 0
      },
      selectedMessageIds: new Set(),
      
      // Actions
      setMessages: (messages, total) => set(() => ({
        messages,
        totalCount: total,
        unreadCount: messages.filter(m => m.status === 'unread').length,
        error: null
      }), false, 'setMessages'),
      
      addMessage: (message) => set((state) => ({
        messages: [message, ...state.messages],
        totalCount: state.totalCount + 1,
        unreadCount: message.status === 'unread' ? state.unreadCount + 1 : state.unreadCount
      }), false, 'addMessage'),
      
      updateMessage: (id, updates) => set((state) => {
        const messageIndex = state.messages.findIndex(m => m.id === id);
        if (messageIndex === -1) return state;
        
        const oldMessage = state.messages[messageIndex];
        const newMessage = { ...oldMessage, ...updates };
        const newMessages = [...state.messages];
        newMessages[messageIndex] = newMessage;
        
        // Update unread count if status changed
        let newUnreadCount = state.unreadCount;
        if (oldMessage.status === 'unread' && newMessage.status !== 'unread') {
          newUnreadCount--;
        } else if (oldMessage.status !== 'unread' && newMessage.status === 'unread') {
          newUnreadCount++;
        }
        
        return {
          messages: newMessages,
          unreadCount: newUnreadCount
        };
      }, false, 'updateMessage'),
      
      removeMessage: (id) => set((state) => {
        const message = state.messages.find(m => m.id === id);
        const newMessages = state.messages.filter(m => m.id !== id);
        const newSelectedIds = new Set(state.selectedMessageIds);
        newSelectedIds.delete(id);
        
        return {
          messages: newMessages,
          totalCount: Math.max(0, state.totalCount - 1),
          unreadCount: message?.status === 'unread' 
            ? Math.max(0, state.unreadCount - 1) 
            : state.unreadCount,
          selectedMessageIds: newSelectedIds
        };
      }, false, 'removeMessage'),
      
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      
      setError: (error) => set({ error }, false, 'setError'),
      
      setUnreadCount: (unreadCount) => set({ unreadCount }, false, 'setUnreadCount'),
      
      setFilters: (filters) => set({ 
        currentFilters: filters 
      }, false, 'setFilters'),
      
      clearFilters: () => set((state) => ({
        currentFilters: {
          limit: state.currentFilters.limit || 20,
          offset: 0
        }
      }), false, 'clearFilters'),
      
      // Selection Actions
      selectMessage: (id) => set((state) => {
        const newSelectedIds = new Set(state.selectedMessageIds);
        newSelectedIds.add(id);
        return { selectedMessageIds: newSelectedIds };
      }, false, 'selectMessage'),
      
      deselectMessage: (id) => set((state) => {
        const newSelectedIds = new Set(state.selectedMessageIds);
        newSelectedIds.delete(id);
        return { selectedMessageIds: newSelectedIds };
      }, false, 'deselectMessage'),
      
      selectAllMessages: () => set((state) => ({
        selectedMessageIds: new Set(state.messages.map(m => m.id))
      }), false, 'selectAllMessages'),
      
      clearSelection: () => set({
        selectedMessageIds: new Set()
      }, false, 'clearSelection'),
      
      toggleMessageSelection: (id) => set((state) => {
        const newSelectedIds = new Set(state.selectedMessageIds);
        if (newSelectedIds.has(id)) {
          newSelectedIds.delete(id);
        } else {
          newSelectedIds.add(id);
        }
        return { selectedMessageIds: newSelectedIds };
      }, false, 'toggleMessageSelection'),
      
      // Computed
      getSelectedMessages: () => {
        const state = get();
        return state.messages.filter(m => state.selectedMessageIds.has(m.id));
      },
      
      getUnreadMessages: () => {
        const state = get();
        return state.messages.filter(m => m.status === 'unread');
      },
      
      getMessageById: (id) => {
        const state = get();
        return state.messages.find(m => m.id === id);
      }
    }),
    {
      name: 'message-store'
    }
  )
);