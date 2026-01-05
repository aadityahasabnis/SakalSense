# Rate Limiting

Redis-based sliding window rate limiting implementation for API protection.

## Overview

SakalSense uses a **sliding window algorithm** with **Redis Sorted Sets** for precise, distributed rate limiting. This approach provides:

- **Precision**: No request spikes at window boundaries
- **Atomicity**: Race-condition free using Redis pipelines
- **Scalability**: Works across multiple server instances
- **Efficiency**: O(log N) operations with automatic cleanup

---

## How It Works

### Sliding Window Algorithm

Unlike fixed windows (which reset at intervals), sliding windows track requests continuously:

```
Fixed Window (problem):                  Sliding Window (solution):
├────────┼────────┤                      ├─────────────────────────┤
│ 99 req │ 99 req │ = 198 in 1 second!   │ Counts requests in last │
│ at end │ start  │                      │ 60 seconds continuously │
└────────┴────────┘                      └─────────────────────────┘
```

### Redis Data Structure

Uses **Sorted Sets** where:

- **Key**: `ratelimit:identifier` (e.g., `ratelimit:192.168.1.1`)
- **Score**: Request timestamp (milliseconds)
- **Value**: Unique request ID

```
Key: ratelimit:192.168.1.1
┌──────────────────────────────────────────────────────────┐
│ Score (timestamp)    │ Value (request ID)              │
├──────────────────────┼─────────────────────────────────┤
│ 1704067200000        │ 1704067200000_abc1              │
│ 1704067201500        │ 1704067201500_def2              │
│ 1704067203000        │ 1704067203000_ghi3              │
└──────────────────────┴─────────────────────────────────┘
```

### Request Flow

```
Request arrives
      │
      ▼
┌─────────────────────────────────────────┐
│ 1. ZREMRANGEBYSCORE: Remove expired     │
│    (requests older than windowMs)       │
├─────────────────────────────────────────┤
│ 2. ZCARD: Count remaining requests      │
├─────────────────────────────────────────┤
│ 3. ZADD: Add current request            │
├─────────────────────────────────────────┤
│ 4. EXPIRE: Set TTL on key               │
└─────────────────────────────────────────┘
      │
      ▼
  count >= limit?
    │         │
   Yes       No
    │         │
    ▼         ▼
 Rollback   Allow
 + 429      + Next()
```

---

## Configuration

### Rate Limit Tiers

| Tier         | Window    | Max Requests | Use Case                                |
| ------------ | --------- | ------------ | --------------------------------------- |
| **Standard** | 1 minute  | 100          | General API endpoints                   |
| **Strict**   | 1 minute  | 10           | Sensitive operations                    |
| **Auth**     | 5 minutes | 5            | Login/register (brute-force protection) |

### Constants

```typescript
// apps/backend/src/constants/rateLimit.constants.ts

export const RATE_LIMIT_STANDARD = { windowMs: 60_000, maxRequests: 100 };
export const RATE_LIMIT_STRICT = { windowMs: 60_000, maxRequests: 10 };
export const RATE_LIMIT_AUTH = { windowMs: 300_000, maxRequests: 5 };
```

---

## Usage

### Pre-configured Middlewares

```typescript
import { rateLimitStandard, rateLimitStrict, rateLimitAuth } from '@/middlewares';

// General API
router.get('/users', rateLimitStandard, getUsers);

// Sensitive endpoint
router.post('/transfer', rateLimitStrict, transferFunds);

// Authentication
router.post('/login', rateLimitAuth, login);
```

### Custom Configuration

```typescript
import { rateLimit } from '@/middlewares/rateLimit.middleware.js';

// Custom: 20 requests per 10 minutes
const customLimit = rateLimit({ windowMs: 600_000, maxRequests: 20 });

router.post('/export', customLimit, exportData);
```

### Custom Key Extraction

By default, rate limiting is per IP. You can customize:

```typescript
// Rate limit per user ID
const perUserLimit = rateLimit(RATE_LIMIT_STANDARD, (req) => req.user?.id ?? getClientIP(req));

// Rate limit per API key
const perApiKeyLimit = rateLimit(RATE_LIMIT_STRICT, (req) => (req.headers['x-api-key'] as string) ?? 'anonymous');
```

---

## Response Headers

All responses include standard rate limit headers:

| Header                  | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `X-RateLimit-Limit`     | Maximum requests allowed                         |
| `X-RateLimit-Remaining` | Requests remaining in window                     |
| `X-RateLimit-Reset`     | Unix timestamp when window resets                |
| `Retry-After`           | Seconds until next request allowed (only on 429) |

### Example Response (Rate Limited)

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067500
Retry-After: 180
Content-Type: application/json

{
    "success": false,
    "error": "Too many requests. Please try again later.",
    "data": {
        "retryAfter": 180,
        "resetAt": "2025-01-01T12:05:00.000Z"
    }
}
```

---

## Redis Keys

### Key Format

```
ratelimit:{sanitized_identifier}
```

Identifiers are sanitized to prevent nested folders:

- Colons (`:`) → underscore (`_`)
- Slashes (`/`) → underscore (`_`)
- Backslashes (`\`) → underscore (`_`)

### Examples

| Input         | Redis Key               |
| ------------- | ----------------------- |
| `192.168.1.1` | `ratelimit:192.168.1.1` |
| `::1`         | `ratelimit:__1`         |
| `user:123`    | `ratelimit:user_123`    |

### TTL

Keys auto-expire after `windowMs` seconds. No manual cleanup needed.

---

## Service API

### `consumeRateLimit(identifier, config)`

Atomically checks and records a request.

```typescript
const result = await consumeRateLimit('192.168.1.1', {
    windowMs: 60_000,
    maxRequests: 100,
});

// result: { allowed: true, remaining: 99, resetAt: 1704067260000 }
```

### `checkRateLimit(identifier, config)`

Read-only check without consuming a request.

```typescript
const result = await checkRateLimit('192.168.1.1', {
    windowMs: 60_000,
    maxRequests: 100,
});
```

### `resetRateLimit(identifier)`

Resets rate limit for an identifier (admin use).

```typescript
await resetRateLimit('192.168.1.1');
```

---

## Performance

| Operation        | Complexity | Network Calls |
| ---------------- | ---------- | ------------- |
| consumeRateLimit | O(log N)   | 1 (pipeline)  |
| checkRateLimit   | O(log N)   | 2             |
| resetRateLimit   | O(1)       | 1             |

The sliding window algorithm using Sorted Sets is highly efficient:

- `ZREMRANGEBYSCORE`: O(log N + M) where M = removed elements
- `ZCARD`: O(1)
- `ZADD`: O(log N)
- `EXPIRE`: O(1)

---

## Best Practices

1. **Use appropriate tiers**: Apply `rateLimitAuth` to all authentication endpoints
2. **Set realistic limits**: Too strict = bad UX, too lenient = no protection
3. **Monitor with headers**: Clients should respect `Retry-After` header
4. **Consider user-based limits** for authenticated endpoints
5. **Log rate limit violations** for security monitoring
