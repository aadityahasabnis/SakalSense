# Redis Session Storage - Explained

## What is Redis?

Redis is an **in-memory key-value store** - think of it as a super-fast dictionary/hashmap that lives in RAM. Perfect for:

- Sessions (expires automatically)
- Caching
- Real-time data

---

## Key Concept: Everything is a Key-Value Pair

```
KEY                                          VALUE
─────────────────────────────────────────    ─────────────────────────
"session:USER:abc123:uuid-1"        →        '{"sessionId":"uuid-1",...}'
"session:USER:abc123:uuid-2"        →        '{"sessionId":"uuid-2",...}'
"session:ADMIN:xyz789:uuid-3"       →        '{"sessionId":"uuid-3",...}'
```

---

## The Key Pattern

```typescript
session:{ROLE}:{USER_ID}:{SESSION_ID}
```

### `sessionKey` - Exact Key

```typescript
const sessionKey = (role, userId, sessionId) => `session:${role}:${userId}:${sessionId}`;
```

**Example:**

```
sessionKey("USER", "user123", "abc-def-ghi")
→ "session:USER:user123:abc-def-ghi"
```

Used for: **Single session operations** (create, read, delete, validate)

---

### `sessionPattern` - Wildcard Pattern

```typescript
const sessionPattern = (role, userId) => `session:${role}:${userId}:*`;
```

**Example:**

```
sessionPattern("USER", "user123")
→ "session:USER:user123:*"
```

The `*` is a **wildcard** that matches ANY session ID.

Used for: **Finding ALL sessions for a user** (list sessions, logout everywhere)

---

## How Data is Stored

```typescript
await redis.setEx(key, TTL, JSON.stringify(session));
//                 │    │    │
//                 │    │    └── Value: JSON string of session object
//                 │    └────── TTL: Seconds until auto-delete (15 days)
//                 └─────────── Key: "session:USER:abc123:uuid-1"
```

### What Gets Stored

```json
{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user123",
    "role": "USER",
    "device": "desktop",
    "ip": "192.168.1.1",
    "location": null,
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2025-12-26T10:00:00.000Z",
    "lastActiveAt": "2025-12-26T15:30:00.000Z"
}
```

---

## Redis Commands Used

| Command  | Purpose             | Example                           |
| -------- | ------------------- | --------------------------------- |
| `setEx`  | Create with TTL     | `setEx(key, 1296000, value)`      |
| `get`    | Read single key     | `get("session:USER:abc:xyz")`     |
| `exists` | Check if key exists | `exists(key) → 1 or 0`            |
| `expire` | Refresh TTL         | `expire(key, 1296000)`            |
| `keys`   | Find by pattern     | `keys("session:USER:abc:*")`      |
| `del`    | Delete key(s)       | `del(key)` or `del([key1, key2])` |

---

## Operations Flow

### 1. Login → Create Session

```
User logs in
    │
    ▼
Check existing sessions (using pattern)
    │
    ├── If limit exceeded → Return conflict
    │
    └── If OK → Create new key with setEx
```

### 2. API Request → Validate Session

```
Request with JWT containing sessionId
    │
    ▼
redis.exists(sessionKey) → 1 or 0?
    │
    ├── 0 → Session expired/invalid
    │
    └── 1 → Valid, refresh TTL with expire()
```

### 3. Logout → Delete Session

```
redis.del(sessionKey)
    │
    ▼
Key removed instantly
```

### 4. Logout Everywhere → Delete All

```
redis.keys(sessionPattern)  →  ["session:...:a", "session:...:b"]
    │
    ▼
redis.del(all_keys)
```

---

## TTL (Time-To-Live)

```typescript
SESSION_TTL = 15 * 24 * 60 * 60; // 15 days in seconds = 1,296,000
```

- Key **auto-deletes** after TTL expires
- Every authenticated request **refreshes** TTL with `expire()`
- No manual cleanup needed!

---

## Why This Pattern?

```
session:USER:user123:session-uuid
   │      │     │        │
   │      │     │        └── Unique per session (for multi-device)
   │      │     └────────── Groups all sessions for one user
   │      └──────────────── Separates USER/ADMIN/ADMINISTRATOR
   └─────────────────────── Namespace (avoids collision with other data)
```

**Benefits:**

- Fast lookup for single session: O(1)
- Find all user sessions: Pattern matching
- Role isolation: Users can't access admin sessions
- Auto-cleanup: TTL handles expiry
