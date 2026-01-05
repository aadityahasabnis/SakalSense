# Redis Optimization Guide

Comprehensive guide to Redis patterns, usage, and optimization strategies in SakalSense.

## Current Redis Usage Summary

| Service        | Key Pattern                             | Purpose                         | TTL      |
| -------------- | --------------------------------------- | ------------------------------- | -------- |
| Sessions       | `session:{ROLE}:{USER_ID}:{SESSION_ID}` | Multi-device session management | 15 days  |
| Rate Limiting  | `ratelimit:{ID}`                        | Sliding window rate limiting    | Dynamic  |
| Password Reset | `pwreset:{ROLE}:{TOKEN}`                | Temporary reset tokens          | 1 hour   |
| Email Logs     | `maillog:{STATUS}:{DATE}:{ID}`          | Email audit trail               | 7 days   |
| Debug Logs     | `debuglog:{DATE}:{ID}`                  | API request/response logging    | 24 hours |

---

## Session Management

### Key Structure

```
session:USER:abc123:uuid-1        → Session JSON
session:USER:abc123:uuid-2        → Session JSON
session:ADMIN:xyz789:uuid-3       → Session JSON
```

### Operations

| Operation   | Redis Command               | Complexity |
| ----------- | --------------------------- | ---------- |
| Create      | `SETEX`                     | O(1)       |
| Validate    | `EXISTS`                    | O(1)       |
| Get All     | `KEYS` pattern + `GET` each | O(N)       |
| Invalidate  | `DEL`                       | O(1)       |
| Refresh TTL | `EXPIRE`                    | O(1)       |
| Logout All  | `KEYS` + `DEL`              | O(N)       |

### Optimization Opportunities

1. **Replace `KEYS` with `SCAN`** for large datasets

    ```typescript
    // Current (blocks Redis)
    const keys = await redis.keys(pattern);

    // Better (non-blocking iterator)
    const keys = [];
    for await (const key of redis.scanIterator({ MATCH: pattern })) {
        keys.push(key);
    }
    ```

2. **Use `MGET` for batch retrieval**

    ```typescript
    // Current (N round trips)
    for (const key of keys) {
        const data = await redis.get(key);
    }

    // Better (1 round trip)
    const values = await redis.mGet(keys);
    ```

3. **Store session count separately** to avoid `KEYS` for limit check
    ```typescript
    // Increment on create
    await redis.incr(`session:count:${role}:${userId}`);
    // Decrement on invalidate
    await redis.decr(`session:count:${role}:${userId}`);
    ```

---

## Rate Limiting (Sliding Window)

Uses Redis Sorted Sets for precise sliding window rate limiting.

### How It Works

```
Key: ratelimit:192.168.1.1:/auth/login
Value: Sorted Set { timestamp:random_id → timestamp }
```

### Pipeline Operations (Atomic)

```typescript
multi.zRemRangeByScore(key, 0, now - windowMs); // Cleanup old
multi.zCard(key); // Count current
multi.zAdd(key, { score: now, value: id }); // Add new
multi.expire(key, windowMs / 1000); // Set TTL
```

### Current Implementation ✅ Already Optimized

- Uses pipelining for atomicity
- Single round-trip for check + record
- Sorted sets for O(log N) operations

---

## Password Reset Tokens

### Key Structure

```
pwreset:USER:abc123def...     → { userId, email, createdAt }
pwreset:ADMIN:xyz789ghi...    → { userId, email, createdAt }
```

### Token Prefix System

```typescript
const RESET_TOKEN_PREFIX = {
    USER: 'usr',
    ADMIN: 'adm',
    ADMINISTRATOR: 'sup',
};

// Token format: usr_abc123... or adm_xyz789...
```

**Benefits:**

- Single endpoint for all stakeholders
- Token encodes role information
- No need for separate routes

---

## Email & Debug Logging

### Optimization Issues

1. **Stats retrieval reads ALL logs**

    ```typescript
    // Current: O(N) where N = all logs
    const keys = await redis.keys(pattern);
    for (const key of keys) {
        const data = await redis.get(key);
    }
    ```

2. **Recommendations:**
    - Use Redis counters for stats: `maillog:count:SENT`, `maillog:count:FAILED`
    - Increment/decrement atomically during log creation
    - Use Sorted Sets for time-based queries

### Better Stats Implementation

```typescript
// On log creation
await redis.incr(`maillog:count:${status}`);

// On stats read (O(1) instead of O(N))
const sent = await redis.get('maillog:count:SENT');
const failed = await redis.get('maillog:count:FAILED');
```

---

## Connection Pooling

Current singleton pattern is efficient:

```typescript
let redis: RedisClientType | null = null;

export const getRedis = (): RedisClientType => {
    if (!redis) throw new Error('Redis not initialized');
    return redis;
};
```

### Recommendations

1. **Add connection retry logic:**

    ```typescript
    redis.on('error', async (err) => {
        console.error('[Redis] Error:', err.message);
        // Attempt reconnection
    });
    ```

2. **Add connection pool for high concurrency:**
    ```typescript
    import { createCluster } from 'redis';
    // For production with multiple Redis instances
    ```

---

## Key Naming Conventions

| Prefix       | Service        | Example                            |
| ------------ | -------------- | ---------------------------------- |
| `session:`   | Authentication | `session:USER:abc:uuid`            |
| `ratelimit:` | Rate limiting  | `ratelimit:192.168.1.1:/api/login` |
| `pwreset:`   | Password reset | `pwreset:USER:token123`            |
| `maillog:`   | Email logging  | `maillog:SENT:1Jan2026:id`         |
| `debuglog:`  | API logging    | `debuglog:1Jan2026:id`             |

---

## TTL Strategy

| Data Type      | TTL             | Rationale                 |
| -------------- | --------------- | ------------------------- |
| Sessions       | 15 days         | Long-lived authentication |
| Rate limits    | Window duration | Self-cleaning             |
| Password reset | 1 hour          | Security                  |
| Email logs     | 7 days          | Audit retention           |
| Debug logs     | 24 hours        | Debugging only            |

---

## Performance Best Practices

### Do's ✅

1. **Use pipelining** for multiple operations
2. **Set appropriate TTLs** for auto-cleanup
3. **Use `EXISTS`** instead of `GET` for validation
4. **Use `EXPIRE`** to refresh TTL without read/write

### Don'ts ❌

1. **Avoid `KEYS`** in production (use `SCAN`)
2. **Don't store large objects** (keep < 1KB)
3. **Don't rely on Redis** for persistent data

---

## Monitoring

### Key Metrics to Track

```bash
# Memory usage
redis-cli INFO memory | grep used_memory

# Connected clients
redis-cli INFO clients | grep connected_clients

# Keys per database
redis-cli INFO keyspace

# Slow log
redis-cli SLOWLOG GET 10
```

### Recommended Alerts

| Metric      | Warning   | Critical  |
| ----------- | --------- | --------- |
| Memory      | > 70%     | > 90%     |
| Connections | > 80% max | > 95% max |
| Latency     | > 5ms     | > 20ms    |
