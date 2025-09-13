import { useEffect, useState } from 'react';
import { useMessageStore } from '@/stores/message-store';

// Simple hook to get unread message count
// This can be used in navigation components for notification badges
export function useUnreadMessageCount() {
  const unreadCount = useMessageStore(state => state.unreadCount);
  return unreadCount;
}

// Hook for real-time unread count updates (for when we add Supabase realtime)
export function useRealtimeUnreadCount(businessId: string) {
  const [count, setCount] = useState(0);
  const storeCount = useMessageStore(state => state.unreadCount);
  
  useEffect(() => {
    // Use store count as fallback
    setCount(storeCount);
    
    // TODO: In Phase 3, add Supabase realtime subscription here
    // const channel = supabase
    //   .channel('unread-count')
    //   .on('postgres_changes', {
    //     event: '*',
    //     schema: 'public',
    //     table: 'messages',
    //     filter: `business_id=eq.${businessId}`
    //   }, (payload) => {
    //     // Update count based on changes
    //   })
    //   .subscribe();
    
    // return () => channel.unsubscribe();
  }, [businessId, storeCount]);
  
  return count;
}