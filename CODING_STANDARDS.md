# FunL.app Coding Standards & Best Practices

## 🎯 Core Principles

1. **Type Safety First** - 100% TypeScript, no `any`
2. **Clean Over Clever** - Readable code wins
3. **Test Everything** - 80% coverage minimum
4. **Performance Matters** - Sub-3s page loads
5. **Security by Default** - OWASP compliance

---

## 📐 Code Organization

### File Naming
```
components/FunnelCard.tsx       # PascalCase for components
lib/create-funnel.ts           # kebab-case for utilities
hooks/use-funnel.ts            # kebab-case with use- prefix
types/funnel.types.ts          # .types.ts for type files
constants/funnel.constants.ts  # .constants.ts for constants
```

### Folder Structure
```
/feature
  /components     # UI components
  /hooks         # Feature-specific hooks
  /lib           # Business logic
  /types         # TypeScript types
  /utils         # Helper functions
  index.ts       # Public exports
```

---

## 🔷 TypeScript Standards

### Type Everything
```typescript
// ✅ GOOD: Explicit types
interface FunnelProps {
  id: string;
  name: string;
  type: 'contact' | 'property' | 'video';
  onUpdate: (id: string, data: Partial<Funnel>) => Promise<void>;
}

// ❌ BAD: any or implicit types
const processFunnel = (data: any) => { }
const getName = (funnel) => funnel.name;
```

### Use Type Guards
```typescript
// ✅ GOOD: Type guard for runtime safety
function isFunnel(obj: unknown): obj is Funnel {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj &&
    ['contact', 'property', 'video'].includes((obj as any).type)
  );
}

// Usage
if (!isFunnel(data)) {
  throw new ValidationError('Invalid funnel data');
}
```

### Prefer Interfaces Over Types
```typescript
// ✅ GOOD: Interface for objects
interface User {
  id: string;
  email: string;
}

// ✅ GOOD: Type for unions/primitives
type Status = 'active' | 'inactive' | 'pending';
type ID = string | number;
```

---

## ⚛️ React/Next.js Standards

### Component Structure
```tsx
// ✅ GOOD: Clean component structure
import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { FunnelProps } from './types';

export const FunnelCard = memo<FunnelProps>(({ 
  id, 
  name, 
  type,
  onUpdate 
}) => {
  const handleClick = useCallback(() => {
    onUpdate(id, { viewed: true });
  }, [id, onUpdate]);

  return (
    <div 
      className={cn(
        'rounded-lg p-4',
        'hover:shadow-lg transition-shadow'
      )}
      onClick={handleClick}
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <span className="text-sm text-gray-500">{type}</span>
    </div>
  );
});

FunnelCard.displayName = 'FunnelCard';
```

### Server Components by Default
```tsx
// ✅ GOOD: Server component for data fetching
// app/funnels/page.tsx
export default async function FunnelsPage() {
  const funnels = await getFunnels(); // Server-side fetch
  
  return (
    <div>
      <h1>Your Funnels</h1>
      <FunnelList funnels={funnels} />
    </div>
  );
}

// ✅ GOOD: Client component only when needed
// components/FunnelList.tsx
'use client';

export function FunnelList({ funnels }: Props) {
  const [selected, setSelected] = useState<string>();
  // Interactive component
}
```

### Custom Hooks
```typescript
// ✅ GOOD: Descriptive hook with clear return
export function useFunnel(id: string) {
  const [funnel, setFunnel] = useState<Funnel>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    fetchFunnel(id)
      .then(setFunnel)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  return { funnel, loading, error } as const;
}
```

---

## 🗄️ Database Standards

### Supabase Queries
```typescript
// ✅ GOOD: Type-safe with error handling
export async function createFunnel(
  businessId: string,
  data: CreateFunnelDto
): Promise<Funnel> {
  const { data: funnel, error } = await supabase
    .from('funnels')
    .insert({
      business_id: businessId,
      ...data,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create funnel', { error, businessId });
    throw new DatabaseError(`Failed to create funnel: ${error.message}`);
  }

  return transformFunnelFromDb(funnel);
}
```

### RLS Policies
```sql
-- ✅ GOOD: Row Level Security
CREATE POLICY "Users can only see own funnels" ON funnels
  FOR SELECT USING (business_id = auth.uid());

CREATE POLICY "Users can only update own funnels" ON funnels
  FOR UPDATE USING (business_id = auth.uid());
```

---

## 🎨 Styling Standards

### Tailwind Classes
```tsx
// ✅ GOOD: Organized classes with cn()
import { cn } from '@/lib/utils';

<div 
  className={cn(
    // Layout
    'flex flex-col gap-4',
    // Styling
    'bg-white rounded-lg shadow-md',
    // Spacing
    'p-4 md:p-6',
    // States
    'hover:shadow-lg transition-shadow',
    // Conditional
    isActive && 'ring-2 ring-blue-500'
  )}
/>

// ❌ BAD: Long unorganized string
<div className="flex flex-col gap-4 bg-white rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow" />
```

### Component Variants
```tsx
// ✅ GOOD: Use CVA for variants
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}
```

---

## 🔐 Security Standards

### Input Validation
```typescript
// ✅ GOOD: Zod validation
import { z } from 'zod';

const CreateFunnelSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['contact', 'property', 'video']),
  content: z.object({
    headline: z.string().max(200).optional(),
    price: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
  }).optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  
  try {
    const validated = CreateFunnelSchema.parse(body);
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors },
        { status: 400 }
      );
    }
  }
}
```

### Authentication
```typescript
// ✅ GOOD: Protected route with auth check
export async function GET(req: Request) {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Process authenticated request
}
```

---

## 🧪 Testing Standards

### Unit Tests
```typescript
// ✅ GOOD: Descriptive, isolated tests
describe('createFunnel', () => {
  it('should create a funnel with valid data', async () => {
    const funnel = await createFunnel('business-123', {
      name: 'Test Funnel',
      type: 'contact',
    });
    
    expect(funnel).toMatchObject({
      name: 'Test Funnel',
      type: 'contact',
      businessId: 'business-123',
    });
  });
  
  it('should throw error for invalid type', async () => {
    await expect(
      createFunnel('business-123', {
        name: 'Test',
        type: 'invalid' as any,
      })
    ).rejects.toThrow('Invalid funnel type');
  });
});
```

### Integration Tests
```typescript
// ✅ GOOD: API route testing
describe('POST /api/funnels', () => {
  it('should create funnel for authenticated user', async () => {
    const response = await fetch('/api/funnels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Test Funnel',
        type: 'contact',
      }),
    });
    
    expect(response.status).toBe(201);
    const funnel = await response.json();
    expect(funnel.name).toBe('Test Funnel');
  });
});
```

---

## 🚀 Performance Standards

### Code Splitting
```tsx
// ✅ GOOD: Lazy load heavy components
import dynamic from 'next/dynamic';

const QRGenerator = dynamic(
  () => import('@/components/QRGenerator'),
  { 
    loading: () => <Skeleton />,
    ssr: false 
  }
);
```

### Memoization
```tsx
// ✅ GOOD: Memoize expensive operations
const ExpensiveComponent = memo(({ data }: Props) => {
  const processed = useMemo(
    () => processLargeDataset(data),
    [data]
  );
  
  const handleClick = useCallback((id: string) => {
    // Handle click
  }, []);
  
  return <div>{/* Render */}</div>;
});
```

### Image Optimization
```tsx
// ✅ GOOD: Use Next.js Image
import Image from 'next/image';

<Image
  src="/funnel-preview.png"
  alt="Funnel preview"
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```

---

## 🔄 State Management

### Zustand Store
```typescript
// ✅ GOOD: Typed store with actions
interface FunnelStore {
  // State
  funnels: Funnel[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchFunnels: () => Promise<void>;
  addFunnel: (funnel: Funnel) => void;
  updateFunnel: (id: string, updates: Partial<Funnel>) => void;
  deleteFunnel: (id: string) => void;
  
  // Computed
  getFunnelById: (id: string) => Funnel | undefined;
}

export const useFunnelStore = create<FunnelStore>((set, get) => ({
  funnels: [],
  loading: false,
  error: null,
  
  fetchFunnels: async () => {
    set({ loading: true });
    try {
      const funnels = await api.funnels.list();
      set({ funnels, loading: false });
    } catch (error) {
      set({ 
        error: error.message, 
        loading: false 
      });
    }
  },
  
  addFunnel: (funnel) => set((state) => ({
    funnels: [...state.funnels, funnel]
  })),
  
  updateFunnel: (id, updates) => set((state) => ({
    funnels: state.funnels.map(f => 
      f.id === id ? { ...f, ...updates } : f
    )
  })),
  
  deleteFunnel: (id) => set((state) => ({
    funnels: state.funnels.filter(f => f.id !== id)
  })),
  
  getFunnelById: (id) => get().funnels.find(f => f.id === id),
}));
```

---

## 📝 Error Handling

### Custom Error Classes
```typescript
// ✅ GOOD: Specific error types
export class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}
```

### Error Boundaries
```tsx
// ✅ GOOD: Error boundary for sections
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('Component error', { error, info });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

---

## 🔧 API Standards

### RESTful Routes
```typescript
// ✅ GOOD: RESTful API design
GET    /api/funnels          // List all funnels
GET    /api/funnels/:id      // Get single funnel
POST   /api/funnels          // Create funnel
PATCH  /api/funnels/:id      // Update funnel
DELETE /api/funnels/:id      // Delete funnel

// ✅ GOOD: Nested resources
GET    /api/funnels/:id/analytics
POST   /api/funnels/:id/duplicate
```

### Response Format
```typescript
// ✅ GOOD: Consistent response format
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    fields?: Record<string, string>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Success response
return NextResponse.json<ApiResponse<Funnel>>({
  data: funnel,
});

// Error response
return NextResponse.json<ApiResponse<never>>({
  error: {
    message: 'Validation failed',
    fields: { name: 'Required' }
  }
}, { status: 400 });
```

---

## 📦 Git Conventions

### Branch Naming
```bash
feature/add-qr-generation     # New feature
fix/vcard-ios-bug            # Bug fix
refactor/payment-flow        # Code refactoring
docs/api-endpoints           # Documentation
test/funnel-creation         # Test additions
chore/update-deps            # Maintenance
```

### Commit Messages
```bash
# Format: <type>: <description>

feat: add QR code generation for funnels
fix: resolve vCard download issue on iOS devices
refactor: optimize database queries for analytics dashboard
docs: update API documentation for funnel endpoints
test: add integration tests for payment flow
chore: update dependencies to latest versions
perf: improve funnel loading performance
style: format code with prettier
```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] No console.logs
- [ ] Documentation updated
```

---

## ✅ Code Review Checklist

### Before Submitting PR
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Tests pass with >80% coverage
- [ ] No hardcoded values
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Mobile responsive
- [ ] Accessibility checked

### Review Focus Areas
- [ ] Security vulnerabilities
- [ ] Performance issues
- [ ] Code duplication
- [ ] Proper typing
- [ ] Business logic accuracy
- [ ] Database query efficiency
- [ ] Error handling
- [ ] Edge cases covered

---

## 🏃 Performance Checklist

### Frontend
- [ ] Images optimized and lazy loaded
- [ ] Code split at route level
- [ ] Fonts preloaded
- [ ] CSS purged in production
- [ ] Bundle size < 200KB per route

### Backend
- [ ] Database queries optimized
- [ ] N+1 queries eliminated
- [ ] Proper indexes added
- [ ] Response caching implemented
- [ ] API response time < 500ms

### Monitoring
- [ ] Core Web Vitals tracked
- [ ] Error tracking enabled
- [ ] Performance monitoring
- [ ] User analytics
- [ ] Uptime monitoring

---

## 📚 Resources

### Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Regex101](https://regex101.com/)
- [Bundle Analyzer](https://bundlephobia.com/)
- [Can I Use](https://caniuse.com/)

---

## 🚫 Anti-Patterns to Avoid

```typescript
// ❌ Using any
const processData = (data: any) => { }

// ❌ Ignoring errors
try {
  await riskyOperation();
} catch (e) {
  // Silent fail
}

// ❌ Direct DOM manipulation in React
document.getElementById('myDiv').innerHTML = 'Hello';

// ❌ Mutating state
state.funnels.push(newFunnel);

// ❌ Inline styles
<div style={{ color: 'red', fontSize: '16px' }}>

// ❌ Magic numbers
if (count > 5) { }  // What is 5?

// ❌ Global variables
window.myGlobalVar = 'value';

// ❌ Synchronous operations in async context
const data = fs.readFileSync('file.txt');
```

---

## 🎓 Learning Path

1. **Week 1**: TypeScript fundamentals, Next.js basics
2. **Week 2**: Supabase integration, RLS policies
3. **Week 3**: React patterns, performance optimization
4. **Week 4**: Testing strategies, CI/CD
5. **Ongoing**: Code reviews, pair programming