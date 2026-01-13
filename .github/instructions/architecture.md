# SakalSense Project Architecture

> Next.js monorepo with integrated PostgreSQL backend using Prisma Accelerate.

---

## Technology Stack

| Layer              | Technology                  | Purpose                           |
| ------------------ | --------------------------- | --------------------------------- |
| **Frontend**       | Next.js 16 (App Router)     | UI + Server Components            |
| **Backend**        | Server Actions + API Routes | Business Logic                    |
| **Database**       | PostgreSQL + Prisma         | Data Persistence                  |
| **Cache/Sessions** | Redis                       | Session Storage, Rate Limiting    |
| **Performance**    | Prisma Accelerate           | Connection Pooling, Query Caching |

---

## Core Architecture

```
apps/frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (authenticated)/      # Protected routes
│   │   ├── (unAuth)/             # Public routes
│   │   └── api/                  # API Routes (public endpoints)
│   │       └── auth/             # Auth endpoints
│   │
│   ├── server/                   # Server-side code
│   │   ├── actions/              # Server Actions
│   │   │   ├── auth/             # Auth actions
│   │   │   └── admin/            # Admin actions
│   │   └── db/                   # Database layer
│   │       ├── prisma.ts         # Prisma client
│   │       └── redis.ts          # Redis client
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── auth/                 # Auth helpers (JWT, passwords)
│   │   ├── mail/                 # Email service
│   │   ├── rate-limit/           # Rate limiting
│   │   └── interfaces/           # Type definitions
│   │
│   ├── constants/                # Application constants
│   │   ├── auth.constants.ts
│   │   ├── http.constants.ts
│   │   └── paths/
│   │
│   ├── types/                    # TypeScript types
│   └── components/               # React components
│
├── prisma/
│   └── schema.prisma             # Database schema
│
└── scripts/                      # CLI utilities
```

---

## Stakeholder Architecture (3-Level)

| Role              | Description  | Registration  | Session Limit |
| ----------------- | ------------ | ------------- | ------------- |
| **USER**          | End users    | Public signup | 1 concurrent  |
| **ADMIN**         | Managers     | Invite-only   | 2 concurrent  |
| **ADMINISTRATOR** | Super admins | Seeded only   | 2 concurrent  |

### Database Models

```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  fullName    String
  mobile      String?
  avatarLink  String?
  isActive    Boolean  @default(true)
  isVerified  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("users")
}

model Admin {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  fullName    String
  avatarLink  String?
  invitedById String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("admins")
}

model Administrator {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  fullName    String
  avatarLink  String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("administrators")
}
```

---

## API Strategy

### API Routes (Public Endpoints)

Located in `app/api/` for:

- Authentication (login, register, logout)
- Password reset flows
- Webhooks
- Health checks

```
app/api/
├── auth/
│   ├── login/route.ts
│   ├── register/route.ts
│   ├── logout/route.ts
│   ├── forgot-password/route.ts
│   └── reset-password/route.ts
├── health/route.ts
└── mail/
    └── test/route.ts
```

### Server Actions (Authenticated Operations)

Located in `server/actions/` for:

- Data mutations
- Protected operations
- Internal API calls

```
server/actions/
├── auth/
│   ├── session.actions.ts
│   └── password.actions.ts
├── admin/
│   └── users.actions.ts
└── mail/
    └── index.ts
```

---

## Session Management

Sessions stored in Redis with:

- **Pattern**: `session:{role}:{userId}:{sessionId}`
- **TTL**: 15 days
- **Limit**: Role-based concurrent session limits

### Session Flow

```
Login → Create Session (Redis) → Generate JWT → Set Cookie
  ↓
Request → Verify JWT → Validate Session (Redis) → Process
  ↓
Logout → Invalidate Session (Redis) → Clear Cookie
```

---

## Rate Limiting

Sliding window algorithm with Redis Sorted Sets:

| Tier     | Window | Max Requests | Use Case             |
| -------- | ------ | ------------ | -------------------- |
| Standard | 1 min  | 100          | General API          |
| Strict   | 1 min  | 10           | Sensitive operations |
| Auth     | 5 min  | 5            | Login attempts       |

---

## Environment Variables

```env
# Database
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
DIRECT_URL="postgresql://user:pass@host:5432/sakalsense"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key

# Email
GMAIL_ACCOUNT=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
```

---

## Development Workflow

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Build for production
pnpm build
```

---

## Key Patterns

### No Hardcoded Values

```typescript
// ✅ GOOD
import { SESSION_CONFIG } from '@/constants/auth.constants';
const ttl = SESSION_CONFIG.TTL;

// ❌ BAD
const ttl = 1296000;
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

### Consistent Response Format

```typescript
interface IApiResponse<TData = unknown> {
    success: boolean;
    data?: TData;
    error?: string;
    message?: string;
}
```

---

## Code Standards

- **TypeScript Only** — No JavaScript files
- **Arrow Functions** — No `function` declarations
- **Explicit Types** — Return types for all exports
- **No `any`** — Use `unknown` with type guards
- **Const Assertions** — Use `as const` for literal types
- **Single Responsibility** — One purpose per file/function
- **Max 300 Lines** — Split larger files
