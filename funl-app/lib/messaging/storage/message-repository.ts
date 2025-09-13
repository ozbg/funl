import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { 
  Message, 
  CreateMessageDto, 
  UpdateMessageDto, 
  MessageFilters,
  MessageRow,
  MessageChannel,
  MessageChannelRow,
  NotificationPreferences,
  NotificationPreferencesRow
} from '../core/message-types';

// Create a service role client for server-side operations
// This has elevated privileges to bypass RLS when needed
const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export class MessageRepository {
  
  // Transform database row to domain object
  private transformMessageFromDb(row: any): Message {
    return {
      id: row.id,
      funnelId: row.funnel_id,
      funnelName: row.funnels?.name,
      businessId: row.business_id,
      type: row.type as Message['type'],
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email,
      subject: row.subject,
      message: row.message,
      priority: row.priority as Message['priority'],
      status: row.status as Message['status'],
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
      acknowledgedBy: row.acknowledged_by,
      emailSentAt: row.email_sent_at ? new Date(row.email_sent_at) : undefined,
      smsSentAt: row.sms_sent_at ? new Date(row.sms_sent_at) : undefined,
      emailStatus: row.email_status as Message['emailStatus'],
      smsStatus: row.sms_status as Message['smsStatus'],
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // Transform domain object to database row
  private transformMessageToDb(message: CreateMessageDto): Omit<MessageRow, 'id' | 'created_at' | 'updated_at'> {
    return {
      funnel_id: message.funnelId,
      business_id: message.businessId,
      type: message.type || 'callback_request',
      contact_name: message.contactName,
      contact_phone: message.contactPhone,
      contact_email: message.contactEmail,
      subject: message.subject,
      message: message.message,
      priority: message.priority || 'medium',
      status: 'unread',
      acknowledged_at: undefined,
      acknowledged_by: undefined,
      email_sent_at: undefined,
      sms_sent_at: undefined,
      email_status: undefined,
      sms_status: undefined,
      metadata: message.metadata || {}
    };
  }

  async createMessage(data: CreateMessageDto): Promise<Message> {
    const messageData = this.transformMessageToDb(data);
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }

    return this.transformMessageFromDb(message);
  }

  async getMessageById(id: string): Promise<Message | null> {
    const { data: message, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw new Error(`Failed to get message: ${error.message}`);
    }

    return this.transformMessageFromDb(message);
  }

  async getMessagesByBusiness(
    businessId: string, 
    filters?: MessageFilters
  ): Promise<{ messages: Message[]; total: number }> {
    let query = supabase
      .from('messages')
      .select(`
        *,
        funnels!inner(name)
      `, { count: 'exact' })
      .eq('business_id', businessId);

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }
    
    if (filters?.type?.length) {
      query = query.in('type', filters.type);
    }
    
    if (filters?.priority?.length) {
      query = query.in('priority', filters.priority);
    }
    
    if (filters?.funnelId) {
      query = query.eq('funnel_id', filters.funnelId);
    }
    
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }
    
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }

    // Apply pagination
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: messages, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    return {
      messages: (messages || []).map(row => this.transformMessageFromDb(row)),
      total: count || 0
    };
  }

  async updateMessage(id: string, updates: UpdateMessageDto): Promise<Message> {
    const updateData: Partial<MessageRow> = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.acknowledgedAt) updateData.acknowledged_at = updates.acknowledgedAt.toISOString();
    if (updates.acknowledgedBy) updateData.acknowledged_by = updates.acknowledgedBy;
    if (updates.emailStatus) updateData.email_status = updates.emailStatus;
    if (updates.smsStatus) updateData.sms_status = updates.smsStatus;
    if (updates.metadata) updateData.metadata = updates.metadata;
    
    updateData.updated_at = new Date().toISOString();

    const { data: message, error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update message: ${error.message}`);
    }

    return this.transformMessageFromDb(message);
  }

  async deleteMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  async getUnreadCount(businessId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('business_id', businessId)
      .eq('status', 'unread');

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return count || 0;
  }

  async acknowledgeMessages(businessId: string, messageIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: businessId,
        updated_at: new Date().toISOString()
      })
      .eq('business_id', businessId)
      .in('id', messageIds);

    if (error) {
      throw new Error(`Failed to acknowledge messages: ${error.message}`);
    }
  }

  // Channel management methods
  private transformChannelFromDb(row: MessageChannelRow): MessageChannel {
    return {
      id: row.id,
      businessId: row.business_id,
      channelType: row.channel_type as MessageChannel['channelType'],
      config: row.config || {},
      isEnabled: row.is_enabled,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async getChannelsByBusiness(businessId: string): Promise<MessageChannel[]> {
    const { data: channels, error } = await supabase
      .from('message_channels')
      .select('*')
      .eq('business_id', businessId);

    if (error) {
      throw new Error(`Failed to get channels: ${error.message}`);
    }

    return (channels || []).map(row => this.transformChannelFromDb(row));
  }

  async createOrUpdateChannel(
    businessId: string,
    channelType: string,
    config: Record<string, unknown>
  ): Promise<MessageChannel> {
    const { data: channel, error } = await supabase
      .from('message_channels')
      .upsert({
        business_id: businessId,
        channel_type: channelType,
        config,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create/update channel: ${error.message}`);
    }

    return this.transformChannelFromDb(channel);
  }

  // Notification preferences methods
  private transformPreferencesFromDb(row: NotificationPreferencesRow): NotificationPreferences {
    return {
      id: row.id,
      businessId: row.business_id,
      showBadge: row.show_badge,
      showToast: row.show_toast,
      emailNewMessages: row.email_new_messages,
      emailDailySummary: row.email_daily_summary,
      emailWeeklySummary: row.email_weekly_summary,
      smsUrgentOnly: row.sms_urgent_only,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async getNotificationPreferences(businessId: string): Promise<NotificationPreferences | null> {
    const { data: prefs, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('business_id', businessId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw new Error(`Failed to get notification preferences: ${error.message}`);
    }

    return this.transformPreferencesFromDb(prefs);
  }

  async createOrUpdateNotificationPreferences(
    businessId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const { data: prefs, error } = await supabase
      .from('notification_preferences')
      .upsert({
        business_id: businessId,
        show_badge: preferences.showBadge ?? true,
        show_toast: preferences.showToast ?? true,
        email_new_messages: preferences.emailNewMessages ?? true,
        email_daily_summary: preferences.emailDailySummary ?? true,
        email_weekly_summary: preferences.emailWeeklySummary ?? false,
        sms_urgent_only: preferences.smsUrgentOnly ?? true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create/update notification preferences: ${error.message}`);
    }

    return this.transformPreferencesFromDb(prefs);
  }
}