# SakalSense Copilot Instructions (Professional Developer Guide)

## Purpose

Canonical guide for AI-assisted development. Enforces architecture, code quality, and maintainability standards across the monorepo. Every line of code must be optimized, concise, and production-ready.

---

## Monorepo Architecture Rules

### Package Structure

- `apps/frontend` → Next.js App Router (TypeScript only). Import `@sakalsense/core` default export only
- `apps/backend` → Express server (TypeScript only). May import `@sakalsense/core/server`
- `packages/core` → Framework-agnostic shared package. Pure TypeScript: types, interfaces, constants, utils
     - Server-only code: `packages/core/src/server`, exported via `package.json` subpath `"./server"`

### Dependency Management

- Use `workspace:*` for all internal packages. Never reference npm registry during development
- Frontend **MUST NOT** import server-only exports
- Backend **MAY** import from `@sakalsense/core/server`
- No circular dependencies allowed between packages

---

## TypeScript Standards

### Configuration

- All packages extend `tsconfig.base.json` from `@tsconfig/node-lts-strictest` [web:9]
- Zero JavaScript files allowed — TypeScript only
- Each package requires `type-check` script: `tsc --noEmit`
- Enable `incremental: true` for cached compilation

### Type Safety Rules

- Explicit return types required for all exported functions
- No `any` types — use `unknown` with type guards
- Prefer `interface` over `type` for object shapes
- Use inline type imports: `import { type User } from './types'`
- Array types: prefer generic syntax `Array<T>` over `T[]`
- Enable readonly modifiers where applicable

### Code Style

- Strict null checks enforced
- Prefer nullish coalescing (`??`) over logical OR
- Use optional chaining (`?.`) for safe property access
- No floating promises — always handle with `await` or `.catch()`

---

## ESLint Configuration

### Flat Config Standards [web:1][web:3]

- Use modern flat config format (ESLint 9+)
- Each app/package owns its configuration
- Root config must not apply global rules
- Explicit plugin imports — no implicit loading

### Core Rules (All Packages)

**Modern JavaScript**

- `no-var`: error — use `const` or `let`
- `prefer-const`: error — immutability first
- `eqeqeq`: error — strict equality only
- `object-shorthand`: error — concise syntax
- `prefer-arrow-callback`: error — no function expressions

**Forbidden Patterns**

- No `function` declarations — arrow functions only
- No `for...in`, `for...of`, `while`, `do...while` loops — use functional iteration
- No duplicate imports
- No multiple empty lines (max: 1)

**Import Organization** [web:2]

- Groups: builtin → external → internal → parent → sibling → index → types
- Alphabetized within groups (case-insensitive)
- Newline between groups
- Inline type imports required: `import { type T } from 'mod'`
- React/Next.js imports first in frontend

**Formatting**

- Single quotes (allow escaping)
- Semicolons required
- No trailing spaces
- Single newline at end of file

### Frontend-Specific (Next.js)

**React Rules**

- Hooks rules enforced
- No useless fragments (allow expressions)
- Self-closing components required
- Curly braces only when necessary: `<div className={val}>`
- Arrow function components only: `const Component = () => { }`
- No target="\_blank" without `rel="noopener noreferrer"`

**Tailwind CSS** [web:7]

- Utility-first approach enforced
- All classnames in single line
- No custom classname warnings (off)
- Use latest Tailwind utilities for layouts (flex, grid)
- Prefer utility classes over custom CSS

### Backend/Core-Specific

- Node.js + TypeScript rules only
- No React-specific rules
- Server-safe code patterns enforced

---

## Next.js App Router Best Practices (apps/frontend)

### Server vs Client Components

**Default to Server Components** — Only use Client Components when absolutely necessary:

- Server Component (default): async data fetching, database access, backend APIs
- Client Component (`'use client'`): interactivity, hooks, browser APIs, event handlers

### Server Component Rules

```typescript
// ✅ GOOD: Server Component with async data fetching
export default async function Page({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await fetchUser(id); // Direct database/API call
  return <UserProfile user={user} />;
};

// ✅ GOOD: Using Suspense for streaming
export default async function Dashboard() => (
  <Suspense fallback={<Skeleton />}>
    <AsyncData />
  </Suspense>
);
```

### Client Component Rules

```typescript
// ✅ GOOD: Minimal Client Component for interactivity
'use client';

export const Counter = () => {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
};

// ❌ BAD: Entire page as Client Component
'use client';
export default function Page() => { /* Don't do this */ };
```

### Server Actions (Form Handling)

```typescript
// ✅ GOOD: Server Action in separate file
'use server';

export const createUser = async (formData: FormData): Promise<{ success: boolean }> => {
  const name = formData.get('name') as string;
  await db.users.insert({ name });
  revalidatePath('/users');
  return { success: true };
};

// ✅ GOOD: Using Server Action in Client Component
'use client';

export const UserForm = () => (
  <form action={createUser}>
    <input name="name" />
    <button type="submit">Create</button>
  </form>
);
```

### Data Fetching Patterns

```typescript
// ✅ GOOD: Parallel data fetching in Server Component
export default async function Page() => {
  const [users, posts] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
  ]);
  return <Dashboard users={users} posts={posts} />;
};

// ✅ GOOD: Streaming with Suspense boundaries
export default async function Page() => (
  <>
    <Suspense fallback={<UsersSkeleton />}>
      <Users />
    </Suspense>
    <Suspense fallback={<PostsSkeleton />}>
      <Posts />
    </Suspense>
  </>
);

// ❌ BAD: Sequential fetching (waterfalls)
const users = await fetchUsers();
const posts = await fetchPosts(); // Waits for users
```

### Route Handlers (API Routes)

```typescript
// ✅ GOOD: Optimized GET route with caching
export const GET = async (req: Request): Promise<Response> => {
	const users = await db.users.findMany();
	return Response.json(users, {
		headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
	});
};

// ✅ GOOD: POST with validation
export const POST = async (req: Request): Promise<Response> => {
	const body = await req.json();
	const validated = UserSchema.parse(body); // Zod validation
	const user = await db.users.create({ data: validated });
	return Response.json(user, { status: 201 });
};

// ❌ BAD: No error handling
export const POST = async (req: Request) => {
	const user = await db.users.create({ data: await req.json() }); // Unsafe
	return Response.json(user);
};
```

### Metadata & SEO

```typescript
// ✅ GOOD: Dynamic metadata
export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
	title: `User ${(await params).id}`,
	description: 'User profile page',
	openGraph: { images: ['/og-image.png'] },
});

// ✅ GOOD: Static metadata
export const metadata: Metadata = {
	title: 'Dashboard',
	description: 'User dashboard',
};
```

### Performance Optimization

```typescript
// ✅ GOOD: Image optimization
import Image from 'next/image';
<Image src="/hero.jpg" alt="Hero" width={800} height={600} priority />;

// ✅ GOOD: Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Client-side only
});

// ✅ GOOD: Font optimization
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap' });
```

---

## Backend Best Practices (apps/backend)

### Express Server Structure

```typescript
// ✅ GOOD: Modular route structure
// src/routes/users.ts
export const usersRouter = Router();

usersRouter.get('/', async (req, res) => {
	const users = await UserService.getAll();
	res.json(users);
});

usersRouter.post('/', async (req, res) => {
	const user = await UserService.create(req.body);
	res.status(201).json(user);
});
```

### Error Handling Middleware

```typescript
// ✅ GOOD: Centralized error handler
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
	console.error(err.stack);
	res.status(err instanceof ValidationError ? 400 : 500).json({
		error: err.message,
		...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
	});
};

// ✅ GOOD: Async route wrapper
export const asyncHandler =
	(fn: RequestHandler): RequestHandler =>
	(req, res, next) =>
		Promise.resolve(fn(req, res, next)).catch(next);

// Usage
router.get(
	'/users',
	asyncHandler(async (req, res) => {
		const users = await db.users.findMany();
		res.json(users);
	}),
);
```

### Validation & Security

```typescript
// ✅ GOOD: Request validation
import { z } from 'zod';

const CreateUserSchema = z.object({
	email: z.string().email(),
	name: z.string().min(2).max(100),
});

router.post(
	'/users',
	asyncHandler(async (req, res) => {
		const data = CreateUserSchema.parse(req.body);
		const user = await db.users.create({ data });
		res.status(201).json(user);
	}),
);

// ✅ GOOD: Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Max 100 requests per window
});

app.use('/api/', limiter);
```

### Database Queries

```typescript
// ✅ GOOD: Optimized query with relations
const users = await db.user.findMany({
	select: { id: true, email: true, profile: { select: { bio: true } } },
	where: { active: true },
	orderBy: { createdAt: 'desc' },
	take: 20,
});

// ✅ GOOD: Transaction handling
const result = await db.$transaction(async (tx) => {
	const user = await tx.user.create({ data: { email } });
	await tx.profile.create({ data: { userId: user.id } });
	return user;
});

// ❌ BAD: N+1 query problem
const users = await db.user.findMany();
const usersWithPosts = await Promise.all(
	users.map((u) => db.post.findMany({ where: { userId: u.id } })),
);
```

### API Response Standards

```typescript
// ✅ GOOD: Consistent response format
interface ApiResponse<T> {
	data?: T;
	error?: string;
	meta?: { page: number; total: number };
}

// ✅ GOOD: Pagination helper
export const paginate = <T>(items: Array<T>, page: number, limit: number) => ({
	data: items.slice((page - 1) * limit, page * limit),
	meta: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) },
});
```

---

## Core Package Best Practices (packages/core)

### Pure TypeScript Utilities

```typescript
// ✅ GOOD: Framework-agnostic helper
export const formatCurrency = (amount: number, currency = 'USD'): string =>
	new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

// ✅ GOOD: Type-safe utility
export const pick = <T extends object, K extends keyof T>(obj: T, keys: Array<K>): Pick<T, K> =>
	keys.reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {} as Pick<T, K>);

// ✅ GOOD: Validation function
export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
```

### Shared Constants

```typescript
// ✅ GOOD: Type-safe constants
export const USER_ROLES = {
	ADMIN: 'admin',
	USER: 'user',
	GUEST: 'guest',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ✅ GOOD: Configuration
export const APP_CONFIG = {
	MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
	ALLOWED_FILE_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
	RATE_LIMIT: { WINDOW_MS: 15 * 60 * 1000, MAX_REQUESTS: 100 },
} as const;
```

### Shared Types & Interfaces

```typescript
// ✅ GOOD: Domain types
export interface User {
	readonly id: string;
	email: string;
	name: string;
	role: UserRole;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateUserInput {
	email: string;
	name: string;
	role?: UserRole;
}

// ✅ GOOD: API response types
export interface PaginatedResponse<T> {
	data: Array<T>;
	meta: {
		page: number;
		limit: number;
		total: number;
		pages: number;
	};
}
```

### Server-Only Utilities (packages/core/src/server)

```typescript
// ✅ GOOD: Server-only exports
// packages/core/src/server/jwt.ts
import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string =>
	jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });

export const verifyToken = (token: string): { userId: string } =>
	jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
```

---

## Code Optimization Principles

### Minimal Code, Maximum Value

- Every line must serve a purpose — remove dead code immediately
- Combine related logic into single expressions where readable
- Prefer ternaries over if/else for simple conditionals
- Use destructuring to reduce variable declarations
- Chain array methods instead of multiple iterations

### Tailwind Optimization [web:7][web:10]

- All classnames on one line: `className="flex items-center justify-between px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md"`
- Use Tailwind's responsive prefixes: `md:`, `lg:`, `xl:`
- Leverage utility combinations: `space-x-4`, `divide-y`
- Prefer Tailwind utilities over custom CSS
- Use `@apply` directive sparingly — only for true component patterns

### Component Structure

- Single responsibility per component
- Export arrow functions: `export const Component = () => { }`
- Inline simple props interfaces: `interface Props { ... }`
- Keep JSX flat — extract nested logic to separate components
- Use fragments only when necessary

### One-Liner Code Philosophy

**Maximize conciseness while preserving readability:**

```typescript
// ✅ GOOD: One-liner arrow function
export const double = (n: number): number => n * 2;

// ✅ GOOD: One-liner conditional
const status = age >= 18 ? 'adult' : 'minor';

// ✅ GOOD: One-liner array transformation
const userNames = users.map((u) => u.name);

// ✅ GOOD: One-liner object transformation
const userMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});

// ✅ GOOD: One-liner filter + map chain
const activeUserEmails = users.filter((u) => u.active).map((u) => u.email);

// ✅ GOOD: One-liner early return
if (!user) return null;

// ✅ GOOD: One-liner nullish coalescing
const displayName = user.name ?? user.email ?? 'Anonymous';

// ✅ GOOD: One-liner optional chaining
const street = user?.address?.street;

// ❌ BAD: Verbose when one-liner is clearer
let status;
if (age >= 18) {
	status = 'adult';
} else {
	status = 'minor';
}

// ❌ BAD: Unnecessary function declaration
function double(n: number): number {
	return n * 2;
}
```

### Component Optimization

```typescript
// ✅ GOOD: Concise component with inline props
export const UserCard = ({ user }: { user: User }) => (
  <div className="rounded-lg border p-4 shadow-sm">
    <h3 className="text-lg font-semibold">{user.name}</h3>
    <p className="text-sm text-gray-600">{user.email}</p>
  </div>
);

// ✅ GOOD: Component with conditional rendering
export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`rounded px-2 py-1 text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
    {status}
  </span>
);

// ✅ GOOD: Component with array rendering
export const UserList = ({ users }: { users: Array<User> }) => (
  <div className="space-y-2">
    {users.map((user) => (
      <UserCard key={user.id} user={user} />
    ))}
  </div>
);

// ❌ BAD: Verbose component
export const UserCard = (props: { user: User }) => {
  const user = props.user;
  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
};
```

### Hook Optimization

```typescript
// ✅ GOOD: Concise custom hook
export const useUser = (id: string) => {
	const [user, setUser] = useState<User | null>(null);
	useEffect(() => {
		fetchUser(id).then(setUser);
	}, [id]);
	return user;
};

// ✅ GOOD: One-liner derived state
const [count, setCount] = useState(0);
const doubled = count * 2;

// ✅ GOOD: Memoized computation
const expensiveValue = useMemo(() => computeExpensive(data), [data]);

// ✅ GOOD: Callback optimization
const handleClick = useCallback(() => setCount((c) => c + 1), []);

// ❌ BAD: Unnecessary state for derived values
const [doubled, setDoubled] = useState(0);
useEffect(() => setDoubled(count * 2), [count]); // Use derived value instead
```

### API Call Optimization

```typescript
// ✅ GOOD: One-liner fetch with error handling
export const fetchUser = async (id: string): Promise<User> =>
	fetch(`/api/users/${id}`).then((r) => (r.ok ? r.json() : Promise.reject(r)));

// ✅ GOOD: Parallel API calls
export const fetchDashboard = async (): Promise<Dashboard> => {
	const [users, posts, stats] = await Promise.all([fetchUsers(), fetchPosts(), fetchStats()]);
	return { users, posts, stats };
};

// ✅ GOOD: Retry logic in one expression
export const fetchWithRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> =>
	fn().catch((err) => (retries > 0 ? fetchWithRetry(fn, retries - 1) : Promise.reject(err)));

// ❌ BAD: Verbose fetch
export const fetchUser = async (id: string): Promise<User> => {
	const response = await fetch(`/api/users/${id}`);
	if (!response.ok) {
		throw new Error('Failed to fetch');
	}
	const data = await response.json();
	return data;
};
```

### State Management Patterns

```typescript
// ✅ GOOD: Zustand store (one-liner actions)
export const useStore = create<Store>((set) => ({
	count: 0,
	increment: () => set((s) => ({ count: s.count + 1 })),
	decrement: () => set((s) => ({ count: s.count - 1 })),
	reset: () => set({ count: 0 }),
}));

// ✅ GOOD: React Context with reducer
export const TodoContext = createContext<TodoState | null>(null);

const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
	switch (action.type) {
		case 'ADD':
			return { ...state, todos: [...state.todos, action.todo] };
		case 'REMOVE':
			return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };
		default:
			return state;
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

// ✅ GOOD: useCallback for child component callbacks
const MemoizedChild = memo(ChildComponent);
const Parent = () => {
  const handleClick = useCallback(() => console.log('clicked'), []);
  return <MemoizedChild onClick={handleClick} />;
};
```

### Database Query Optimization

```typescript
// ✅ GOOD: Select only needed fields
const users = await db.user.findMany({
	select: { id: true, name: true, email: true },
});

// ✅ GOOD: Use indexes
await db.user.findUnique({ where: { email } }); // email has unique index

// ✅ GOOD: Batch operations
await db.user.createMany({ data: users, skipDuplicates: true });

// ❌ BAD: Select all fields when not needed
const users = await db.user.findMany(); // Returns everything
```

### Caching Strategies

```typescript
// ✅ GOOD: React Query for API caching
export const useUsers = () =>
	useQuery({
		queryKey: ['users'],
		queryFn: fetchUsers,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

// ✅ GOOD: Next.js fetch caching
const users = await fetch('/api/users', {
	next: { revalidate: 60 }, // Revalidate every 60 seconds
}).then((r) => r.json());

// ✅ GOOD: Memoization for expensive functions
const memoized = new Map<string, Result>();
export const expensiveFn = (key: string): Result =>
	memoized.get(key) ?? memoized.set(key, computeExpensive(key)).get(key)!;
```

---

## Environment Variables

### Local Development

- Use `.env.local` per app (gitignored)
- Commit `.env.example` with placeholder values
- Frontend vars: `NEXT_PUBLIC_` prefix required
- Backend vars: no prefix, injected via environment

### Production

- CI: GitHub Secrets
- Frontend: Vercel Project Environment Variables
- Backend: AWS Secrets Manager
- Never hardcode secrets

---

## Error Handling Philosophy

### Root Cause Analysis

- Never apply surface-level fixes
- Trace error origin across package boundaries
- Check type definitions in `@sakalsense/core` first
- Verify workspace dependencies are linked correctly
- Review ESLint/TypeScript errors before runtime testing

### Professional Debugging Process

1. Read full error stack trace
2. Identify originating package and file
3. Check recent changes in dependencies
4. Validate type exports and imports
5. Run `pnpm -r type-check` before committing fix
6. Test fix in isolation before integration

---

## CI/CD Workflow

### Local Development

- Workspace linking handles hot reload
- Changes in `packages/core` reflect immediately in apps
- No manual rebuilding required

### Pre-commit Checks

- `pnpm -r lint` — all packages must pass
- `pnpm --filter @sakalsense/core type-check`
- `pnpm --filter @sakalsense/frontend type-check`
- `pnpm --filter @sakalsense/backend type-check`

### Deployment

- Frontend: Vercel (root: `apps/frontend`)
- Backend: Docker → AWS ECR → ECS (GitHub Actions)
- Core: Published to npm only for external consumption (not required for workspace dev)

---

## Adding New Packages

### Checklist

1. Create directory: `packages/<name>`
2. Add `package.json`: name `@sakalsense/<name>`
3. Extend `tsconfig.base.json` in local `tsconfig.json`
4. Configure ESLint flat config
5. Add scripts: `type-check`, `build`, `lint`
6. Update consumers: `workspace:*` in `apps/` dependencies
7. Run `pnpm install` to link workspaces

---

## PR Review Checklist

### Required Before Merge

- All ESLint rules pass: `pnpm -r lint`
- All TypeScript checks pass: `pnpm -r type-check`
- No server imports in frontend code
- New env vars documented in `.env.example`
- Changelog updated with changes
- README updated if API changed
- Code follows minimal-line philosophy
- Tailwind classes on single lines
- Arrow functions only — no `function` declarations

---

## Code Generation Guidelines for AI

### When Writing Code

- Think optimization first — every line counts
- Use functional patterns over imperative loops
- Extract reusable logic to `@sakalsense/core`
- Keep components under 100 lines
- Use TypeScript inference where safe, explicit types for public APIs
- Follow existing folder structure strictly
- Never invent new directories without justification
- Don't add dependencies without explicit request

### Scaling Assumptions

- Codebase will grow to multiple teams
- Services will be distributed across AWS
- Frontend will handle millions of users
- Core package will be open-sourced
- Prioritize clarity over cleverness
- Assume reviewers are senior engineers
