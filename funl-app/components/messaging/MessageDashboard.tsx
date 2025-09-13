'use client';

import { memo, useCallback, useState } from 'react';
import { useMessages } from '@/hooks/use-messages';
import { Box, Flex, Stack } from '@/styled-system/jsx';
import { Button } from '@/components/ui/button';

interface MessageDashboardProps {
  businessId: string;
}

export const MessageDashboard = memo<MessageDashboardProps>(({ businessId }) => {
  const [showCompleted, setShowCompleted] = useState(false);
  
  const {
    messages,
    loading,
    error,
    acknowledgeMessage,
    deleteMessage,
    refresh
  } = useMessages(businessId);

  const handleRead = useCallback(async (messageId: string) => {
    console.log('Mark as read:', messageId);
    try {
      await acknowledgeMessage(messageId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [acknowledgeMessage]);

  const handleComplete = useCallback(async (messageId: string) => {
    console.log('Mark as complete:', messageId);
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': businessId
        },
        body: JSON.stringify({ status: 'archived' })
      });

      if (!response.ok) {
        throw new Error('Failed to archive message');
      }

      refresh();
    } catch (error) {
      console.error('Failed to complete message:', error);
    }
  }, [businessId, refresh]);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid';
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      return 'Invalid';
    }
  };

  // Filter messages
  const activeMessages = messages.filter(message => message.status !== 'archived');
  const archivedMessages = messages.filter(message => message.status === 'archived');
  const displayMessages = showCompleted ? [...activeMessages, ...archivedMessages] : activeMessages;

  if (error) {
    return (
      <Box h="calc(100vh - 112px)" display="flex" flexDirection="column">
        <Box px={{ base: 4, sm: 0 }}>
          <Box bg="red.50" border="1px solid" borderColor="red.200" p={6} textAlign="center">
            <Box fontSize="lg" fontWeight="semibold" color="red.900" mb={2}>
              Error Loading Messages
            </Box>
            <Box color="red.700" mb={4}>{error}</Box>
            <Button
              onClick={refresh}
              variant="solid"
              colorPalette="red"
            >
              Try Again
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box h="calc(100vh - 112px)" display="flex" flexDirection="column">
      <Box px={{ base: 4, sm: 0 }} flexShrink={0}>
        <Flex 
          direction={{ base: 'column', sm: 'row' }} 
          align={{ sm: 'center' }} 
          justify={{ sm: 'space-between' }}
        >
          <Box>
            <Box fontSize="2xl" fontWeight="bold" color="fg.default">
              Messages
            </Box>
          </Box>
          <Flex mt={{ base: 4, sm: 0 }} gap={3}>
            <Button
              onClick={refresh}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            
            <Button
              onClick={() => {
                console.log('Toggle show completed:', !showCompleted);
                console.log('Current messages:', messages);
                console.log('Active messages:', activeMessages);
                console.log('Archived messages:', archivedMessages);
                setShowCompleted(!showCompleted);
              }}
              variant={showCompleted ? 'solid' : 'outline'}
              colorPalette="mint"
            >
              {showCompleted ? 'Hide Completed' : 'Show Completed'}
            </Button>
          </Flex>
        </Flex>
      </Box>

      <Box 
        mt={8} 
        flex="1" 
        overflow="auto"
        css={{
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none'
        }}
      >
        {displayMessages && displayMessages.length > 0 ? (
          <Box bg="bg.default" boxShadow="sm">
            <Stack divideY="1px" divideColor="border.default">
              {displayMessages.map((message) => {
                const isUnread = message.status === 'unread';
                const isArchived = message.status === 'archived';
                const messageContent = message.message || '';
                const preferredTimeMatch = messageContent.match(/Preferred time: ([^\n]+)/);
                const preferredTime = preferredTimeMatch ? preferredTimeMatch[1] : null;
                const messageMatch = messageContent.match(/Message: (.+)$/);
                const extractedMessage = messageMatch ? messageMatch[1] : '';

                return (
                  <Box 
                    key={message.id} 
                    px={{ base: 4, sm: 6 }} 
                    py={6}
                    bg={isUnread ? 'bg.emphasized' : message.status === 'read' ? 'bg.inverted' : isArchived ? 'bg.emphasized' : 'bg.default'}
                    borderLeftWidth={isUnread ? '4px' : '0'}
                    borderLeftColor={isUnread ? 'border.emphasized' : 'transparent'}
                    opacity={isArchived ? 0.75 : 1}
                  >
                    <Flex justify="space-between" align="flex-start">
                      <Flex direction="column" gap={3} flex="1">
                        {/* Funnel name - top line */}
                        <Box>
                          <Box 
                            fontSize="sm" 
                            color={isUnread || message.status === 'read' || isArchived ? 'fg.inverted' : 'fg.default'}
                            fontWeight="bold"
                          >
                            {message.funnelName || 'Unknown Funnel'}
                          </Box>
                        </Box>

                        {/* Main info line */}
                        <Box>
                          <Box 
                            fontSize="sm" 
                            color={isUnread || message.status === 'read' || isArchived ? 'fg.inverted' : 'fg.default'}
                            fontWeight={isUnread ? 'semibold' : 'medium'}
                          >
                            {formatDate(message.createdAt)} • {message.contactName} • 📞 {message.contactPhone}
                            {preferredTime && ` • Preferred time: ${preferredTime}`}
                          </Box>
                        </Box>

                        {/* Message content */}
                        {extractedMessage && (
                          <Box 
                            fontSize="sm" 
                            color={isUnread || message.status === 'read' || isArchived ? 'fg.inverted' : 'fg.default'}
                            fontWeight={isUnread ? 'medium' : 'normal'}
                          >
                            Message: {extractedMessage}
                          </Box>
                        )}
                      </Flex>

                      {/* Actions */}
                      <Flex gap={3} ml={4}>
                        {isUnread && !isArchived && (
                          <Button
                            onClick={() => handleRead(message.id)}
                            variant="solid"
                            colorPalette="blue"
                            size="sm"
                          >
                            Read
                          </Button>
                        )}
                        
                        {!isArchived && (
                          <Button
                            onClick={() => handleComplete(message.id)}
                            variant="solid"
                            colorPalette="mint"
                            size="sm"
                          >
                            Complete
                          </Button>
                        )}

                        {isArchived && (
                          <Box 
                            px={3} 
                            py={2} 
                            fontSize="sm" 
                            color="fg.muted"
                            fontWeight="medium"
                          >
                            Completed
                          </Box>
                        )}
                      </Flex>
                    </Flex>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ) : (
          <Flex direction="column" align="center" py={12}>
            <Box mx="auto" h={12} w={12} color="fg.muted">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </Box>
            <Box mt={2} fontSize="sm" fontWeight="medium" color="fg.default">
              No messages yet
            </Box>
            <Box mt={1} fontSize="sm" color="fg.muted">
              Callback requests will appear here when customers contact you.
            </Box>
          </Flex>
        )}
      </Box>

      {/* Debug info */}
      <Box mt={4} px={{ base: 4, sm: 0 }}>
        <Box fontSize="xs" color="fg.muted">
          Active: {activeMessages.length} | Archived: {archivedMessages.length} | Showing: {displayMessages.length}
        </Box>
      </Box>
    </Box>
  );
});

MessageDashboard.displayName = 'MessageDashboard';