# Optimization Guidelines

## Performance Principles

### Minimal Code, Maximum Value

- **Every line serves a purpose** — Remove dead code immediately
- **Combine related logic** into single expressions where readable
- **Prefer ternaries** over if/else for simple conditionals
- **Use destructuring** to reduce variable declarations
- **Chain array methods** instead of multiple iterations

### One-Liner Philosophy

```typescript
// ✅ GOOD: Concise arrow functions
export const double = (n: number): number => n * 2;

// ✅ GOOD: One-liner conditional
const status = age >= 18 ? 'adult' : 'minor';

// ✅ GOOD: One-liner array transformation
const names = users.map((u) => u.name);

// ✅ GOOD: Early return
if (!user) return undefined;

// ✅ GOOD: Nullish coalescing
const displayName = user.name ?? user.email ?? 'Anonymous';

// ❌ BAD: Verbose when one-liner is clearer
let status;
if (age >= 18) {
    status = 'adult';
} else {
    status = 'minor';
}
```

---

## File Organization

### Import Structure

- **Single line imports** — One line per import statement
- **Order**: Built-in → External → Internal → Parent → Sibling → Types
- **Newline between groups**

```typescript
// ✅ GOOD
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db/prisma';
import { signJWT } from '@/lib/auth/jwt';

import { HTTP_STATUS } from '@/constants/http.constants';
import { type ILoginRequest } from '@/lib/interfaces/auth.interfaces';
```

### No Barrel Exports

```typescript
// ❌ BAD: index.ts re-exports
export { UserCard } from './UserCard';
export { AdminCard } from './AdminCard';

// ✅ GOOD: Direct imports from source
import { UserCard } from './UserCard';
```

### No Type Re-exports

```typescript
// ❌ BAD
import type { UserData } from '@/types/user';
export type { UserData };

// ✅ GOOD: Define types in their schema file
export interface IUserData { ... }
```

---

## Database Optimization

### Prisma Query Patterns

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
// ✅ GOOD: Flat namespace, no nested folders
const key = `session:${role}:${userId}:${sessionId}`;
const key = `ratelimit:${sanitizedId}`;

// ❌ BAD: Nested paths (creates folder structure)
const key = `session/${role}/${userId}/${sessionId}`;
```

---

## React Optimization

### No Unnecessary useEffect

```typescript
// ❌ BAD: Derived state in useEffect
const [fullName, setFullName] = useState('');
useEffect(() => {
    setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ GOOD: Derived during render
const fullName = `${firstName} ${lastName}`;
```

### Use useMemo for Expensive Computations

```typescript
// ✅ GOOD
const filteredUsers = useMemo(() => users.filter((u) => u.role === selectedRole), [users, selectedRole]);
```

### Use useCallback for Stable Callbacks

```typescript
// ✅ GOOD
const handleSubmit = useCallback(async (data: FormData) => {
    await submitForm(data);
}, []);
```

---

## Tailwind Optimization

- **All classnames on single line**
- **Use responsive prefixes**: `md:`, `lg:`, `xl:`
- **Prefer utility classes** over custom CSS
- **Use `@apply` sparingly** — Only for true component patterns

```typescript
// ✅ GOOD
<div className="flex items-center justify-between px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md" />
```

---

## API Response Optimization

### Consistent Response Structure

```typescript
interface IApiResponse<TData = unknown> {
    success: boolean;
    data?: TData;
    error?: string;
    message?: string;
}
```

### Pagination Pattern

```typescript
interface IPaginatedResponse<TData> {
    data: Array<TData>;
    meta: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
```

---

## Session/Auth Optimization

### Fire-and-Forget TTL Refresh

```typescript
// Don't block request for TTL refresh
updateSessionActivity(sessionId, userId, role); // No await

// Continue with request processing
```

### Edge-Compatible JWT (Jose)

```typescript
// Use jose library instead of jsonwebtoken
import { SignJWT, jwtVerify } from 'jose';

// Works in Edge runtime (middleware, API routes)
```

---

## Constants Optimization

### Single Source of Truth

```typescript
// Define once, derive types
export const STAKEHOLDER = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    ADMINISTRATOR: 'ADMINISTRATOR',
} as const;

export type StakeholderType = (typeof STAKEHOLDER)[keyof typeof STAKEHOLDER];

// Use the constant, not magic strings
const role: StakeholderType = STAKEHOLDER.USER;
```

### Configuration Objects

```typescript
export const SESSION_CONFIG = {
    TTL: 15 * 24 * 60 * 60,
    LIMIT: { USER: 1, ADMIN: 2, ADMINISTRATOR: 2 },
} as const;
```

---

## Caching Strategy

### Server Actions with Tags

```typescript
// Fetch with cache tag
const users = await prisma.user.findMany();
unstable_cache(async () => prisma.user.findMany(), ['users'], { tags: ['users'], revalidate: 60 });

// Invalidate on mutation
revalidateTag('users');
```

### Redis Caching

```typescript
// Cache expensive queries
const cacheKey = `users:active:${page}`;
let users = await redis.get(cacheKey);

if (!users) {
    users = await prisma.user.findMany({ where: { isActive: true } });
    await redis.setEx(cacheKey, 300, JSON.stringify(users)); // 5 min TTL
}
```

---

## Common Mistakes to Avoid

| Mistake                      | Solution                       |
| ---------------------------- | ------------------------------ |
| Using `any` type             | Use `unknown` with type guards |
| N+1 database queries         | Use `include` or batch queries |
| Magic numbers/strings        | Use constants                  |
| Blocking on non-critical ops | Fire-and-forget                |
| Over-fetching data           | Select only needed fields      |
| Barrel exports               | Direct imports                 |
| useEffect for derived state  | Compute during render          |
