# Prisma Accelerate Optimization Guide

This document describes the Prisma Accelerate configuration and caching strategies used in the SakalSense content platform.

---

## Configuration

### Environment Variables

```bash
# Runtime connection (Prisma Accelerate)
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_KEY"

# Direct connection (migrations only)
DIRECT_URL="postgresql://user:password@host/db?sslmode=require"
```

### Prisma Client Setup

```typescript
// src/server/db/prisma.ts
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient({
    accelerateUrl: DATABASE_URL,
}).$extends(withAccelerate());
```

---

## Caching Strategy

### TTL Guidelines

| Query Type                     | TTL      | Rationale                      |
| ------------------------------ | -------- | ------------------------------ |
| Taxonomy (domains, categories) | 60s      | Rarely changes                 |
| Dashboard stats                | 30s      | Balance freshness/performance  |
| Content lists                  | No cache | User-specific, needs freshness |
| Content mutations              | No cache | Must be real-time              |

### Implementation Examples

**Cached (read-heavy, rarely changes):**

```typescript
prisma.domain.findMany({
    where: { isActive: true },
    cacheStrategy: { ttl: 60 },
});
```

**Not cached (user-specific or mutations):**

```typescript
prisma.content.create({ data: { ... } });
prisma.content.findMany({ where: { creatorId: user.id } });
```

---

## Cached Queries

### taxonomyActions.ts

- `getDomains()` — 60s TTL
- `getCategoriesByDomain()` — 60s TTL
- `getAllCategories()` — 60s TTL
- `getPopularTopics()` — 60s TTL

### dashboardActions.ts

- `getDashboardStats()` — 30s TTL (all count/aggregate queries)

---

## Best Practices

1. **Never cache user-specific data** — Always fresh for creatorId-filtered queries
2. **Never cache after mutations** — Create/update/delete should not use cacheStrategy
3. **Use short TTL for analytics** — 30s for stats that users expect to update
4. **Use longer TTL for system data** — 60s+ for domains, categories, settings
5. **Monitor in Prisma Console** — Check cache hit rates in Accelerate Insights

---

## Commands

```bash
# Generate client with Accelerate
bun run db:generate

# Push schema changes
bun run db:push

# Run migrations (production)
bun run db:migrate
```
