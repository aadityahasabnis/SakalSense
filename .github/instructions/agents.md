# SakalSense AI Agent Instructions

> **Comprehensive guide for AI agents to understand, build, and optimize SakalSense — a unified learning platform combining the best of GFG, Wikipedia, Medium, and Coursera.**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Deep Dive](#architecture-deep-dive)
3. [Codebase Structure](#codebase-structure)
4. [Code Standards & Patterns](#code-standards--patterns)
5. [Backend Optimization Strategies](#backend-optimization-strategies)
6. [Frontend Optimization Strategies](#frontend-optimization-strategies)
7. [Performance Best Practices](#performance-best-practices)
8. [User Experience Optimization](#user-experience-optimization)
9. [Admin Experience Optimization](#admin-experience-optimization)
10. [Scalability Blueprint](#scalability-blueprint)
11. [Implementation Priorities](#implementation-priorities)
12. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)

---

## Project Overview

### What is SakalSense?

SakalSense is a **unified learning platform** that combines:

- **GeeksForGeeks**: Structured technical content (articles, tutorials, cheatsheets)
- **Wikipedia**: Interconnected knowledge with dynamic linking
- **Medium**: Blog-style personal insights from verified creators
- **Coursera-lite**: Multi-section courses with progress tracking

### Vision

**"Everything is learnable. Everything is connected."**

Content is never flat — it can exist standalone, be grouped into series/courses, link to other content, and embed assessments.

### 3-Tier Stakeholder Model

| Role              | Registration | Session Limit | Key Capabilities                    |
| ----------------- | ------------ | ------------- | ----------------------------------- |
| **USER**          | Public       | 1             | Browse, bookmark, track progress    |
| **ADMIN**         | Invite-only  | 2             | Create content, manage series       |
| **ADMINISTRATOR** | Seeded only  | 2             | Invite admins, manage taxonomy      |

---

## Architecture Deep Dive

### Technology Stack

| Layer        | Technology                          | Purpose                            |
| ------------ | ----------------------------------- | ---------------------------------- |
| Frontend     | Next.js 16 (App Router)             | UI, SSR, Server Components         |
| State        | Jotai (client) + TanStack Query     | Global state + server state cache  |
| Forms        | Config-driven Form.tsx              | Minimal code, consistent UX        |
| UI           | shadcn/ui + Tailwind CSS            | Professional, accessible           |
| Backend      | Server Actions + API Routes         | Secure mutations + public APIs     |
| Database     | PostgreSQL + Prisma Accelerate      | Scalable, connection pooling       |
| Cache        | Redis                               | Sessions, rate limiting, caching   |
| Notifications| Sonner toast                        | Professional feedback              |

### Data Flow Architecture

```
User Request
    ↓
[Next.js App Router]
    ↓
┌──────────────────────────────────────┐
│  Server Component                    │
│  - Auth check via getCurrentUser()   │
│  - Data fetch via Server Actions     │
│  - Redis cache check (60s TTL)       │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  Client Component                    │
│  - TanStack Query for caching        │
│  - Jotai for UI state                │
│  - Optimistic updates                │
└──────────────────────────────────────┘
    ↓
[UI Render with shadcn/ui]
```

---

## Codebase Structure

```
apps/frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Authenticated routes
│   │   │   ├── (user)/             # User dashboard, content view
│   │   │   ├── admin/              # Admin content management
│   │   │   └── administrator/      # Platform management
│   │   ├── (unAuth)/               # Public routes (login, register)
│   │   ├── api/                    # API Routes (auth, webhooks)
│   │   └── page.tsx                # Landing page
│   │
│   ├── server/                     # Server-side code
│   │   ├── actions/                # Server Actions
│   │   │   ├── auth/               # Login, register, sessions
│   │   │   ├── content/            # CRUD for content, series, courses
│   │   │   ├── engagement/         # Likes, comments, bookmarks
│   │   │   └── administrator/      # Taxonomy, admin invites
│   │   ├── db/                     # Database clients
│   │   │   ├── prisma.ts           # Prisma singleton + Accelerate
│   │   │   └── redis.ts            # Redis singleton
│   │   └── utils/                  # Server utilities
│   │
│   ├── components/                 # Shared React components
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── form/                   # Config-driven form system
│   │   ├── table/                  # DataTable with caching
│   │   ├── layout/                 # Navbar, Sidebar, Footer
│   │   ├── engagement/             # Comments, Likes, Bookmarks
│   │   └── content/                # ContentCard, ContentReader
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAPIQuery.ts          # TanStack Query wrapper
│   │   ├── useAPIAction.ts         # Mutations with invalidation
│   │   ├── useContentActions.ts    # Content CRUD hook
│   │   ├── useSeriesActions.ts     # Series management
│   │   ├── useCourseActions.ts     # Course management
│   │   └── useDialog.tsx           # Dialog system (confirm/form/view)
│   │
│   ├── jotai/                      # Global state atoms
│   │   └── atoms.ts                # Table, search, editor, notifications
│   │
│   ├── constants/                  # Type-safe constants
│   │   ├── auth.constants.ts       # Stakeholders, cookies, session
│   │   ├── content.constants.ts    # Content types, statuses
│   │   ├── http.constants.ts       # Status codes, messages
│   │   └── paths/                  # Route paths per role
│   │
│   ├── types/                      # TypeScript interfaces
│   │   ├── content.types.ts        # Content, Series, Course
│   │   ├── table.types.ts          # DataTable config
│   │   └── form.types.ts           # Form field definitions
│   │
│   └── lib/                        # Shared utilities
│       ├── auth.ts                 # getCurrentUser, JWT decode
│       ├── auth-cache.ts           # Redis user caching
│       ├── utils.ts                # cn() and helpers
│       └── interfaces/             # API response types
│
├── prisma/
│   └── schema.prisma               # Database schema (705 lines)
│
└── scripts/
    └── create-admin.ts             # Admin seeding CLI
```

---

## Code Standards & Patterns

### TypeScript Rules

```typescript
// ✅ ALWAYS use arrow functions
const handleClick = () => {};
const Page = async () => {};
export const getUser = async (id: string): Promise<IUserResponse> => {};

// ❌ NEVER use function declarations
function handleClick() {}
function Page() {}
```

### Interface Naming

```typescript
// ✅ GOOD: Prefix with I, suffix with Request/Response
interface IGetContentRequest {
    id: string;
}

interface IGetContentResponse {
    success: boolean;
    data?: IContentWithRelations;
    error?: string;
}

// ❌ BAD: Generic names
interface ContentData {}
interface Response<T> {}
```

### Type Safety

```typescript
// ✅ GOOD: Use Array<T> for consistency
const items: Array<IContentListItem> = [];

// ✅ GOOD: Type-safe constants
export const STAKEHOLDER = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    ADMINISTRATOR: 'ADMINISTRATOR',
} as const;

export type StakeholderType = (typeof STAKEHOLDER)[keyof typeof STAKEHOLDER];

// ❌ BAD: any type
const data: any = fetchData(); // Never do this
```

### File Organization

```typescript
// ✅ GOOD: Single-line imports, ordered by category
import { useCallback, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { prisma } from '@/server/db/prisma';
import { type IContentInput } from '@/types/content.types';

// ❌ BAD: Barrel exports
export { UserCard } from './UserCard'; // Avoid index.ts re-exports
```

### Server Action Pattern

```typescript
// server/actions/content/contentActions.ts
'use server';

interface ICreateContentRequest {
    title: string;
    slug: string;
    // ... fields
}

interface ICreateContentResponse {
    success: boolean;
    data?: { id: string };
    error?: string;
    message?: string;
}

export const createContent = async (
    input: ICreateContentRequest,
): Promise<ICreateContentResponse> => {
    try {
        // 1. Auth check
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        // 2. Validate
        // 3. Execute
        // 4. Return success

        return { success: true, data: { id: content.id } };
    } catch (error) {
        console.error('[createContent]', error);
        return { success: false, error: 'Failed to create content' };
    }
};
```

---

## Backend Optimization Strategies

### 1. Prisma Query Optimization

```typescript
// ✅ ALWAYS select only needed fields
const contents = await prisma.content.findMany({
    select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        creator: {
            select: {
                fullName: true,
                avatarLink: true,
            },
        },
    },
    where: { status: 'PUBLISHED' },
});

// ✅ ALWAYS use parallel queries with Promise.all
const [contents, total] = await Promise.all([
    prisma.content.findMany({ where, select, skip, take }),
    prisma.content.count({ where }),
]);

// ✅ USE Prisma Accelerate caching for public data
const featured = await prisma.content.findMany({
    where: { status: 'PUBLISHED', isFeatured: true },
    cacheStrategy: { ttl: 300, swr: 60 }, // 5 min cache, 1 min stale
});

// ❌ AVOID N+1 queries
// BAD: Fetching in loop
for (const content of contents) {
    const creator = await prisma.admin.findUnique({ where: { id: content.creatorId } });
}
// GOOD: Use include or separate query
```

### 2. Redis Optimization

```typescript
// ✅ Use flat key namespaces
const sessionKey = `session:${role}:${userId}:${sessionId}`;
const cacheKey = `user:${stakeholder}:${userId}`;

// ✅ Fire-and-forget for non-critical operations
void setCachedUser(stakeholder, userId, userData); // Don't await

// ✅ Use appropriate TTLs
const CACHE_TTL = {
    USER_SESSION: 15 * 24 * 60 * 60, // 15 days
    AUTH_CACHE: 60,                   // 60 seconds
    RATE_LIMIT: 60,                   // 1 minute window
    CONTENT_CACHE: 300,               // 5 minutes
} as const;

// ✅ Use pipeline for multiple operations
const multi = redis.multi();
multi.zRemRangeByScore(key, 0, now - windowMs);
multi.zCard(key);
multi.zAdd(key, { score: now, value: id });
multi.expire(key, windowMs / 1000);
await multi.exec();

// ❌ AVOID KEYS command in production (blocks Redis)
// Use SCAN instead for pattern matching
```

### 3. Authentication Caching

```typescript
// lib/auth-cache.ts - Already implemented pattern
export const getCachedUser = async (
    stakeholder: StakeholderKey,
    userId: string,
): Promise<ICurrentUser | null> => {
    try {
        const redis = await getRedis();
        const key = `user:${stakeholder}:${userId}`;
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null; // Fail silently, fallback to DB
    }
};

export const setCachedUser = async (
    stakeholder: StakeholderKey,
    userId: string,
    user: ICurrentUser,
): Promise<void> => {
    try {
        const redis = await getRedis();
        const key = `user:${stakeholder}:${userId}`;
        await redis.setEx(key, 60, JSON.stringify(user)); // 60 second TTL
    } catch {
        // Fail silently
    }
};
```

### 4. Database Schema Optimization

The Prisma schema already has excellent indexing:

```prisma
// Good patterns in schema.prisma:
@@index([email])        // Fast user lookups
@@index([slug])         // Fast content lookups
@@index([status])       // Filter by status
@@index([creatorId])    // Admin's content list
@@index([contentId])    // Engagement queries
@@index([createdAt])    // Time-based queries
```

**Additional recommendations:**

```prisma
// Consider composite indexes for common queries
@@index([status, creatorId])      // Admin dashboard
@@index([status, type])           // Public filtering
@@index([status, publishedAt])    // Trending content
```

---

## Frontend Optimization Strategies

### 1. React Component Optimization

```typescript
// ✅ Use useMemo for expensive computations
const sortedContent = useMemo(
    () => contents.sort((a, b) => a.title.localeCompare(b.title)),
    [contents],
);

// ✅ Use useCallback for stable callbacks passed to children
const handleRefresh = useCallback(() => {
    void refetch();
}, [refetch]);

// ✅ Derive state during render instead of useEffect
const fullName = `${firstName} ${lastName}`; // Not useEffect!

// ❌ AVOID unnecessary useEffect
// BAD: Derived state in useEffect
const [fullName, setFullName] = useState('');
useEffect(() => {
    setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

### 2. TanStack Query Configuration

```typescript
// hooks/useAPIQuery.ts - Current configuration
const QUERY_CONFIG = {
    staleTime: 5 * 60 * 1000,  // 5 minutes before refetch
    gcTime: 10 * 60 * 1000,    // 10 minutes in cache
    maxRetries: 3,
    retryDelay: 1000,
} as const;

// ✅ Use query keys consistently
const { data } = useQuery({
    queryKey: ['content', 'list', filters],
    queryFn: () => getContentList(filters),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false, // Prevent spam refetches
    refetchOnMount: false,       // Use cached data
});

// ✅ Invalidate related queries on mutations
const { mutateAsync } = useAPIAction();
await mutateAsync({
    actionConfig: { customAction: () => createContent(input) },
    invalidateKeys: ['content', 'dashboard-stats'],
});
```

### 3. Form System (Config-Driven)

```typescript
// ✅ Use the Form component with config
const formConfig: FormConfig<IContentInput> = {
    id: 'content-form',
    layout: { cols: 2, gap: 'md', responsive: { md: 2 } },
    fields: [
        { name: 'title', type: 'text', label: 'Title', required: true, colSpan: 2 },
        { name: 'slug', type: 'text', label: 'Slug', required: true },
        { name: 'type', type: 'select', label: 'Type', options: CONTENT_TYPE_OPTIONS },
        { name: 'body', type: 'editor', label: 'Content', colSpan: 2 },
        { type: 'separator' },
        { name: 'metaTitle', type: 'text', label: 'SEO Title', colSpan: 2 },
    ],
    submit: {
        action: (values) => createContent(values),
        label: 'Save Content',
        redirectOnSuccess: '/admin/content',
        invalidateQueries: ['content'],
    },
};

<Form config={formConfig} initialValues={initialData} />
```

### 4. DataTable with Caching

```typescript
// ✅ Current DataTable implementation with TanStack Query
<DataTable
    config={{
        columns: [...],
        rowKey: 'id',
        pageSize: 20,
        staleTime: 30 * 1000, // 30 seconds
        rowActions: [...],
    }}
    tabs={[
        { key: 'draft', label: 'Drafts', queryKey: ['content', 'draft'], queryFn: getDrafts },
        { key: 'published', label: 'Published', queryKey: ['content', 'published'], queryFn: getPublished },
    ]}
    showSearch
    showRefresh
/>
```

### 5. Jotai State Management

```typescript
// jotai/atoms.ts - Clean atomic state
export const tableFiltersAtom = atom<ITableFilters>(DEFAULT_FILTERS);
export const tableSortAtom = atom<ITableSort>(DEFAULT_SORT);
export const globalSearchOpenAtom = atom(false);

// Derived atom for combined query
export const tableQueryAtom = atom((get) => ({
    ...get(tableFiltersAtom),
    sortField: get(tableSortAtom).field,
    sortDir: get(tableSortAtom).direction,
}));

// Persisted atoms for user preferences
export const sidebarOpenAtom = atomWithStorage('sidebarOpen', true);
export const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light');
```

---

## Performance Best Practices

### Server Component vs Client Component

```typescript
// ✅ Server Component (default) - For data fetching
// app/(auth)/admin/content/page.tsx
const Page = async () => {
    const user = await getCurrentUser(STAKEHOLDER.ADMIN);
    if (!user) redirect('/admin/login');

    const [contents, stats] = await Promise.all([
        getContentList({ page: 1, limit: 20 }),
        getDashboardStats(),
    ]);

    return <ContentClient contents={contents.data} stats={stats.data} />;
};

// ✅ Client Component - For interactivity
// app/(auth)/admin/content/ContentClient.tsx
'use client';

const ContentClient = ({ contents, stats }: Props) => {
    const [search, setSearch] = useState('');
    // Interactive logic...
};
```

### Lazy Loading & Code Splitting

```typescript
// ✅ Dynamic imports for heavy components
const RichTextEditor = dynamic(
    () => import('@/components/editor/RichTextEditor'),
    { loading: () => <Skeleton className="h-64" />, ssr: false }
);

// ✅ Route-based code splitting is automatic in Next.js App Router
```

### Image Optimization

```typescript
// ✅ Use Next.js Image component
import Image from 'next/image';

<Image
    src={content.thumbnailUrl}
    alt={content.title}
    width={300}
    height={200}
    className="rounded-lg object-cover"
    loading="lazy" // Default for below-fold images
    priority={index < 3} // Priority for above-fold images
/>
```

---

## User Experience Optimization

### 1. Instant Feedback

```typescript
// ✅ Toast notifications for all actions (using Sonner)
import { toast } from 'sonner';

const handleBookmark = async () => {
    toast.loading('Adding to bookmarks...');
    const result = await toggleBookmark(contentId);
    if (result.success) {
        toast.success('Added to bookmarks');
    } else {
        toast.error(result.error ?? 'Failed to bookmark');
    }
};
```

### 2. Optimistic Updates

```typescript
// ✅ Update UI before server confirms
const handleLike = async () => {
    // Optimistically update
    setLikeCount((prev) => prev + 1);
    setIsLiked(true);

    const result = await toggleLike(contentId);
    if (!result.success) {
        // Rollback on failure
        setLikeCount((prev) => prev - 1);
        setIsLiked(false);
        toast.error('Failed to like');
    }
};
```

### 3. Loading States

```typescript
// ✅ Skeleton loading for better perceived performance
const LoadingSkeleton = () => (
    <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex gap-4">
                <Skeleton className="h-24 w-32 rounded-lg" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
        ))}
    </div>
);
```

### 4. Progress Tracking (User)

```typescript
// Content reading progress
interface IProgressTracker {
    startReading: () => void;
    updateProgress: (percent: number) => void;
    markComplete: () => void;
}

// Store progress in ContentProgress table
// Show resume position on return visit
// Calculate streak based on daily activity
```

### 5. Search & Discovery

```typescript
// Global search with debounce
const [query, setQuery] = useState('');
const debouncedQuery = useDebouncedValue(query, 300);

const { data } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchContent(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
});
```

---

## Admin Experience Optimization

### 1. Content Creation Flow

```typescript
// Streamlined form with real-time validation
const contentForm = {
    fields: [
        // Required fields first
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true, 
          pattern: /^[a-z0-9-]+$/, 
          validate: async (value) => {
              const exists = await checkSlugExists(value);
              return exists ? 'Slug already in use' : undefined;
          }
        },
        { name: 'type', type: 'select', options: CONTENT_TYPE_OPTIONS },
        
        // Rich content editor
        { name: 'body', type: 'editor', colSpan: 2 },
        
        // Taxonomy
        { name: 'categoryId', type: 'select', label: 'Category' },
        { name: 'topicIds', type: 'multiselect', label: 'Topics' },
        
        // SEO (collapsible)
        { type: 'heading', text: 'SEO Settings', collapsible: true },
        { name: 'metaTitle', type: 'text', showWhen: (v) => v.expandSEO },
        { name: 'metaDescription', type: 'textarea', showWhen: (v) => v.expandSEO },
    ],
};
```

### 2. Auto-save for Long Forms

```typescript
// Auto-save draft every 30 seconds
const useAutoSave = (content: IContentInput, id?: string) => {
    const debouncedContent = useDebouncedValue(content, 30000);

    useEffect(() => {
        if (id && debouncedContent) {
            void saveDraft(id, debouncedContent);
        }
    }, [debouncedContent, id]);
};
```

### 3. Dashboard Analytics

```typescript
// Admin dashboard with key metrics
interface IDashboardStats {
    totalContent: number;
    publishedContent: number;
    draftContent: number;
    totalViews: number;
    totalLikes: number;
    recentComments: Array<IComment>;
    viewTrend: Array<{ date: string; views: number }>;
}
```

### 4. Bulk Operations

```typescript
// Select multiple items for bulk actions
const [selected, setSelected] = useState<Set<string>>(new Set());

const bulkActions = [
    { label: 'Publish', action: bulkPublish, variant: 'default' },
    { label: 'Archive', action: bulkArchive, variant: 'outline' },
    { label: 'Delete', action: bulkDelete, variant: 'destructive' },
];
```

---

## Scalability Blueprint

### 1. Database Scaling

```
Current: PostgreSQL + Prisma Accelerate
    ↓
Scale 1: Read replicas for public queries
    ↓
Scale 2: Horizontal sharding by domain/region
    ↓
Scale 3: Event sourcing for audit trails
```

### 2. Caching Layers

```
Layer 1: Redis (sessions, rate limits, hot data)
Layer 2: Prisma Accelerate (query-level caching)
Layer 3: CDN (static assets, ISR pages)
Layer 4: Browser (TanStack Query, localStorage)
```

### 3. Search at Scale

```
Current: PostgreSQL LIKE queries
    ↓
Scale 1: PostgreSQL Full-Text Search
    ↓
Scale 2: Elasticsearch/Algolia for instant search
```

### 4. Content Delivery

```
Current: Vercel Edge Network
    ↓
Scale 1: Image optimization with Vercel OG
    ↓
Scale 2: Video transcoding with third-party
    ↓
Scale 3: Multi-region deployment
```

---

## Implementation Priorities

### Phase 1: Core Stability (Current)

- [x] Authentication (User, Admin, Administrator)
- [x] Session management with Redis
- [x] Content CRUD for admins
- [x] Toast notifications (Sonner)
- [x] Auth caching for performance
- [ ] Fix remaining TypeScript errors
- [ ] Profile pages for all stakeholders
- [ ] Comment system fixes

### Phase 2: User Experience

- [ ] Content reading progress tracking
- [ ] User streaks and achievements
- [ ] Enhanced search with filters
- [ ] Bookmark organization (folders)
- [ ] Reading history
- [ ] Dark mode polish

### Phase 3: Admin Tools

- [ ] Series management UI
- [ ] Course builder with sections
- [ ] Quiz/Practice creation
- [ ] Analytics dashboard
- [ ] Bulk operations
- [ ] Content scheduling

### Phase 4: Platform Growth

- [ ] Learning paths
- [ ] User-generated comments
- [ ] Creator profiles and following
- [ ] Recommendation engine
- [ ] Email notifications
- [ ] Mobile responsiveness audit

### Phase 5: Scale Preparation

- [ ] Full-text search
- [ ] Image CDN optimization
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)
- [ ] A/B testing infrastructure
- [ ] Analytics (Plausible/PostHog)

---

## Common Pitfalls to Avoid

### Backend

| Pitfall | Solution |
|---------|----------|
| N+1 queries | Use `include` or `Promise.all` |
| Selecting all fields | Use `select` for needed fields only |
| Blocking on cache writes | Fire-and-forget pattern |
| Using `KEYS` in Redis | Use `SCAN` for patterns |
| No error boundaries | Always try/catch in actions |

### Frontend

| Pitfall | Solution |
|---------|----------|
| Derived state in useEffect | Compute during render |
| Missing loading states | Use Skeleton components |
| No error feedback | Toast on every action |
| Over-memoization | Only memoize expensive ops |
| Prop drilling | Use Jotai atoms or context |

### Code Quality

| Pitfall | Solution |
|---------|----------|
| Using `any` type | Use `unknown` + type guards |
| Barrel exports | Direct imports only |
| Magic strings | Use constants |
| Files > 300 lines | Split into modules |
| Generic type names | Use descriptive: `IUserData` not `T` |

---

## Quick Reference: File Limits

| File Type | Max Lines | Notes |
|-----------|-----------|-------|
| Page components | 30 | Server components, minimal logic |
| Client components | 300 | Split if larger |
| Server actions | 50-100 per action | Keep focused |
| Hooks | 100-150 | Single responsibility |
| Utilities | 100 | Pure functions |
| Config files | 200 | Constants, types only |

---

## Commands Reference

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm type-check       # TypeScript check

# Database
npx prisma generate   # Generate Prisma client
npx prisma migrate dev # Run migrations
npx prisma studio     # Database GUI

# Admin Seeding
pnpm tsx scripts/create-admin.ts  # Create admin account
```

---

## Conclusion

SakalSense aims to be the **most comprehensive learning platform** by combining structured content, interconnected knowledge, and progress-driven learning. Every decision should optimize for:

1. **User learning experience** — Fast, engaging, progress-visible
2. **Admin content creation** — Efficient, auto-saving, bulk operations
3. **Platform scalability** — Caching, connection pooling, code splitting
4. **Code maintainability** — Consistent patterns, type safety, documentation

When in doubt, ask: *"Does this make learning easier for users and content creation easier for admins?"*
