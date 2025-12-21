# Copilot & onboarding instructions — SakalSense (developer guide)

## Purpose
This file instructs Copilot (and human contributors) about our architecture, constraints, and professional conventions. Use it as the canonical short guide.

## Monorepo rules
- `apps/frontend` → Next.js (client). Import only `@sakalsense/core` (default export).
- `apps/backend` → Express (server). May import `@sakalsense/core/server`.
- `packages/core` → Only TypeScript: constants, interfaces, types, pure functions.
  - Server-only files must live in `src/server` and be exported via `package.json` `exports["./server"]`.
- All packages use `workspace:*` references. Do not publish to npm for local development.

## TypeScript & ESLint
- TS base in `tsconfig.base.json`. Each package extends it.
- ESLint is configured per package; frontend has Next rules only in `apps/frontend/eslint.config.js`.
- Add a `type-check` script to packages that run `tsc --noEmit`.

## Environment variables
- Local: `apps/<app>/.env.local` (gitignored). Commit `*.env.example`.
- CI: use GitHub Secrets. Vercel: use Vercel Project Environment Variables.
- Backend production secrets should live in AWS Secrets Manager.

## CI/CD
- CI runs lint + type-check + build core.
- Frontend deployment: Vercel project set to Root `apps/frontend`.
- Backend deployment: Docker -> ECR -> ECS update via GH Action.

## Adding a new package
1. Create directory in `packages/` with `package.json` name `@sakalsense/<name>`.
2. Add `workspace:*` consumers in `apps/` if needed.
3. Add `tsconfig.json` extending `tsconfig.base.json`.
4. Add `type-check`, `build`, `lint` scripts.

## Publishing core (only when ready)
- Option A (recommended dev flow): Use workspaces during development.
- Option B (release): Tag release, run `pnpm --filter @sakalsense/core publish --access public`, update dependents if you use registry releases.

## Review checklist before PR
- All new TS code passes `pnpm -r lint` and `pnpm --filter <pkg> type-check`.
- No server-only imports in frontend.
- Add/update `*.env.example` if new env vars were introduced.
- Update README and changelog.

