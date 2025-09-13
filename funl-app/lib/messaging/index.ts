// Public API exports for the messaging system
export { MessageManager, messageManager } from './core/message-manager';
export { MessageRepository } from './storage/message-repository';

// Types
export type {
  Message,
  CreateMessageDto,
  UpdateMessageDto,
  MessageFilters,
  MessageType,
  MessagePriority,
  MessageStatus,
  DeliveryStatus,
  MessageChannel,
  NotificationPreferences,
  DeliveryResult,
  ChannelConfig,
  EmailConfig,
  SMSConfig,
  WebhookConfig
} from './core/message-types';

// Validation schemas
export {
  CreateMessageSchema,
  UpdateMessageSchema,
  MessageFiltersSchema,
  CreateChannelSchema,
  EmailConfigSchema,
  SMSConfigSchema,
  WebhookConfigSchema,
  NotificationPreferencesSchema
} from './core/message-validator';

export type {
  CreateMessageInput,
  UpdateMessageInput,
  MessageFiltersInput,
  CreateChannelInput,
  EmailConfigInput,
  SMSConfigInput,
  WebhookConfigInput,
  NotificationPreferencesInput
} from './core/message-validator';