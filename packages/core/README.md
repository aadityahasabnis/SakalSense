# sakalsense-core

Shared TypeScript utilities, types, constants, and schemas for SakalSense applications.

## Installation

```bash
npm install sakalsense-core
# or
pnpm add sakalsense-core
```

## Usage

```typescript
import { ROUTE, HTTP_STATUS, validateEmail } from 'sakalsense-core';

// Use shared constants
console.log(ROUTE.API); // '/api'

// Use utility functions
const isValid = validateEmail('test@example.com');

// Use shared types
import type { ApiResponse } from 'sakalsense-core';
```

## What's Included

- **Constants**: Routes, HTTP status codes, regex patterns, etc.
- **Types**: Shared TypeScript interfaces and types
- **Schemas**: Zod validation schemas
- **Utilities**: Common helper functions
- **Interfaces**: API contracts and data structures

## License

ISC © Aaditya Hasabnis
