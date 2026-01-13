# SakalSense — Unified Learning Platform

> **Everything is learnable. Everything is connected.**

---

## What is SakalSense?

SakalSense = **GFG + Medium + Coursera-lite** — A unified learning platform with:

- **Structured content** (Articles, Courses, Series, Tutorials)
- **Verified creators** (Admin verification system)
- **Progress-driven learning** (Streaks, completion tracking)
- **Dynamic linking** (Content interconnected in multiple ways)

---

## Core Architecture

| Layer    | Technology                     | Purpose                             |
| -------- | ------------------------------ | ----------------------------------- |
| Frontend | Next.js 16 (App Router)        | UI, Server Components, SEO          |
| Database | PostgreSQL + Prisma Accelerate | Scalable data, connection pooling   |
| Cache    | Redis                          | Sessions, rate limiting, caching    |
| State    | Jotai + TanStack Query         | Global state, server state          |
| Forms    | Config-driven `Form.tsx`       | Minimal code, consistent validation |
| UI       | shadcn/ui                      | Professional, accessible components |

---

## 3-Tier Stakeholder Model

| Role              | Registration | Session Limit | Capabilities                     |
| ----------------- | ------------ | ------------- | -------------------------------- |
| **USER**          | Public       | 1             | Browse, bookmark, track progress |
| **ADMIN**         | Invite-only  | 2             | Create content, view analytics   |
| **ADMINISTRATOR** | Seeded       | 2             | Verify admins, moderate content  |

---

## Content Types (6 Base + 6 Container)

### Base Content (stored in `Content` model)

| Type       | Description                     |
| ---------- | ------------------------------- |
| ARTICLE    | Technical documentation, guides |
| BLOG       | Personal insights, opinions     |
| TUTORIAL   | Step-by-step practical guides   |
| CHEATSHEET | Concise reference sheets        |
| NOTE       | Quick reference notes           |
| PROJECT    | Hands-on projects with code     |

### Container/Linking Models

| Type          | Description                              |
| ------------- | ---------------------------------------- |
| SERIES        | Ordered collection of same-type content  |
| COURSE        | Multi-section structured learning        |
| LESSON        | Single unit within course section        |
| QUIZ          | Attached or standalone assessment        |
| PRACTICE      | Coding problems (attached or standalone) |
| LEARNING PATH | Curated sequence across types            |

---

## Dynamic Content Linking

```
Content ─┬── belongs to ──► Series ──► can be linked to ──► Course Section
         │
         ├── can have ──► Attached Quiz
         │
         ├── can have ──► Attached Practice
         │
         └── can be linked as ──► Lesson Content
```

**Key Design:**

- Same content reusable in multiple series/courses
- Videos embedded within content (not standalone)
- Sequential navigation (prev/next) in all grouped content
- Two-mode assessments (attached OR standalone)

---

## Project Structure

```
apps/frontend/src/
├── app/                     # Pages & Routes
├── components/              # Shared components
├── constants/               # All constants
│   ├── content.constants.ts # Content types, statuses
│   ├── domain.constants.ts  # 9 domains
│   └── messages.constants.ts # UI text
├── hooks/                   # Custom hooks
├── jotai/                   # Global state atoms
├── lib/                     # Utilities
├── server/                  # Server actions, DB
└── types/                   # TypeScript types
```

---

## Code Principles

1. **Minimal LOC** — Every line serves a purpose
2. **Constants over magic strings** — All text in constants
3. **Hooks for reuse** — Extract repeated logic
4. **Config-driven forms** — Define config, render automatically
5. **Type safety** — No `any`, use `TData` not `<T>`

---

## Related Documentation

- [Content Model](./content-model.md) — Detailed content linking
- [Architecture](./architecture.md) — Technical architecture
- [Code Standards](./code-writing-instructions.md) — Code patterns
- [Optimizations](./optimizations.md) — Performance guidelines
