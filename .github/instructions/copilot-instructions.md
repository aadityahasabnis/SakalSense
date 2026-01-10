# SakalSense Copilot Instructions (Professional Developer Guide)

## Architecture Overview

Next.js 16 app with PostgreSQL (Prisma Accelerate), Redis, and React Query (TanStack). App Router with Server Actions and API Routes pattern.

```
apps/frontend/src/
├── app/                     # App Router pages + API routes
│   ├── (authenticated)/     # Protected routes with _components/
│   └── api/                 # Public API routes (auth, webhooks)
├── server/
│   ├── actions/             # Server Actions (authenticated operations)
│   ├── db/                  # Database connections (Prisma, Redis)
│   └── schemas/             # Zod validation schemas
├── lib/                     # Shared utilities
│   ├── auth/                # JWT, passwords, sessions
│   ├── mail/                # Email service
│   ├── rate-limit/          # Rate limiting
│   └── interfaces/          # Type definitions
├── constants/               # Application constants
├── components/              # Shared reusable components only
├── hooks/                   # Custom hooks
└── types/                   # TypeScript types
```

---

## Code Quality Standards

### File Size

- **Maximum 300 lines per file** — Split into smaller, focused modules

### Type Safety

- **No loose types** — Always define explicit, strict types
- **Never use `any`** — Use `unknown` with type guards
- **No `@ts-ignore` or `eslint-disable`** — Fix the underlying issue
- **No generic `<T>` names** — Use meaningful names: `<UserData>`, `<ResponsePayload>`

### React Best Practices

- **Avoid unnecessary `useEffect`** — Prefer derived state, event handlers, or useMemo/useCallback

### Naming Conventions

| Type                | Convention                     | Example                       |
| ------------------- | ------------------------------ | ----------------------------- |
| Components          | PascalCase                     | `UserProfile`, `LoginForm`    |
| Page exports        | camelCase                      | `const page = async () => {}` |
| Files (components)  | PascalCase                     | `UserCard.tsx`                |
| Files (utilities)   | kebab-case                     | `date-utils.ts`               |
| Interfaces          | `I` prefix                     | `IUserData`, `ILoginRequest`  |
| Request interfaces  | `I` prefix + `Request` suffix  | `ILoginRequest`               |
| Response interfaces | `I` prefix + `Response` suffix | `ILoginResponse`              |
| Type aliases        | Descriptive + `Type` suffix    | `StakeholderType`             |
| Constants           | UPPERCASE                      | `STAKEHOLDER`, `HTTP_STATUS`  |

---

## Project Structure

### Server Actions (`/server/actions/`)

- All server actions must reside in `/server/actions/` directory
- Each action must have request/response interfaces defined **above** the function:

```typescript
// Interface naming: I + ActionName + Request/Response
interface IGetUserRequest {
    userId: string;
}

interface IGetUserResponse {
    success: boolean;
    user?: IUserData;
    error?: string;
}

export const getUser = async (params: IGetUserRequest): Promise<IGetUserResponse> => {
    // implementation
};
```

### API Routes (`/app/api/`)

- Public endpoints (auth, webhooks) in `/app/api/`
- Same interface pattern as server actions

```typescript
// app/api/auth/login/route.ts
interface ILoginRequest {
    email: string;
    password: string;
    stakeholder: StakeholderType;
}

interface ILoginResponse {
    success: boolean;
    data?: { user: IUserData };
    error?: string;
}

export const POST = async (req: NextRequest): Promise<NextResponse<ILoginResponse>> => {
    const body: ILoginRequest = await req.json();
    // implementation
};
```

### Database Layer (`/server/db/`)

- Prisma client singleton with Accelerate
- Redis client for sessions and caching

```typescript
// server/db/prisma.ts
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prismaClientSingleton = () => new PrismaClient().$extends(withAccelerate());

type PrismaClientType = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType | undefined };

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Schemas (`/server/schemas/`)

- Schema files contain **ONLY**: types, interfaces, enums, and const arrays
- **NO helper functions, utilities, or logic** in schema files
- Move utilities to `/lib/` or `/utils/`

### Components

#### Page-Specific Components (`/app/*/_components/`)

- Components used only by a specific page belong in `_components/` folder

#### Shared Components (`/components/`)

- Only **truly reusable** components used across multiple pages
- Examples: `Button`, `Modal`, `DataTable`, `FormField`

---

## Code Patterns

### Functions

- **Always use arrow functions** throughout the codebase

```typescript
// ✅ Correct
const handleClick = () => {};
const Page = () => {};

// ❌ Incorrect
function handleClick() {}
function Page() {}
```

### Exports

- **JSX Components**: Export from bottom of file only
- **Utility functions**: Inline exports are acceptable
- **NO barrel exports (index.ts re-exports)** — Import directly from source
- **NO re-exporting types** — Define types in their own file

```typescript
// ✅ Correct - Direct import
import { UserCard } from './UserCard';
import { formatDate } from '@/utils/date-utils';

// ❌ Incorrect - Barrel export
import { UserCard } from './components'; // index.ts re-export
```

### Page Files

- Export **only** the page function
- Use camelCase for the function name

```typescript
const page = async () => {
  return <PageContent />;
};

export default page;
```

---

## API Strategy

### When to Use API Routes

- Authentication endpoints (login, register, logout)
- Password reset flows
- Webhooks and external integrations
- Rate-limited public endpoints

### When to Use Server Actions

- Authenticated data mutations
- Internal operations from protected pages
- Data fetching in Server Components

```typescript
// API Route (public, rate-limited)
// app/api/auth/login/route.ts
export const POST = async (req: NextRequest) => {
    // Rate limiting
    // Authentication
    // Cookie setting
};

// Server Action (authenticated)
// server/actions/auth/password.actions.ts
export const updatePassword = async (params: IUpdatePasswordRequest) => {
    // Already authenticated via cookie
    // Direct database operation
};
```

---

## Data Fetching & Caching

### Use Established Patterns

```typescript
// Client-side queries - use useAPIQuery hook
const { data, isLoading } = useAPIQuery({ url: 'users', fetcher: getAllUsers });

// Mutations with cache invalidation - use useAPIAction hook
const { handleAction } = useAPIAction();
await handleAction({
    actionConfig: { customAction: () => updateUser(id, data) },
    snackbarOptions: { loading: 'Updating...', success: 'Updated!' },
    invalidateEndpoints: { customQueries: ['users'] },
});
```

### Dialogs (Confirm/Form)

```typescript
const { confirmDialog, formDialog } = useDialog();
confirmDialog({ title: 'Delete?', variant: 'destructive', onConfirm: () => deleteItem(id) });
```

---

## Database Patterns

### Prisma Queries

```typescript
// ✅ GOOD: Select only needed fields
const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true },
    where: { isActive: true },
});

// ✅ GOOD: Include relations in single query
const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true },
});

// ❌ BAD: N+1 query problem
const users = await prisma.user.findMany();
const profiles = await Promise.all(users.map((u) => prisma.profile.findUnique({ where: { userId: u.id } })));
```

### Redis Key Patterns

```typescript
// ✅ GOOD: Flat namespace
const sessionKey = `session:${role}:${userId}:${sessionId}`;
const rateLimitKey = `ratelimit:${sanitizedId}`;

// ❌ BAD: Nested paths (creates folder structure)
const key = `session/${role}/${userId}`;
```

---

## Authentication Architecture

### 3-Level Stakeholder Model

| Role          | Registration  | Session Limit |
| ------------- | ------------- | ------------- |
| USER          | Public signup | 1 concurrent  |
| ADMIN         | Invite-only   | 2 concurrent  |
| ADMINISTRATOR | Seeded only   | 2 concurrent  |

### Session Flow

```
Login → Create Session (Redis) → Generate JWT → Set Cookie
  ↓
Request → Verify JWT → Validate Session (Redis) → Process
  ↓
Logout → Invalidate Session (Redis) → Clear Cookie
```

### JWT with Jose (Edge-Compatible)

```typescript
// lib/auth/jwt.ts
import { SignJWT, jwtVerify } from 'jose';

export const signJWT = async (payload: IJWTPayload): Promise<string> =>
    new SignJWT({ ...payload }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('15d').sign(new TextEncoder().encode(process.env.JWT_SECRET));
```

---

## Constants Organization

All constants in `src/constants/` with separate files:

```
constants/
├── auth.constants.ts       # Stakeholders, cookies, session config
├── http.constants.ts       # HTTP status codes, error messages
├── email.constants.ts      # Email configuration
├── rate-limit.constants.ts # Rate limiting tiers
└── paths/                  # Route paths
```

### Type-Safe Constants

```typescript
export const STAKEHOLDER = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    ADMINISTRATOR: 'ADMINISTRATOR',
} as const;

export type StakeholderType = (typeof STAKEHOLDER)[keyof typeof STAKEHOLDER];
```

---

## Code Optimization

### One-Liner Philosophy

```typescript
// ✅ GOOD: Concise
export const double = (n: number): number => n * 2;
const status = age >= 18 ? 'adult' : 'minor';
const names = users.map((u) => u.name);
const displayName = user.name ?? user.email ?? 'Anonymous';

// ❌ BAD: Verbose
let status;
if (age >= 18) {
    status = 'adult';
} else {
    status = 'minor';
}
```

### Tailwind Optimization

```typescript
// ✅ GOOD: All classnames on single line
<div className="flex items-center justify-between px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md" />
```

---

## Commands

```bash
pnpm install     # Install dependencies (always use pnpm)
pnpm dev         # Development server
pnpm build       # Production build
pnpm lint        # ESLint check
pnpm type-check  # TypeScript check
npx prisma migrate dev  # Run migrations
npx prisma generate     # Generate Prisma client
```

---

## Icons

- **Single user icon**: Always use `CircleUserRound`
- **Multiple users icon**: Always use `UsersRound`
- Import: `import { CircleUserRound, UsersRound } from 'lucide-react'`

---

## Summary Checklist

- [ ] Files under 300 lines
- [ ] No `any` types
- [ ] No generic `<T>` — use meaningful names
- [ ] No `@ts-ignore` or `eslint-disable`
- [ ] No unnecessary `useEffect`
- [ ] No barrel exports (index.ts re-exports)
- [ ] Arrow functions everywhere
- [ ] Components in PascalCase
- [ ] Interfaces with `I` prefix + `Request`/`Response` suffix
- [ ] Request/Response interfaces above functions
- [ ] Server actions return `{ success, data?, error? }`
- [ ] Constants in dedicated files
- [ ] Direct imports only
- [ ] Page functions in camelCase
- [ ] Using `CircleUserRound` for single user, `UsersRound` for groups

---

## Error Handling

### Server Actions

```typescript
export const createUser = async (data: ICreateUserRequest): Promise<ICreateUserResponse> => {
    try {
        const user = await prisma.user.create({ data });
        return { success: true, data: { user } };
    } catch (error) {
        console.error('[createUser]', error);
        return { success: false, error: 'Failed to create user' };
    }
};
```

### API Routes

```typescript
export const POST = async (req: NextRequest): Promise<NextResponse> => {
    try {
        const body = await req.json();
        // implementation
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[API/auth/login]', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
};
```

---

## Performance Best Practices

### React Performance

```typescript
// ✅ GOOD: Memo for expensive components
export const ExpensiveComponent = memo(({ data }: Props) => (
  <div>{/* render expensive UI */}</div>
));

// ✅ GOOD: useMemo for expensive computations
const sortedUsers = useMemo(
  () => users.sort((a, b) => a.name.localeCompare(b.name)),
  [users],
);
```

### Database Query Optimization

```typescript
// ✅ GOOD: Select only needed fields
const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
});

// ✅ GOOD: Batch operations
await prisma.user.createMany({ data: users, skipDuplicates: true });
```

---

## Code Generation Guidelines for AI

### When Writing Code

- Think optimization first — every line counts
- Use functional patterns over imperative loops
- Keep components under 100 lines
- Use TypeScript inference where safe, explicit types for public APIs
- Follow existing folder structure strictly
- Never invent new directories without justification
- Don't add dependencies without explicit request
- Use meaningful generic type names, never `<T>` alone

### Scaling Assumptions

- Codebase will grow to multiple teams
- Frontend will handle millions of users
- Prioritize clarity over cleverness
- Assume reviewers are senior engineers
