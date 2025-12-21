---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

You are working inside a professional TypeScript monorepo named “SakalSense”.

Repository structure:
- apps/frontend → Next.js (App Router, TypeScript only)
- apps/backend → Express.js (TypeScript only)
- packages/core → shared workspace package (TypeScript only)
- packages/eslint-config → shared ESLint flat configs
- packages/typescript-config → shared TypeScript base configs
- pnpm is the package manager (workspace-based, NOT npm/yarn)

Strict architectural rules:
1. This is a pnpm workspace monorepo. All internal packages must be consumed using
   "workspace:*" dependencies, never via npm registry during development.
2. @sakalsense/core is a shared package and MUST be:
   - framework-agnostic
   - browser-safe by default
   - free of side effects
   - pure TypeScript (types, interfaces, constants, utils)
3. Any Node-only or server-specific logic must live under:
   packages/core/src/server
   and must be exported via a dedicated subpath (e.g. @sakalsense/core/server).
4. Frontend (Next.js) is NOT allowed to import any server-only exports.
5. Backend (Express) MAY import server-only exports from @sakalsense/core/server.

TypeScript rules:
- All packages extend from the shared tsconfig base.
- No JavaScript files allowed; TypeScript only.
- Use explicit types for public APIs.
- Avoid circular dependencies across packages.
- Do not weaken strictness settings.

ESLint rules:
- ESLint uses the modern flat config format.
- Root ESLint config must not apply rules globally.
- Each app/package owns its ESLint configuration.
- Frontend uses Next.js + TypeScript ESLint rules.
- Backend and core use Node + TypeScript rules.
- Never disable ESLint rules without explanation.

Environment variables:
- Never hardcode secrets.
- Use .env.local for local development (gitignored).
- Commit .env.example files with placeholder values.
- Frontend environment variables must be prefixed with NEXT_PUBLIC_.
- Backend secrets are injected via environment variables only.

Development workflow:
- Local development uses pnpm workspace linking.
- Changes in packages/core must be immediately reflected in frontend and backend.
- Do NOT suggest publishing core to npm for local usage.

Scalability & professionalism:
- Prefer small, composable modules.
- Keep exports explicit and minimal.
- Use index.ts files as public boundaries.
- Assume this codebase will scale to multiple teams and services.

Deployment awareness (do not implement unless asked):
- Frontend will be deployed to Vercel from apps/frontend.
- Backend will be deployed to AWS.
- CI/CD will be handled via GitHub Actions.
- Core is shared via workspace locally and may be published later if needed.

When generating code:
- Follow the existing folder structure strictly.
- Do not invent new directories without justification.
- Do not add dependencies unless explicitly requested.
- Favor clarity, maintainability, and long-term scalability.
