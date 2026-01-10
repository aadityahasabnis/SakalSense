# SakalSense Development Instructions

> Professional Next.js monorepo with integrated backend using Server Actions and API Routes.

---

## Architecture Overview

```
apps/frontend/               # Next.js 16 (App Router)
├── src/
│   ├── app/                 # Routes + API endpoints
│   │   └── api/             # Public API routes (auth, webhooks)
│   ├── server/              # Server-side code
│   │   ├── actions/         # Server Actions (authenticated)
│   │   └── db/              # Database connections
│   ├── lib/                 # Shared utilities
│   ├── constants/           # Application constants
│   ├── types/               # TypeScript types
│   └── components/          # React components
├── prisma/                  # Database schema
└── scripts/                 # CLI scripts
```

---

## Code Quality Standards

### Type Safety

- **No `any` types** — Use `unknown` with type guards
- **No `@ts-ignore` or `eslint-disable`** — Fix the underlying issue
- **Explicit return types** for all exported functions
- **Prefer `interface` over `type`** for object shapes
- **Array types**: Use `Array<T>` over `T[]`

### File Limits

- **Maximum 300 lines per file** — Split into smaller modules if exceeded

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

## TypeScript Patterns

### Interface Naming

```typescript
// ✅ GOOD: Meaningful interface names
interface IUserProfileData { ... }
interface ILoginRequest { ... }
interface ILoginResponse { ... }
interface ISessionPayload { ... }

// ❌ BAD: Generic type parameters
interface IData<T> { ... }
type Response<T> = { ... }
```

### Interface Placement

```typescript
// ✅ GOOD: Request/Response interfaces directly above function
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

### Shared Types Location

| Scope             | Location              |
| ----------------- | --------------------- |
| Used in 1 file    | Top of the file       |
| Used in 2+ files  | `lib/interfaces/*.ts` |
| Domain-specific   | `server/schemas/*.ts` |
| Constants-derived | Same file as constant |

---

## Server Actions Pattern

All server actions reside in `src/server/actions/` directory.

```typescript
// server/actions/auth/password.actions.ts
'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/server/db/prisma';

// Request/Response interfaces ABOVE the function
interface IUpdatePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

interface IUpdatePasswordResponse {
    success: boolean;
    message?: string;
    error?: string;
}

export const updatePassword = async (params: IUpdatePasswordRequest): Promise<IUpdatePasswordResponse> => {
    const { currentPassword, newPassword } = params;

    // Validation
    if (newPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
    }

    // Implementation
    return { success: true, message: 'Password updated' };
};
```

### Server Action Rules

1. **One action per function** — Keep actions focused
2. **Interfaces above function** — Always define request/response types
3. **Return consistent structure** — Always `{ success, data?, error? }`
4. **No unnecessary actions** — Combine related operations
5. **Revalidate when needed** — Use `revalidatePath()` or `revalidateTag()`

---

## API Routes Pattern

API Routes are for public endpoints (auth, webhooks) in `src/app/api/`.

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Interfaces at top
interface ILoginRequest {
    email: string;
    password: string;
    stakeholder: 'USER' | 'ADMIN' | 'ADMINISTRATOR';
}

interface ILoginResponse {
    success: boolean;
    data?: { user: IUserData };
    error?: string;
}

export const POST = async (req: NextRequest): Promise<NextResponse<ILoginResponse>> => {
    const body: ILoginRequest = await req.json();

    // Rate limiting
    // Validation
    // Authentication

    return NextResponse.json({ success: true, data: { user } });
};
```

### API Routes vs Server Actions

| Use Case            | Pattern        | Reason                              |
| ------------------- | -------------- | ----------------------------------- |
| Auth endpoints      | API Routes     | Cookie setting, rate limiting       |
| Public webhooks     | API Routes     | External access needed              |
| Protected mutations | Server Actions | Built-in auth, no exposed endpoints |
| Data fetching       | Server Actions | RSC-friendly                        |

---

## Database Layer

### Prisma Client

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

### Redis Client

```typescript
// server/db/redis.ts
import { createClient, type RedisClientType } from 'redis';

let redis: RedisClientType | undefined;

export const getRedis = async (): Promise<RedisClientType> => {
    if (redis?.isReady) return redis;

    redis = createClient({
        username: process.env.REDIS_USERNAME ?? 'default',
        password: process.env.REDIS_PASSWORD,
        socket: {
            host: process.env.REDIS_HOST ?? 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
        },
    });

    await redis.connect();
    return redis;
};
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
├── ui.constants.ts         # UI-related constants
└── paths/                  # Route paths
    ├── admin.paths.ts
    └── user.paths.ts
```

### Constant Patterns

```typescript
// ✅ GOOD: Type-safe const with derived type
export const STAKEHOLDER = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    ADMINISTRATOR: 'ADMINISTRATOR',
} as const;

export type StakeholderType = (typeof STAKEHOLDER)[keyof typeof STAKEHOLDER];

// ✅ GOOD: Configuration object
export const SESSION_CONFIG = {
    TTL: 15 * 24 * 60 * 60, // 15 days in seconds
    LIMIT: { USER: 1, ADMIN: 2, ADMINISTRATOR: 2 },
} as const;
```

---

## Function Patterns

### Always Use Arrow Functions

```typescript
// ✅ GOOD
const handleClick = () => {};
const fetchUser = async (id: string) => {};
export const formatDate = (date: Date): string => {};

// ❌ BAD
function handleClick() {}
function fetchUser(id: string) {}
```

### Export Patterns

```typescript
// ✅ GOOD: Components - export from bottom
const UserCard = ({ user }: IUserCardProps) => {
  return <div>{user.name}</div>;
};

export default UserCard;

// ✅ GOOD: Utilities - inline export
export const formatDate = (date: Date): string => date.toISOString();

// ✅ GOOD: Server Actions - inline export
export const getUser = async (id: string): Promise<IGetUserResponse> => { };
```

### No Barrel Exports

```typescript
// ❌ BAD: index.ts re-exports
export { UserCard } from './UserCard';
export { AdminCard } from './AdminCard';

// ✅ GOOD: Direct imports
import { UserCard } from './UserCard';
import { AdminCard } from './AdminCard';
```

---

## Component Patterns

### Page-Specific Components

```
app/(authenticated)/users/
├── page.tsx                 # Server component
├── loading.tsx              # Loading skeleton
└── _components/             # Page-specific components
    ├── UsersTable.tsx
    ├── UserCard.tsx
    └── UsersFilter.tsx
```

### Shared Components

Only truly reusable components in `/components/`:

- Generic: `Button`, `Modal`, `Card`, `Table`
- Composed: `FormField`, `DataTable`, `Pagination`

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
        // ...
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[API/auth/login]', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
};
```

---

## Commands

```bash
pnpm install     # Install dependencies
pnpm dev         # Development server
pnpm build       # Production build
pnpm lint        # ESLint check
pnpm type-check  # TypeScript check
```

---

## Summary Checklist

- [ ] Files under 300 lines
- [ ] No `any` types
- [ ] No `@ts-ignore` or `eslint-disable`
- [ ] Arrow functions everywhere
- [ ] Components in PascalCase
- [ ] Interfaces with `I` prefix
- [ ] Request/Response interfaces above functions
- [ ] Server actions return `{ success, data?, error? }`
- [ ] Constants in dedicated files
- [ ] No barrel exports (index.ts re-exports)
- [ ] Direct imports only
