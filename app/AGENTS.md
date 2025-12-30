# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the Next.js App Router code. Routes live under `src/app/`, shared UI in `src/components/`, utilities in `src/lib/`, and types in `src/types/`.
- `public/` contains static assets (e.g., `public/img/logo.svg`).
- Data layer uses Prisma in `prisma/` (`schema.prisma`, `migrations/`, `seed.ts`, `dev.db`).
- App shell guidance lives in `APPSHELL_README.md`; agent prompts are in `agents/`.
- Playwright login smoke script is at repo root: `test-login-flow.js`, with screenshots in `screenshots-login-test/`.

## Build, Test, and Development Commands
- `cd app && npm install`: install dependencies.
- `npm run dev`: start Next.js dev server at `http://localhost:3000`.
- `npm run lint`: run Next.js + ESLint (core-web-vitals).
- `npm run build` then `npm run start`: production build and run.
- Prisma:
  - `npm run db:migrate`, `npm run db:reset`, `npm run db:seed`, `npm run db:studio`, `npm run db:generate`.
- Playwright smoke (from repo root): start dev server, then `npm install playwright && node test-login-flow.js`.

## Coding Style & Naming Conventions
- TypeScript strict mode; prefer functional components and hooks.
- Routes use lowercase folders; React components/contexts in PascalCase; helpers in camelCase.
- Import app code via `@/` alias (`app/src/*`).
- Tailwind utility-first styling in `src/app/globals.css` (Tailwind v4 + `tw-animate-css`).
- Keep new styles close to the feature route or component folder.

## Testing Guidelines
- No unit test suite yet.
- Primary regression check: Playwright login flow (`test-login-flow.js`).
- Before browser tests, prefer deterministic data: `npm run db:reset && npm run db:seed`.
- When adding new Playwright tests, place them under `tests/` and name by feature (e.g., `login.spec.ts`).

## Commit & Pull Request Guidelines
- No prior commit history. Use concise, imperative subjects (e.g., `Add membros attendance chart`).
- PRs should include summary, testing commands run, DB migration/seed impact, and UI screenshots/recordings when visuals change.

## Security & Configuration Tips
- Secrets belong in `app/.env`; update `.env.example` if new required variables are added.
- Prisma dev database (`prisma/dev.db`) is local only.
- When editing `agents/`, avoid embedding credentials or privileged URLs.
