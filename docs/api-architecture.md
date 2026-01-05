# API Architecture

This document explains the API architecture used in SakalSense frontend for making HTTP requests.

## Overview

SakalSense uses a dual-API approach:

- **Server-side API calls** via `lib/api.ts` (Next.js Server Actions)
- **Client-side API calls** via `lib/http.ts` (Browser fetch)

Both share common utilities from `utils/api.utils.ts`.

---

## Server-side API (`lib/api.ts`)

Used in Server Components and Server Actions. Has access to Next.js `headers()` and `cookies()`.

```typescript
'use server';

import { apiCall } from '@/lib/api';

// GET request
const response = await apiCall<UserData>({
    method: 'GET',
    url: '/auth/user/profile',
});

// POST request with body
const response = await apiCall<LoginResponse>({
    method: 'POST',
    url: '/auth/user/login',
    body: { email, password },
});

// POST with FormData
const response = await apiCall<UploadResponse>({
    method: 'POST',
    url: '/upload',
    formData: formData,
});
```

### Features

- Automatic cookie forwarding
- Request timeout handling
- Development logging
- Redirect handling for 403 errors

---

## Client-side API (`lib/http.ts`)

Used in Client Components (`'use client'`). Runs in the browser.

```typescript
import { clientApi, clientApiCall } from '@/lib/http';

// Using convenience methods
const data = await clientApi.get<ProfileData>('/user/profile');
const result = await clientApi.post<LoginResponse>('/auth/login', { email, password });
const updated = await clientApi.put<UpdateResponse>('/user/profile', { name: 'New Name' });
const deleted = await clientApi.delete<void>('/user/account');

// Using base function
const response = await clientApiCall<UserData>({
    method: 'GET',
    url: '/auth/user/profile',
    headers: { 'X-Custom': 'value' },
});
```

### Features

- `credentials: 'include'` for cookie handling
- Request timeout with AbortController
- Development logging
- Type-safe responses

---

## React Query Hooks

### `useAPIQuery` - For GET requests

```typescript
import { useAPIQuery } from '@/hooks';

// Basic usage
const { data, isLoading, error } = useAPIQuery<UserProfile>({
    url: '/user/profile',
});

// With custom fetcher
const { data } = useAPIQuery({
    url: '/custom-endpoint',
    fetcher: () => customFetchFunction(),
});

// With options
const { data } = useAPIQuery<UserData>({
    url: '/user/profile',
    enabled: !!userId, // Conditional fetching
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
});
```

### `useAPIAction` - For POST/PUT/DELETE mutations

```typescript
import { useAPIAction } from '@/hooks';

const { handleAction, pending } = useAPIAction();

// Standard API call
const result = await handleAction<LoginResponse>({
    actionConfig: {
        method: 'POST',
        url: '/auth/login',
        body: { email, password },
    },
    onSuccess: (data) => {
        console.log('Logged in:', data);
        router.push('/dashboard');
    },
    onError: (error) => {
        toast.error(error);
    },
    invalidate: {
        queryKeys: ['user-profile', 'sessions'],
    },
});

// Custom action (Server Action)
const result = await handleAction<UploadResponse>({
    actionConfig: {
        customAction: () => uploadFileAction(formData),
    },
    onSuccess: (data) => toast.success('Uploaded!'),
});
```

---

## Response Interface

All API calls return `IApiResponse<T>`:

```typescript
interface IApiResponse<T> {
    status?: number;
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    metadata?: {
        id?: string;
        count?: number;
        page?: number;
        totalPages?: number;
    };
    sessionLimitExceeded?: boolean;
    activeSessions?: Array<ISession>;
}
```

---

## When to Use Which

| Scenario                      | Use                            |
| ----------------------------- | ------------------------------ |
| Server Component data fetch   | `apiCall` from `lib/api.ts`    |
| Server Action                 | `apiCall` from `lib/api.ts`    |
| Client Component initial load | `useAPIQuery` hook             |
| Client Component mutation     | `useAPIAction` hook            |
| Client-side imperative call   | `clientApi` from `lib/http.ts` |

---

## Configuration

Shared configuration in `utils/api.utils.ts`:

```typescript
export const API_CONFIG = {
    timeout: 30000, // 30 seconds
} as const;
```

Environment-specific API URL in `env.ts`:

```typescript
export const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:8000/api';
```
