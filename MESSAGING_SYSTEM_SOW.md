# Callback Messaging System - Scope of Work Integration Plan

## System Overview

Based on the existing FunL architecture, I'll design a comprehensive callback messaging system that integrates with the current funnel-based platform. The system will handle message storage, delivery, acknowledgments, and notifications across multiple channels (in-app, email, SMS).

## Current Architecture Analysis

**Existing Components:**
- Database: Supabase with `callback_requests` table (currently empty)
- Frontend: Next.js 15.5 with React 19.1
- State Management: Zustand (implied from coding standards)
- UI Components: Radix UI with Tailwind CSS
- Authentication: JWT-based with RLS policies

**Existing Tables:**
- `businesses` - Business account data
- `funnels` - QR code funnels 
- `callback_requests` - Lead capture forms (basic structure exists)
- `click_events` - Analytics tracking

## Proposed Messaging System Architecture

### 1. Database Schema Extensions

```sql
-- Enhanced Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('callback_request', 'system', 'notification', 'reminder')) DEFAULT 'callback_request',
  
  -- Contact Information
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Message Content
  subject TEXT,
  message TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  
  -- Status Tracking
  status TEXT CHECK (status IN ('unread', 'read', 'acknowledged', 'responded', 'archived')) DEFAULT 'unread',
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES businesses(id),
  
  -- Delivery Tracking
  email_sent_at TIMESTAMPTZ,
  sms_sent_at TIMESTAMPTZ,
  email_status TEXT CHECK (email_status IN ('pending', 'sent', 'delivered', 'failed')),
  sms_status TEXT CHECK (sms_status IN ('pending', 'sent', 'delivered', 'failed')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Channels Table
CREATE TABLE message_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  channel_type TEXT CHECK (channel_type IN ('email', 'sms', 'webhook')) NOT NULL,
  
  -- Channel Configuration
  config JSONB NOT NULL, -- Email templates, SMS provider settings, etc.
  is_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id, channel_type)
);

-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- In-app notifications
  show_badge BOOLEAN DEFAULT TRUE,
  show_toast BOOLEAN DEFAULT TRUE,
  
  -- Email notifications
  email_new_messages BOOLEAN DEFAULT TRUE,
  email_daily_summary BOOLEAN DEFAULT TRUE,
  email_weekly_summary BOOLEAN DEFAULT FALSE,
  
  -- SMS notifications (future)
  sms_urgent_only BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id)
);
```

### 2. Universal Messaging Module Structure

```
/src/lib/messaging/
├── core/
│   ├── message-manager.ts       # Central message orchestrator
│   ├── message-types.ts         # TypeScript definitions
│   └── message-validator.ts     # Input validation schemas
├── channels/
│   ├── email-channel.ts         # SendGrid integration
│   ├── sms-channel.ts          # TouchSMS integration
│   ├── webhook-channel.ts       # Future webhook support
│   └── base-channel.ts         # Abstract channel interface
├── storage/
│   ├── message-repository.ts   # Database operations
│   └── message-cache.ts        # Redis/memory caching
├── notifications/
│   ├── notification-manager.ts # In-app notifications
│   ├── badge-manager.ts        # Notification badges
│   └── toast-manager.ts        # Toast notifications
└── index.ts                    # Public API exports
```

### 3. Core Components Implementation

#### Message Manager (Central Orchestrator)
```typescript
export class MessageManager {
  async createMessage(data: CreateMessageDto): Promise<Message> {
    // 1. Validate input
    // 2. Store in database
    // 3. Queue for delivery channels
    // 4. Trigger real-time notifications
    // 5. Update analytics
  }
  
  async acknowledgeMessage(id: string, businessId: string): Promise<void> {
    // 1. Update status to acknowledged
    // 2. Update notification counters
    // 3. Trigger real-time updates
  }
  
  async getMessagesForBusiness(businessId: string, filters?: MessageFilters): Promise<Message[]> {
    // 1. Apply RLS security
    // 2. Apply filters (funnel, status, date range)
    // 3. Return paginated results
  }
}
```

#### Channel System (Email & SMS)
```typescript
interface MessageChannel {
  send(message: Message, config: ChannelConfig): Promise<DeliveryResult>;
  getStatus(deliveryId: string): Promise<DeliveryStatus>;
}

class EmailChannel implements MessageChannel {
  async send(message: Message, config: EmailConfig): Promise<DeliveryResult> {
    // SendGrid integration with templates
  }
}

class SMSChannel implements MessageChannel {
  async send(message: Message, config: SMSConfig): Promise<DeliveryResult> {
    // TouchSMS integration
  }
}
```

### 4. Frontend Integration

#### Message Dashboard Component
```typescript
// /src/components/messaging/MessageDashboard.tsx
export function MessageDashboard() {
  const { messages, unreadCount, loading } = useMessages();
  const { acknowledgeMessage } = useMessageActions();
  
  return (
    <div className="space-y-4">
      <MessageHeader unreadCount={unreadCount} />
      <MessageFilters />
      <MessageList 
        messages={messages}
        onAcknowledge={acknowledgeMessage}
      />
    </div>
  );
}
```

#### Notification System
```typescript
// /src/components/notifications/NotificationBadge.tsx
export function NotificationBadge() {
  const unreadCount = useUnreadMessageCount();
  
  if (unreadCount === 0) return null;
  
  return (
    <Badge variant="destructive" className="animate-pulse">
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}
```

### 5. API Routes

```typescript
// /src/app/api/messages/route.ts
export async function GET(req: Request) {
  // Get messages for authenticated business
  // Support filtering by funnel, status, date range
  // Return paginated results
}

export async function POST(req: Request) {
  // Create new message (from callback forms)
  // Trigger delivery channels
  // Send real-time notifications
}

// /src/app/api/messages/[id]/acknowledge/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  // Mark message as acknowledged
  // Update notification counters
  // Trigger real-time updates
}
```

### 6. Integration Points

#### Funnel Pages Integration
```typescript
// Update existing callback form submission
async function handleCallbackSubmit(data: CallbackFormData) {
  // 1. Create message record
  const message = await messageManager.createMessage({
    funnelId: funnel.id,
    businessId: funnel.businessId,
    type: 'callback_request',
    contactName: data.name,
    contactPhone: data.phone,
    message: data.message,
    priority: 'medium'
  });
  
  // 2. MessageManager handles:
  //    - Database storage
  //    - Email notification to business
  //    - SMS notification (if configured)
  //    - Real-time dashboard update
}
```

#### Dashboard Navigation
```typescript
// Add message count to dashboard navigation
function DashboardNav() {
  const unreadCount = useUnreadMessageCount();
  
  return (
    <nav>
      <NavItem href="/dashboard/messages">
        Messages
        {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
      </NavItem>
    </nav>
  );
}
```

### 7. Real-time Features

#### Supabase Realtime Integration
```typescript
// /src/hooks/useRealtimeMessages.ts
export function useRealtimeMessages(businessId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `business_id=eq.${businessId}`
      }, handleMessageChange)
      .subscribe();
      
    return () => channel.unsubscribe();
  }, [businessId]);
  
  return { messages };
}
```

### 8. Security Implementation

#### Row Level Security Policies
```sql
-- Messages RLS
CREATE POLICY "Users can only see own messages" ON messages
  FOR SELECT USING (business_id = auth.uid());

CREATE POLICY "Users can update own messages" ON messages  
  FOR UPDATE USING (business_id = auth.uid());

-- Message Channels RLS
CREATE POLICY "Users can manage own channels" ON message_channels
  FOR ALL USING (business_id = auth.uid());
```

#### Input Validation
```typescript
// Message validation schemas
export const CreateMessageSchema = z.object({
  funnelId: z.string().uuid(),
  contactName: z.string().min(1).max(100),
  contactPhone: z.string().regex(/^[\+]?[0-9\s\-\(\)]+$/).optional(),
  contactEmail: z.string().email().optional(),
  message: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
});
```

## Implementation Phases & Timeline

### Phase 1: Core Messaging Infrastructure (Week 1-2)
**Sprint 1.1 - Database & Backend**
- [ ] Create enhanced database schema with migrations
- [ ] Implement MessageManager core class
- [ ] Create message repository with RLS policies
- [ ] Build basic API routes (GET, POST, PATCH)
- [ ] Add message validation schemas

**Sprint 1.2 - Frontend Foundation**
- [ ] Create messaging component library
- [ ] Implement useMessages hook with Zustand store
- [ ] Build basic MessageDashboard component
- [ ] Add notification badge to navigation
- [ ] Integrate with existing callback forms

### Phase 2: Channel Integration (Week 3)
**Sprint 2.1 - Email Integration**
- [ ] Implement EmailChannel with SendGrid
- [ ] Create email templates for notifications
- [ ] Add email configuration to business settings
- [ ] Build email delivery tracking
- [ ] Test email notification workflow

**Sprint 2.2 - SMS Integration**
- [ ] Implement SMSChannel with TouchSMS
- [ ] Add SMS configuration to business settings
- [ ] Create SMS notification templates
- [ ] Build SMS delivery tracking
- [ ] Test SMS notification workflow

### Phase 3: Advanced Features (Week 4)
**Sprint 3.1 - Real-time & Notifications**
- [ ] Implement Supabase realtime subscriptions
- [ ] Add toast notifications for new messages
- [ ] Build notification preferences UI
- [ ] Create message filtering and search
- [ ] Add bulk actions (acknowledge all, archive)

**Sprint 3.2 - Analytics & Reporting**
- [ ] Add message analytics to dashboard
- [ ] Create daily/weekly email summaries
- [ ] Build message export functionality
- [ ] Add response time tracking
- [ ] Implement message archiving

### Phase 4: Polish & Optimization (Week 5)
**Sprint 4.1 - Performance & Testing**
- [ ] Add message caching layer
- [ ] Optimize database queries
- [ ] Write comprehensive tests
- [ ] Performance optimization
- [ ] Security audit

**Sprint 4.2 - UX Enhancement**
- [ ] Polish UI/UX design
- [ ] Add keyboard shortcuts
- [ ] Implement message threading
- [ ] Add message templates
- [ ] Mobile optimization

## Resource Requirements

### Development Team
- **Backend Developer**: Database schema, API routes, channel integrations
- **Frontend Developer**: React components, real-time features, UI/UX
- **Full-Stack Developer**: Integration work, testing, deployment

### External Services
- **SendGrid**: Email delivery (existing integration)
- **TouchSMS**: SMS delivery service integration
- **Supabase**: Database, auth, realtime (existing)

### Infrastructure Costs
- SendGrid: ~$20/month (1000 emails/day)
- TouchSMS: ~$0.05/SMS message
- Supabase: Current plan (no additional cost)
- Additional storage: ~$5/month

## Success Metrics

### Technical KPIs
- Message delivery time < 30 seconds
- 99.5% email delivery rate
- 98% SMS delivery rate
- Real-time notification latency < 2 seconds
- API response time < 200ms

### Business KPIs
- 95% message acknowledgment rate
- < 1 hour average response time
- 80% customer satisfaction with notifications
- 50% reduction in missed leads

## Risk Mitigation

### Technical Risks
1. **Channel Integration Failures**: Implement retry logic and fallback notifications
2. **Real-time Performance**: Add message queuing and rate limiting
3. **Database Performance**: Implement proper indexing and query optimization
4. **Security Vulnerabilities**: Regular security audits and input validation

### Business Risks
1. **SMS Costs**: Implement usage monitoring and budget alerts
2. **Email Deliverability**: Use proper authentication and reputation management
3. **User Adoption**: Gradual rollout with training and documentation

## Quality Assurance

### Testing Strategy
- **Unit Tests**: 90% coverage for core messaging logic
- **Integration Tests**: End-to-end message flow testing
- **Load Testing**: 1000 concurrent users, 10k messages/hour
- **Security Testing**: Input validation, RLS policies, authentication

### Monitoring & Alerts
- Message delivery success rates
- API response times and error rates
- Database performance metrics
- Channel provider status monitoring

## Next Steps

### Immediate Actions
1. **Review & Approval**: Present this plan to stakeholders for approval
2. **Resource Allocation**: Assign development team members to specific phases
3. **Environment Setup**: Prepare development and staging environments
4. **Service Accounts**: Set up TouchSMS and verify SendGrid configuration

### Getting Started
1. **Database Migration**: Begin with Phase 1 database schema implementation
2. **Core Module**: Build the universal messaging module foundation
3. **Integration Testing**: Set up automated testing pipeline
4. **Documentation**: Create API documentation and integration guides

This comprehensive messaging system will transform the FunL platform into a complete lead management solution, ensuring no callback requests are missed while providing businesses with professional, multi-channel communication capabilities. The modular architecture ensures scalability and maintainability while adhering to the existing coding standards and security requirements.