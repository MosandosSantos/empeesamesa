# Repository Guidelines

## Project Structure & Modules
- Root contains Playwright smoke script `test-login-flow.js` (launches against `http://localhost:3000`) and login screenshots in `screenshots-login-test/`.
- Main Next.js app lives in `app/`; App Router pages sit in `app/src/app`, shared UI in `app/src/components`, utilities in `app/src/lib`, and types in `app/src/types`.
- Data layer uses Prisma (`app/prisma/schema.prisma`, migrations/, `dev.db`, `seed.ts`). Update seeds before relying on the UI for demo data.
- Static assets live in `app/public`; global styles/tokens are defined in `app/src/app/globals.css` (Tailwind v4 + `tw-animate-css`).
- Agent prompt references are in `app/agents/*.md` and the app shell docs are in `app/APPSHELL_README.md` for layout context.

## Build, Test & Development Commands
- Install: `cd app && npm install`.
- Local dev: `npm run dev` (Next.js dev server on port 3000).
- Lint: `npm run lint` (Next + ESLint core-web-vitals config).
- Production build/start: `npm run build` then `npm run start`.
- Database: `npm run db:migrate`, `npm run db:migrate:create`, `npm run db:seed`, `npm run db:reset`, `npm run db:studio`, `npm run db:generate`.
- Login E2E smoke: from repo root, start the dev server, then `npm install playwright && node test-login-flow.js` (saves screenshots to `screenshots-login-test/`).

## Coding Style & Naming Conventions
- TypeScript with strict mode; prefer functional components and hooks. Route segments use lowercase folders; React components/contexts in PascalCase; helpers in camelCase.
- Import app code via the `@/` alias (mapped to `app/src/*`).
- Tailwind utility-first styling in `globals.css` with custom CSS variables; keep new styles co-located with their feature route or component folder.
- Run `npm run lint` before pushing; address Next.js accessibility/performance warnings early.

## Testing Guidelines
- No unit test suite yet; rely on the Playwright login flow to catch regressions on auth and dashboard rendering. Expand with per-route Playwright specs under a `tests/` folder when adding new flows.
- Prefer deterministic data: run `npm run db:reset && npm run db:seed` before browser tests to ensure stable fixtures.
- Name new tests by feature (e.g., `login.spec.ts`, `membros.spec.ts`) and keep screenshots/videos out of git.

## Commit & Pull Request Guidelines
- Repository has no commit history; use concise, imperative subjects (e.g., `Add membros attendance chart`, `Fix login redirect guard`). Mention affected area first when helpful.
- For PRs, include: summary of changes, testing notes/commands run, DB migration/seed impact, and UI screenshots or recordings for visible changes.
- Link issues or tasks when available; call out follow-ups or tech debt explicitly to avoid surprises in review.

## Security & Configuration Tips
- Keep secrets in `app/.env` (not committed). Update `.env.example` if you add required variables.
- Prisma dev database (`app/prisma/dev.db`) is local; do not reuse in production. Regenerate client after schema changes via `npm run db:generate`.
- When editing agent prompt files in `app/agents/`, avoid embedding credentials or URLs that could leak privileged systems.***
