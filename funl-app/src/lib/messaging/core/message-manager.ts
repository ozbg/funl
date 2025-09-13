import type { 
  Message, 
  CreateMessageDto, 
  UpdateMessageDto, 
  MessageFilters,
  DeliveryResult,
  MessageChannel,
  NotificationPreferences
} from './message-types';
import { MessageRepository } from '../storage/message-repository';
import { 
  CreateMessageSchema, 
  UpdateMessageSchema, 
  MessageFiltersSchema 
} from './message-validator';

export class MessageManager {
  private repository: MessageRepository;

  constructor() {
    this.repository = new MessageRepository();
  }

  /**
   * Create a new message and trigger delivery channels
   */
  async createMessage(data: CreateMessageDto): Promise<Message> {
    // Validate input
    const validated = CreateMessageSchema.parse(data);
    
    try {
      // 1. Store in database
      const message = await this.repository.createMessage(validated);
      
      // 2. Queue for delivery channels (async)
      this.queueDelivery(message).catch(error => {
        console.error('Failed to queue message delivery:', error);
      });
      
      // 3. Trigger real-time notifications (async)
      this.triggerRealtimeNotification(message).catch(error => {
        console.error('Failed to trigger real-time notification:', error);
      });
      
      return message;
    } catch (error) {
      console.error('Failed to create message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a business with optional filtering
   */
  async getMessagesForBusiness(
    businessId: string, 
    filters?: MessageFilters
  ): Promise<{ messages: Message[]; total: number }> {
    // Validate filters if provided
    const validatedFilters = filters ? MessageFiltersSchema.parse(filters) : undefined;
    
    return this.repository.getMessagesByBusiness(businessId, validatedFilters);
  }

  /**
   * Get a single message by ID
   */
  async getMessageById(id: string): Promise<Message | null> {
    return this.repository.getMessageById(id);
  }

  /**
   * Update message status and properties
   */
  async updateMessage(id: string, updates: UpdateMessageDto): Promise<Message> {
    // Validate updates
    const validated = UpdateMessageSchema.parse(updates);
    
    return this.repository.updateMessage(id, validated);
  }

  /**
   * Acknowledge a message (mark as read and acknowledged)
   */
  async acknowledgeMessage(id: string, businessId: string): Promise<Message> {
    const updates: UpdateMessageDto = {
      status: 'acknowledged',
      acknowledgedAt: new Date(),
      acknowledgedBy: businessId
    };
    
    const message = await this.updateMessage(id, updates);
    
    // Trigger real-time update for notification counters
    this.triggerNotificationCountUpdate(businessId).catch(error => {
      console.error('Failed to update notification count:', error);
    });
    
    return message;
  }

  /**
   * Acknowledge multiple messages at once
   */
  async acknowledgeMessages(businessId: string, messageIds: string[]): Promise<void> {
    await this.repository.acknowledgeMessages(businessId, messageIds);
    
    // Trigger real-time update for notification counters
    this.triggerNotificationCountUpdate(businessId).catch(error => {
      console.error('Failed to update notification count:', error);
    });
  }

  /**
   * Get unread message count for a business
   */
  async getUnreadCount(businessId: string): Promise<number> {
    return this.repository.getUnreadCount(businessId);
  }

  /**
   * Delete a message
   */
  async deleteMessage(id: string): Promise<void> {
    return this.repository.deleteMessage(id);
  }

  /**
   * Get notification preferences for a business
   */
  async getNotificationPreferences(businessId: string): Promise<NotificationPreferences | null> {
    return this.repository.getNotificationPreferences(businessId);
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    businessId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    return this.repository.createOrUpdateNotificationPreferences(businessId, preferences);
  }

  /**
   * Get delivery channels for a business
   */
  async getChannels(businessId: string): Promise<MessageChannel[]> {
    return this.repository.getChannelsByBusiness(businessId);
  }

  /**
   * Configure a delivery channel
   */
  async configureChannel(
    businessId: string,
    channelType: string,
    config: Record<string, any>
  ): Promise<MessageChannel> {
    return this.repository.createOrUpdateChannel(businessId, channelType, config);
  }

  /**
   * Queue message for delivery via configured channels
   * This will be expanded in Phase 2 with actual channel implementations
   */
  private async queueDelivery(message: Message): Promise<void> {
    // Get business notification preferences
    const preferences = await this.getNotificationPreferences(message.businessId);
    
    // Get configured channels
    const channels = await this.getChannels(message.businessId);
    
    // Queue email delivery if enabled
    if (preferences?.emailNewMessages) {
      const emailChannel = channels.find(c => c.channelType === 'email' && c.isEnabled);
      if (emailChannel) {
        await this.queueEmailDelivery(message, emailChannel);
      }
    }
    
    // Queue SMS delivery if urgent and enabled
    if (message.priority === 'urgent' && preferences?.smsUrgentOnly) {
      const smsChannel = channels.find(c => c.channelType === 'sms' && c.isEnabled);
      if (smsChannel) {
        await this.queueSMSDelivery(message, smsChannel);
      }
    }
  }

  /**
   * Queue email delivery (placeholder for Phase 2)
   */
  private async queueEmailDelivery(message: Message, channel: MessageChannel): Promise<void> {
    // TODO: Implement in Phase 2 with actual email channel
    console.log(`Queuing email delivery for message ${message.id}`);
    
    // Update message with email queued status
    await this.updateMessage(message.id, {
      emailStatus: 'pending'
    });
  }

  /**
   * Queue SMS delivery (placeholder for Phase 2)
   */
  private async queueSMSDelivery(message: Message, channel: MessageChannel): Promise<void> {
    // TODO: Implement in Phase 2 with actual SMS channel
    console.log(`Queuing SMS delivery for message ${message.id}`);
    
    // Update message with SMS queued status
    await this.updateMessage(message.id, {
      smsStatus: 'pending'
    });
  }

  /**
   * Trigger real-time notification for new message
   */
  private async triggerRealtimeNotification(message: Message): Promise<void> {
    // TODO: Implement Supabase realtime broadcast
    console.log(`Triggering real-time notification for message ${message.id}`);
  }

  /**
   * Trigger real-time update for notification count
   */
  private async triggerNotificationCountUpdate(businessId: string): Promise<void> {
    // TODO: Implement Supabase realtime broadcast for count update
    console.log(`Triggering notification count update for business ${businessId}`);
  }

  /**
   * Search messages by content
   */
  async searchMessages(
    businessId: string, 
    query: string, 
    filters?: MessageFilters
  ): Promise<{ messages: Message[]; total: number }> {
    // This is a basic implementation - could be enhanced with full-text search
    const allMessages = await this.getMessagesForBusiness(businessId, filters);
    
    const filteredMessages = allMessages.messages.filter(message => 
      message.contactName.toLowerCase().includes(query.toLowerCase()) ||
      message.message?.toLowerCase().includes(query.toLowerCase()) ||
      message.subject?.toLowerCase().includes(query.toLowerCase()) ||
      message.contactEmail?.toLowerCase().includes(query.toLowerCase()) ||
      message.contactPhone?.includes(query)
    );
    
    return {
      messages: filteredMessages,
      total: filteredMessages.length
    };
  }

  /**
   * Get message analytics for a business
   */
  async getMessageAnalytics(
    businessId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalMessages: number;
    unreadMessages: number;
    acknowledgedMessages: number;
    responseTimeAvg: number; // in hours
    messagesByType: Record<string, number>;
    messagesByPriority: Record<string, number>;
  }> {
    const filters: MessageFilters = {};
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    
    const { messages, total } = await this.getMessagesForBusiness(businessId, {
      ...filters,
      limit: 1000 // Get a large batch for analytics
    });
    
    const unreadMessages = messages.filter(m => m.status === 'unread').length;
    const acknowledgedMessages = messages.filter(m => m.status === 'acknowledged').length;
    
    // Calculate average response time (acknowledged messages only)
    const acknowledgedWithTimes = messages.filter(m => 
      m.status === 'acknowledged' && m.acknowledgedAt
    );
    
    const responseTimeAvg = acknowledgedWithTimes.length > 0 
      ? acknowledgedWithTimes.reduce((sum, m) => {
          const hours = (m.acknowledgedAt!.getTime() - m.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / acknowledgedWithTimes.length
      : 0;
    
    // Group by type and priority
    const messagesByType = messages.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const messagesByPriority = messages.reduce((acc, m) => {
      acc[m.priority] = (acc[m.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalMessages: total,
      unreadMessages,
      acknowledgedMessages,
      responseTimeAvg,
      messagesByType,
      messagesByPriority
    };
  }
}

// Export a singleton instance
export const messageManager = new MessageManager();