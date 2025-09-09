# FunL.app Development Plan & Technical Specification

## Executive Summary

FunL.app is a QR-code funnel platform targeting real estate agents and small businesses. The platform enables users to create dynamic, trackable QR code funnels that convert physical signage viewers into digital leads. Built for rapid deployment with 1000 initial users, scaling to 10,000+.

**Core Value**: Turn every physical sign into a trackable, dynamic digital funnel that captures leads directly into phones via vCard technology.

---

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: Next.js 15.5, React 19.1, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Infrastructure**: Vercel (hosting), Cloudflare (CDN)
- **Payments**: Stripe
- **Communications**: SendGrid
- **Analytics**: Custom edge middleware + Supabase

### Architecture Pattern
**Monolithic Next.js application** with clear domain boundaries:

```
┌─────────────────────────────────────────────┐
│           Next.js Application               │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │   Auth   │  │ Funnels  │  │Analytics │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Payments │  │   QR Gen │  │  Email   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
├─────────────────────────────────────────────┤
│           Supabase Backend                  │
│  • PostgreSQL with RLS                      │
│  • Auth (JWT)                               │
│  • Storage (QR PDFs)                        │
│  • Realtime subscriptions                   │
└─────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
/funl-app
├── /src
│   ├── /app                    # Next.js App Router
│   │   ├── /(auth)             # Public auth pages
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── /(dashboard)        # Protected routes
│   │   │   ├── funnels/
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   └── billing/
│   │   ├── /api                # API Routes
│   │   │   ├── webhooks/       # Stripe, print fulfillment
│   │   │   ├── qr/             # QR generation
│   │   │   └── tracking/       # Analytics endpoints
│   │   └── /f/[id]             # Public funnel pages
│   ├── /components
│   │   ├── /ui                 # Base components (Radix)
│   │   ├── /features           # Feature-specific
│   │   └── /layouts            # Page layouts
│   ├── /lib
│   │   ├── /supabase           # Database client
│   │   ├── /stripe             # Payment logic
│   │   ├── /qr                 # QR generation
│   │   └── /email              # SendGrid
│   ├── /hooks                  # Custom React hooks
│   ├── /stores                 # Zustand stores
│   ├── /types                  # TypeScript definitions
│   └── /utils                  # Helpers
├── /public
├── /tests
└── /migrations                 # Supabase migrations
```

---

## 📊 Data Models

### Core Entities

```typescript
// Business Account
interface Business {
  id: string;
  email: string;
  name: string;
  type: 'individual' | 'agency';
  phone: string;
  website?: string;
  vcard_data: VCardData;
  subscription_status: 'trial' | 'active' | 'cancelled';
  subscription_tier: 'basic' | 'pro' | 'enterprise';
  created_at: Date;
  updated_at: Date;
}

// Funnel Definition
interface Funnel {
  id: string;
  business_id: string;
  name: string;
  type: 'contact' | 'property' | 'video';
  status: 'draft' | 'active' | 'paused' | 'archived';
  template_id: string;
  qr_code_url: string;
  short_url: string; // funl.app/f/abc123
  
  // Dynamic content
  content: {
    headline?: string;
    state?: 'for_sale' | 'sold' | 'coming_soon';
    price?: string;
    property_url?: string;
    video_url?: string;
    custom_message?: string;
    cta_button_text?: string;
  };
  
  // Print options
  print_size: 'A4' | 'A5';
  print_status?: 'pending' | 'processing' | 'shipped';
  
  created_at: Date;
  updated_at: Date;
  expires_at?: Date;
}

// Analytics Events
interface ClickEvent {
  id: string;
  funnel_id: string;
  session_id: string;
  action: 'view' | 'vcard_download' | 'callback_request' | 'link_click';
  metadata: {
    user_agent: string;
    ip_country?: string;
    referrer?: string;
    device_type: 'mobile' | 'desktop';
  };
  created_at: Date;
}

// Callback Requests
interface CallbackRequest {
  id: string;
  funnel_id: string;
  name: string;
  phone: string;
  preferred_time?: string;
  message?: string;
  status: 'pending' | 'contacted' | 'completed';
  created_at: Date;
}
```

---

## 🚀 Development Roadmap

### Phase 1: Foundation (Week 1-2) ✅ **COMPLETED**
**Goal**: Core infrastructure and authentication

#### Sprint 1.1 - Setup & Auth ✅
- [x] Initialize Next.js 15.5 project with TypeScript
- [x] Configure Supabase project and connection
- [x] Implement authentication flow (signup, login, logout)
- [x] Create business profile management
- [x] Setup database migrations system
- [x] Configure TypeScript and build pipeline

#### Sprint 1.2 - UI Foundation ✅
- [x] Install and configure core dependencies
- [x] Create responsive layouts (auth, dashboard)
- [x] Implement navigation and routing
- [x] Setup Tailwind CSS design system
- [x] Create landing page
- [x] Setup middleware for route protection

**Deliverables**: ✅ Working auth system, business profiles, responsive UI

---

### Phase 2: Core Features (Week 3-4) ✅ **COMPLETED**
**Goal**: Funnel creation and QR generation

#### Sprint 2.1 - Funnel Management ✅
- [x] Funnel CRUD operations
- [x] Template selection (3 types: contact, property, video)
- [x] Dynamic content editor
- [x] QR code generation with nanoid short URLs
- [x] Short URL system (funl.app/f/[id])
- [x] Funnel detail and edit pages

#### Sprint 2.2 - Public Funnel Pages ✅
- [x] Mobile-optimized landing pages
- [x] vCard generation and download
- [x] Callback request form
- [x] Dynamic content rendering
- [x] Click tracking API and hooks
- [x] Link to external properties and videos

**Deliverables**: ✅ Complete funnel creation flow, working QR codes, public pages, basic analytics

---

### Phase 3: Analytics & Communication (Week 5)
**Goal**: Tracking and user engagement

#### Sprint 3.1 - Analytics Dashboard
- [ ] Real-time click tracking
- [ ] Analytics dashboard UI
- [ ] Traffic graphs and metrics
- [ ] Device and location breakdown
- [ ] Export analytics to CSV
- [ ] Daily/weekly email reports

#### Sprint 3.2 - Communication
- [ ] SendGrid integration
- [ ] Callback request notifications
- [ ] Email templates
- [ ] Weekly traffic summaries
- [ ] Lead export functionality

**Deliverables**: Full analytics system, email notifications

---

### Phase 4: Monetization (Week 6)
**Goal**: Payment processing and subscriptions

#### Sprint 4.1 - Stripe Integration
- [ ] Stripe subscription setup
- [ ] Pricing tiers (Basic, Pro, Enterprise)
- [ ] Payment flow UI
- [ ] Billing management page
- [ ] Invoice generation
- [ ] Trial period logic

#### Sprint 4.2 - Print Fulfillment (Optional MVP)
- [ ] Print partner API integration
- [ ] Order management system
- [ ] Shipping tracking
- [ ] Print preview UI

**Deliverables**: Working payment system, subscription management

---

### Phase 5: Polish & Launch (Week 7-8)
**Goal**: Production readiness

#### Sprint 5.1 - Optimization
- [ ] Performance optimization
- [ ] SEO implementation
- [ ] Security audit
- [ ] Load testing
- [ ] Mobile testing
- [ ] Cross-browser testing

#### Sprint 5.2 - Launch Preparation
- [ ] Production deployment
- [ ] Monitoring setup (Sentry)
- [ ] Documentation
- [ ] Admin tools
- [ ] Customer support system
- [ ] Marketing website

**Deliverables**: Production-ready application

---

## 📝 Coding Standards

### TypeScript Requirements

```typescript
// ✅ CORRECT: Explicit types, no any
interface CreateFunnelDto {
  name: string;
  type: FunnelType;
  templateId: string;
  content?: Partial<FunnelContent>;
}

export async function createFunnel(
  businessId: string,
  data: CreateFunnelDto
): Promise<Funnel> {
  // Implementation
}

// ❌ WRONG: any types, implicit returns
function createFunnel(businessId: any, data: any) {
  // Implementation
}
```

### Component Standards

```tsx
// ✅ CORRECT: Typed, testable, single responsibility
interface FunnelCardProps {
  funnel: Funnel;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const FunnelCard = memo<FunnelCardProps>(({ 
  funnel, 
  onEdit, 
  onDelete 
}) => {
  return (
    <Card className="p-4">
      <CardHeader>
        <h3>{funnel.name}</h3>
        <Badge>{funnel.status}</Badge>
      </CardHeader>
      {/* ... */}
    </Card>
  );
});

FunnelCard.displayName = 'FunnelCard';
```

### API Route Standards

```typescript
// ✅ CORRECT: Type-safe, validated, error handling
import { createRouteHandler } from '@/lib/api';
import { CreateFunnelSchema } from '@/schemas/funnel';

export const POST = createRouteHandler(async (req) => {
  const session = await requireAuth(req);
  const body = await req.json();
  const validated = CreateFunnelSchema.parse(body);
  
  try {
    const funnel = await createFunnel(session.businessId, validated);
    return NextResponse.json(funnel);
  } catch (error) {
    return handleApiError(error);
  }
});
```

### Database Query Standards

```typescript
// ✅ CORRECT: Type-safe, RLS-aware, error handling
export async function getFunnelsByBusiness(
  businessId: string,
  options?: { limit?: number; offset?: number }
): Promise<Funnel[]> {
  const { data, error } = await supabase
    .from('funnels')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .range(
      options?.offset || 0, 
      (options?.offset || 0) + (options?.limit || 10) - 1
    );
    
  if (error) {
    logger.error('Failed to fetch funnels', { error, businessId });
    throw new DatabaseError('Failed to fetch funnels');
  }
  
  return data.map(transformFunnelFromDb);
}
```

### State Management Standards

```typescript
// ✅ CORRECT: Typed Zustand store with actions
interface FunnelStore {
  funnels: Funnel[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchFunnels: () => Promise<void>;
  createFunnel: (data: CreateFunnelDto) => Promise<void>;
  updateFunnel: (id: string, data: Partial<Funnel>) => Promise<void>;
  deleteFunnel: (id: string) => Promise<void>;
}

export const useFunnelStore = create<FunnelStore>((set, get) => ({
  funnels: [],
  loading: false,
  error: null,
  
  fetchFunnels: async () => {
    set({ loading: true, error: null });
    try {
      const funnels = await api.funnels.list();
      set({ funnels, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  // ... other actions
}));
```

### Testing Standards

```typescript
// ✅ CORRECT: Comprehensive, isolated, descriptive
describe('Funnel Creation', () => {
  beforeEach(() => {
    // Setup
  });
  
  it('should create a contact funnel with valid data', async () => {
    const { result } = renderHook(() => useFunnelStore());
    
    await act(async () => {
      await result.current.createFunnel({
        name: 'Test Funnel',
        type: 'contact',
        templateId: 'template-1'
      });
    });
    
    expect(result.current.funnels).toHaveLength(1);
    expect(result.current.funnels[0]).toMatchObject({
      name: 'Test Funnel',
      type: 'contact'
    });
  });
  
  it('should handle API errors gracefully', async () => {
    server.use(
      rest.post('/api/funnels', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    const { result } = renderHook(() => useFunnelStore());
    
    await act(async () => {
      await result.current.createFunnel({} as any);
    });
    
    expect(result.current.error).toBeTruthy();
  });
});
```

---

## 🔒 Security Requirements

### Authentication & Authorization
- JWT-based authentication via Supabase
- Row Level Security (RLS) on all tables
- Business-scoped data access
- Session management with refresh tokens

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention via prepared statements
- XSS protection (React default)
- CORS configuration
- Rate limiting on API routes

### Infrastructure Security
- HTTPS only
- Environment variables for secrets
- No credentials in code
- Secure headers (CSP, HSTS)
- Regular dependency updates

---

## 🎯 Quality Gates

### Pre-commit
- ESLint pass
- Prettier formatting
- TypeScript compilation
- Unit tests pass

### Pre-merge
- All CI checks pass
- 80% test coverage
- No console.logs
- Performance budget met
- Security scan pass

### Production Deploy
- All tests pass
- Build succeeds
- Lighthouse score >90
- No critical vulnerabilities
- Database migrations applied

---

## 📊 Success Metrics

### Performance KPIs
- Time to First Byte (TTFB) < 200ms
- First Contentful Paint (FCP) < 1.5s
- Time to Interactive (TTI) < 3.5s
- QR generation time < 3s
- API response time < 500ms

### Business KPIs
- User signup to first funnel < 5 minutes
- Funnel creation time < 2 minutes
- 99.9% uptime
- < 1% error rate
- Mobile conversion rate > 80%

---

## 🚨 Risk Mitigation

### Technical Risks
1. **QR Generation Timeout**: Implement queue-based generation
2. **Database Performance**: Add indexes, implement caching
3. **Payment Failures**: Webhook retry logic, manual reconciliation
4. **Scale Beyond 1000 Users**: Database connection pooling, CDN

### Business Risks
1. **Low Adoption**: A/B testing, user feedback loops
2. **Competition**: Rapid feature iteration
3. **Print Fulfillment Delays**: Multiple vendor fallbacks

---

## 🛠️ Development Tools

### Required Setup
```bash
# Environment Variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=

# Development Commands
npm run dev          # Start development server
npm run build        # Production build
npm run typecheck    # TypeScript validation
npm run lint         # ESLint check
npm run test         # Run tests
npm run test:e2e     # E2E tests
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
```

### Git Workflow
```bash
# Branch Strategy
main                 # Production
develop              # Staging
feature/*            # New features
fix/*                # Bug fixes
hotfix/*             # Production fixes

# Commit Convention
feat: add QR code generation
fix: resolve vCard iOS issue
refactor: optimize analytics queries
docs: update API documentation
test: add funnel creation tests
chore: update dependencies
```

---

## 📚 Documentation Requirements

### Code Documentation
- JSDoc for all public functions
- README for each major module
- API documentation (OpenAPI)
- Component storybook

### User Documentation
- User guide
- API documentation
- FAQ section
- Video tutorials

---

## 🎬 Getting Started

```bash
# 1. Clone repository
git clone https://github.com/funl/funl-app
cd funl-app

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Fill in environment variables

# 4. Setup database
npm run db:migrate
npm run db:seed

# 5. Start development
npm run dev
```

---

## 👥 Team Responsibilities

### Frontend Developer
- React components
- UI/UX implementation
- Client-side state
- Responsive design

### Backend Developer
- API routes
- Database queries
- Authentication
- Integrations

### DevOps/Full-Stack
- Deployment pipeline
- Monitoring
- Performance optimization
- Security

---

## 📅 Timeline Summary

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | Foundation | Auth, UI framework, database |
| 3-4 | Core Features | Funnels, QR codes, landing pages |
| 5 | Analytics | Tracking, dashboard, emails |
| 6 | Payments | Stripe, subscriptions |
| 7-8 | Polish | Testing, optimization, launch |

**Total Duration**: 8 weeks to production
**Team Size**: 2-3 developers
**Budget**: ~$60/month infrastructure