// Core message types and interfaces
export interface Message {
  id: string;
  funnelId: string;
  funnelName?: string;
  businessId: string;
  type: MessageType;
  
  // Contact Information
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // Message Content
  subject?: string;
  message?: string;
  priority: MessagePriority;
  
  // Status Tracking
  status: MessageStatus;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  
  // Delivery Tracking
  emailSentAt?: Date;
  smsSentAt?: Date;
  emailStatus?: DeliveryStatus;
  smsStatus?: DeliveryStatus;
  
  // Metadata
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageType = 'callback_request' | 'system' | 'notification' | 'reminder';
export type MessagePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MessageStatus = 'unread' | 'read' | 'acknowledged' | 'responded' | 'archived';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface CreateMessageDto {
  funnelId: string;
  businessId: string;
  type?: MessageType;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  subject?: string;
  message?: string;
  priority?: MessagePriority;
  metadata?: Record<string, unknown>;
}

export interface UpdateMessageDto {
  status?: MessageStatus;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  emailStatus?: DeliveryStatus;
  smsStatus?: DeliveryStatus;
  metadata?: Record<string, unknown>;
}

export interface MessageFilters {
  status?: MessageStatus[];
  type?: MessageType[];
  priority?: MessagePriority[];
  funnelId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface MessageChannel {
  id: string;
  businessId: string;
  channelType: ChannelType;
  config: Record<string, unknown>;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ChannelType = 'email' | 'sms' | 'webhook';

export interface NotificationPreferences {
  id: string;
  businessId: string;
  
  // In-app notifications
  showBadge: boolean;
  showToast: boolean;
  
  // Email notifications
  emailNewMessages: boolean;
  emailDailySummary: boolean;
  emailWeeklySummary: boolean;
  
  // SMS notifications
  smsUrgentOnly: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryResult {
  success: boolean;
  deliveryId?: string;
  error?: string;
  sentAt: Date;
}

export interface ChannelConfig {
  email?: EmailConfig;
  sms?: SMSConfig;
  webhook?: WebhookConfig;
}

export interface EmailConfig {
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  template?: string;
  sendgridApiKey?: string;
}

export interface SMSConfig {
  fromNumber: string;
  touchSmsApiKey?: string;
  touchSmsUsername?: string;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  headers?: Record<string, string>;
}

// Database row types (camelCase converted from snake_case)
export interface MessageRow {
  id: string;
  funnel_id: string;
  business_id: string;
  type: string;
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
  subject?: string;
  message?: string;
  priority: string;
  status: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  email_sent_at?: string;
  sms_sent_at?: string;
  email_status?: string;
  sms_status?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MessageChannelRow {
  id: string;
  business_id: string;
  channel_type: string;
  config: Record<string, unknown>;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesRow {
  id: string;
  business_id: string;
  show_badge: boolean;
  show_toast: boolean;
  email_new_messages: boolean;
  email_daily_summary: boolean;
  email_weekly_summary: boolean;
  sms_urgent_only: boolean;
  created_at: string;
  updated_at: string;
}