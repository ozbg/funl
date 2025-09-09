# FunL App

Turn every sign into a live, trackable funnel that gets buyers into your phone.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

3. **Run database migration**
   - Go to your Supabase dashboard
   - Open SQL Editor
   - Copy and run the contents of `supabase/migrations/001_initial_schema.sql`

4. **Start development server**
   ```bash
   npm run dev
   ```

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Check TypeScript types
- `npm run lint` - Run ESLint

## Tech Stack

- **Frontend**: Next.js 15.5, React 19, TypeScript, Panda CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State**: Zustand
- **Validation**: Zod
- **UI**: Radix UI components

## Features Complete ✅

**Phase 1: Foundation**
- User authentication (signup/login/logout)
- Business profile management  
- Dashboard layout
- Database schema with RLS
- TypeScript setup
- Responsive design

**Phase 2: Core Features**
- Funnel CRUD operations (create, read, update, delete)
- Three funnel types (contact, property, video)
- QR code generation with short URLs
- Mobile-optimized public landing pages
- vCard download functionality
- Basic click tracking and analytics
- Callback request forms

## Next Steps

1. Analytics dashboard
2. Email notifications
3. Stripe payments
4. Print fulfillment integration
5. Advanced features (bulk operations, templates)

## Project Structure

```
/app
  /(auth)         # Authentication pages
  /dashboard      # Protected dashboard
  /api           # API routes
/lib
  /supabase      # Database client
/supabase
  /migrations    # Database migrations
```