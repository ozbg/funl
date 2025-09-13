import { z } from 'zod';

// Message validation schemas
export const CreateMessageSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  businessId: z.string().uuid('Invalid business ID'),
  type: z.enum(['callback_request', 'system', 'notification', 'reminder']).default('callback_request'),
  contactName: z.string().min(1, 'Contact name is required').max(100, 'Contact name too long'),
  contactPhone: z.string().regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Invalid phone number format').optional(),
  contactEmail: z.string().email('Invalid email format').optional(),
  subject: z.string().max(200, 'Subject too long').optional(),
  message: z.string().max(2000, 'Message too long').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const UpdateMessageSchema = z.object({
  status: z.enum(['unread', 'read', 'acknowledged', 'responded', 'archived']).optional(),
  acknowledgedAt: z.date().optional(),
  acknowledgedBy: z.string().uuid().optional(),
  emailStatus: z.enum(['pending', 'sent', 'delivered', 'failed']).optional(),
  smsStatus: z.enum(['pending', 'sent', 'delivered', 'failed']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const MessageFiltersSchema = z.object({
  status: z.array(z.enum(['unread', 'read', 'acknowledged', 'responded', 'archived'])).optional(),
  type: z.array(z.enum(['callback_request', 'system', 'notification', 'reminder'])).optional(),
  priority: z.array(z.enum(['low', 'medium', 'high', 'urgent'])).optional(),
  funnelId: z.string().uuid().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

export const CreateChannelSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
  channelType: z.enum(['email', 'sms', 'webhook']),
  config: z.record(z.string(), z.unknown()),
  isEnabled: z.boolean().default(true)
});

export const EmailConfigSchema = z.object({
  fromName: z.string().min(1, 'From name is required'),
  fromEmail: z.string().email('Invalid from email'),
  replyTo: z.string().email('Invalid reply-to email').optional(),
  template: z.string().optional(),
  sendgridApiKey: z.string().optional()
});

export const SMSConfigSchema = z.object({
  fromNumber: z.string().min(1, 'From number is required'),
  touchSmsApiKey: z.string().optional(),
  touchSmsUsername: z.string().optional()
});

export const WebhookConfigSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  secret: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional()
});

export const NotificationPreferencesSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
  showBadge: z.boolean().default(true),
  showToast: z.boolean().default(true),
  emailNewMessages: z.boolean().default(true),
  emailDailySummary: z.boolean().default(true),
  emailWeeklySummary: z.boolean().default(false),
  smsUrgentOnly: z.boolean().default(true)
});

// Export types from schemas
export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export type UpdateMessageInput = z.infer<typeof UpdateMessageSchema>;
export type MessageFiltersInput = z.infer<typeof MessageFiltersSchema>;
export type CreateChannelInput = z.infer<typeof CreateChannelSchema>;
export type EmailConfigInput = z.infer<typeof EmailConfigSchema>;
export type SMSConfigInput = z.infer<typeof SMSConfigSchema>;
export type WebhookConfigInput = z.infer<typeof WebhookConfigSchema>;
export type NotificationPreferencesInput = z.infer<typeof NotificationPreferencesSchema>;