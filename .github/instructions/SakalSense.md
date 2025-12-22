# SakalSense Project Architecture

> Professional monorepo structure for SakalSense application with Express backend, Next.js frontend, and shared TypeScript core.

---

## Technology Stack

| Layer        | Technology           | Language   |
| ------------ | -------------------- | ---------- |
| **Backend**  | Express.js           | TypeScript |
| **Frontend** | Next.js (App Router) | TSX / TS   |
| **Core**     | Shared Package       | TypeScript |
| **Database** | MongoDB + Redis      | -          |

---

## Monorepo Structure

```
SakalSense/
├── apps/
│   ├── backend/              # Express API server
│   │   └── src/
│   │       ├── config/       # Environment & configuration
│   │       ├── constants/    # Backend-specific constants
│   │       ├── controllers/  # Request handlers
│   │       ├── db/           # Database connections
│   │       ├── interfaces/   # Backend-specific interfaces
│   │       ├── middlewares/  # Express middlewares
│   │       ├── models/       # Mongoose models
│   │       ├── routes/       # API routes
│   │       ├── schemas/      # Zod validation schemas
│   │       ├── services/     # Business logic
│   │       └── utils/        # Backend utilities
│   │
│   └── frontend/             # Next.js application
│       └── src/
│           ├── app/          # App Router pages
│           ├── components/   # React components
│           ├── hooks/        # Custom hooks
│           ├── lib/          # Utilities
│           └── styles/       # CSS/Tailwind
│
└── packages/
    └── core/                 # Shared TypeScript package
        └── src/
            ├── constants/    # Shared constants
            ├── interfaces/   # Shared interfaces
            ├── schemas/      # Shared Zod schemas
            ├── types/        # Shared type definitions
            └── utils/        # Shared utility functions
```

---

## Package Responsibilities

### `@sakalsense/core` (packages/core)

Framework-agnostic shared code used by **both** frontend and backend:

- **Constants**: Application-wide constants (roles, statuses, limits)
- **Interfaces**: Shared data structures (User, Response types)
- **Types**: Type aliases and utility types
- **Schemas**: Zod validation schemas (reusable validation)
- **Utils**: Pure utility functions (formatters, validators)

```typescript
// Frontend import
import { USER_ROLES, formatCurrency } from '@sakalsense/core';

// Backend import (includes server-only utilities)
import { generateToken } from '@sakalsense/core/server';
```

### `@sakalsense/backend` (apps/backend)

Express API server with:

- **Config**: Type-safe environment variable management
- **Controllers**: Request/response handling
- **DB**: MongoDB and Redis connections
- **Middlewares**: Auth, CORS, error handling, logging
- **Models**: Mongoose schemas and models
- **Routes**: API endpoint definitions
- **Services**: Business logic layer
- **Schemas**: Request validation schemas

### `@sakalsense/frontend` (apps/frontend)

Next.js 14+ application with:

- **App Router**: File-based routing
- **Server Components**: Default rendering strategy
- **Client Components**: Interactive UI elements
- **Server Actions**: Form handling and mutations

---

## Architecture Principles

### 1. No Hardcoded Values

All configuration must be imported from dedicated sources:

```typescript
// ✅ GOOD: Import from env.ts
import { ENV } from '@/config/env';
const port = ENV.PORT;

// ✅ GOOD: Import constants
import { MAX_FILE_SIZE } from '@sakalsense/core';

// ❌ BAD: Hardcoded value
const port = 8000;
```

### 2. Type-Safe Environment Variables

All environment variables exported from `config/env.ts`:

```typescript
// config/env.ts
export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT) || 8000,
  MONGODB_URI: process.env.MONGODB_URI!,
  REDIS_HOST: process.env.REDIS_HOST ?? 'localhost',
  JWT_SECRET: process.env.JWT_SECRET!,
} as const;
```

### 3. Constants Always Imported

Constants must be defined in dedicated files and imported:

```typescript
// @sakalsense/core/constants/limits.ts
export const LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_UPLOAD_COUNT: 10,
  PAGINATION_DEFAULT: 20,
} as const;

// Usage in any file
import { LIMITS } from '@sakalsense/core';
if (file.size > LIMITS.MAX_FILE_SIZE) { ... }
```

### 4. Separation of Concerns

```
Request → Route → Controller → Service → Model → Database
              ↓
         Middleware
              ↓
         Response
```

| Layer          | Responsibility                             |
| -------------- | ------------------------------------------ |
| **Route**      | Define endpoints, apply middlewares        |
| **Controller** | Parse request, call service, send response |
| **Service**    | Business logic, validation                 |
| **Model**      | Data persistence, schema definition        |

### 5. Error Handling

Centralized error handling with consistent response format:

```typescript
// All async routes wrapped
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await userService.getAll();
    res.json({ success: true, data: users });
  }),
);

// Global error handler catches all errors
app.use(errorHandler);
```

---

## Database Architecture

### MongoDB (Primary Database)

- Document storage for application data
- Mongoose ODM for schema definition
- Connection management via `db/mongodb.ts`

### Redis (Caching & Sessions)

- Session storage
- API response caching
- Rate limiting data
- Connection management via `db/redis.ts`

---

## Environment Variables

All environment variables documented in `.env.example`:

```env
# Server
PORT=8000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sakalsense

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## Import Conventions

### Frontend (Next.js)

```typescript
// Default core import
import { formatDate, USER_ROLES } from '@sakalsense/core';

// NEVER import server-only code in frontend
// ❌ import { generateToken } from '@sakalsense/core/server';
```

### Backend (Express)

```typescript
// Core import
import { formatDate, USER_ROLES } from '@sakalsense/core';

// Server-only import (allowed in backend only)
import { generateToken, verifyToken } from '@sakalsense/core/server';
```

---

## Code Standards

- **TypeScript Only**: No JavaScript files
- **Arrow Functions**: No `function` declarations
- **Explicit Types**: Return types for all exports
- **No `any`**: Use `unknown` with type guards
- **Const Assertions**: Use `as const` for literal types
- **Single Responsibility**: One purpose per file/function
