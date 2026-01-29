# Repository Guidelines

Straude is a Next.js 16 app (React 19) with Supabase + Clerk integration and a small CLI workspace. Use the structure and conventions below to keep changes consistent and easy to review.

## Project Structure & Module Organization
- `app/`: Next.js App Router. Route groups like `app/(auth)` and `app/(main)` hold page shells; `app/api` contains route handlers; `app/globals.css` is the global stylesheet.
- `components/`: Shared UI, grouped by domain (`components/feed`, `components/profile`, `components/ui`, etc.).
- `lib/`: Data access, Supabase helpers, validators, and shared utilities; `types/` for shared TypeScript types.
- `tests/`: Vitest suites (unit, integration, component) with `tests/setup.ts` for test globals.
- `public/`: Static assets; `scripts/` contains asset generators.
- `supabase/migrations/`: Database schema changes; `docs/` for spec notes.
- `packages/cli/`: Workspace for the CLI package.

## Build, Test, and Development Commands
Examples use npm; equivalent pnpm/bun commands are fine.
- `npm run dev`: Start local Next.js dev server.
- `npm run build`: Production build for the web app.
- `npm run start`: Run the production build.
- `npm run lint`: ESLint checks (see `eslint.config.mjs`).
- `npm run test`: Vitest in watch mode.
- `npm run test:run`: Single-run test pass (CI-friendly).
- `npm run test:coverage`: Coverage report (text/json/html).

## Coding Style & Naming Conventions
- TypeScript is strict; prefer typed props and avoid `any` unless unavoidable.
- Indentation is 2 spaces, double quotes are standard, and JSX is formatted to match existing files.
- Component files are `kebab-case.tsx` (e.g., `components/feed/post-card.tsx`) with PascalCase component names.
- Use the `@/` path alias for root imports (configured in `tsconfig.json`).
- Tailwind CSS v4 is used for styling; keep reusable classes in components and global styles in `app/globals.css`.

## Testing Guidelines
- Vitest + Testing Library with a JSDOM environment.
- Test files live under `tests/` and match `**/*.test.tsx` or `**/*.test.ts`.
- Prefer colocating fixtures and helpers within the relevant `tests/` subfolder.

## Commit & Pull Request Guidelines
- Commit history shows short, imperative messages; `feat:` and `fix:` prefixes are common (e.g., `feat: opengraph preview metadata`).
- PRs should include: a clear description, linked issue if applicable, test results, and screenshots or GIFs for UI changes.
- If you touch database behavior, include a migration under `supabase/migrations/` and note it in the PR.

## Configuration & Secrets
- Copy `.env.example` to `.env.local` and set required keys (Clerk, Supabase, BFL, `CLI_JWT_SECRET`).
- Keep secrets out of git and document any new env vars in `.env.example`.
