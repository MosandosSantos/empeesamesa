# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EsferaORDO** is a Next.js-based SaaS management system for a Masonic Lodge (Rito Escocês Retificado). The project consists of:

- **app/**: Main Next.js 16 application (TypeScript + Tailwind CSS 4 + shadcn/ui)
- **slider_1/**: Legacy HTML/CSS/JS slider prototype (separate from main app)

The system manages membership, attendance, dues, finances, inventory, documents, and communication for Masonic lodges.

## Development Commands

### Main Application (app/)

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# E2E tests with Playwright
npm run test:e2e              # Run tests headless
npm run test:e2e:ui           # Run tests with UI
npm run test:e2e:report       # Show test report
```

### Database Management (Prisma)

```bash
# Generate Prisma Client (run after schema changes)
npm run db:generate

# Create a new migration (development)
npm run db:migrate:create

# Run migrations (development)
npm run db:migrate

# Seed database with default data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (drop + recreate + seed)
npm run db:reset

# Backfill potencias data (custom script)
npm run db:backfill-potencias
```

**Important Database Notes:**
- Database is **PostgreSQL** (Neon serverless) - see `DATABASE_URL` in `.env`
- Previously used SQLite for development (legacy `dev.db` files may exist)
- Database URL is configured via `DATABASE_URL` environment variable
- All models include `tenantId` for multi-tenant support
- Prisma Client is generated to `node_modules/.prisma/client`
- Import Prisma client from `@/lib/prisma` (singleton pattern)

### Package Management

```bash
# Install dependencies
npm install

# Add new package
npm install <package-name>
```

## Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + @tailwindcss/postcss
- **UI Components**: shadcn/ui (integrated)
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Prisma 5.22.0
- **Auth**: JWT with 7-day validity in httpOnly cookies (implemented with jose library)
- **Testing**: Playwright (E2E tests)

### Directory Structure

```
EsferaORDO/
├── app/                  # Main Next.js application
│   ├── src/
│   │   ├── app/         # Next.js App Router pages and API routes
│   │   │   ├── api/     # API route handlers
│   │   │   │   ├── auth/              # Authentication endpoints
│   │   │   │   ├── categorias/        # Financial categories
│   │   │   │   ├── contas/            # Financial transactions
│   │   │   │   ├── lojas/             # Lodges management
│   │   │   │   ├── membros/           # Members CRUD
│   │   │   │   ├── members/           # Alternative members endpoint
│   │   │   │   ├── payments/          # Payment grid/table/mark
│   │   │   │   ├── sessoes/           # Meetings
│   │   │   │   ├── presenca/          # Attendance
│   │   │   │   ├── inventory/         # Inventory management
│   │   │   │   └── admin/             # Admin utilities
│   │   │   ├── login/                 # Login page
│   │   │   ├── logout/                # Logout page
│   │   │   ├── membros/               # Members pages
│   │   │   ├── financeiro/            # Financial management pages
│   │   │   ├── pagamentos/            # Payments module
│   │   │   ├── presenca/              # Attendance pages
│   │   │   ├── inventario/            # Inventory pages
│   │   │   ├── admin/                 # Admin pages (lojas)
│   │   │   ├── biblioteca/            # Library (stub)
│   │   │   ├── comunicacao/           # Communication (stub)
│   │   │   ├── mensalidades/          # Dues (stub)
│   │   │   ├── quiz/                  # Quiz (stub)
│   │   │   ├── layout.tsx             # Root layout with Geist fonts
│   │   │   ├── page.tsx               # Dashboard/Home page
│   │   │   ├── dashboard-client.tsx   # Dashboard client component
│   │   │   └── globals.css            # Global styles + Tailwind
│   │   ├── components/  # React components
│   │   │   ├── ui/                    # shadcn/ui components (button, input, table, etc.)
│   │   │   ├── financeiro/            # Financial components
│   │   │   ├── inventario/            # Inventory components
│   │   │   ├── pagamentos/            # Payment components
│   │   │   ├── app-shell.tsx          # Main app layout wrapper
│   │   │   ├── sidebar.tsx            # Navigation sidebar
│   │   │   └── topbar.tsx             # Top navigation bar
│   │   └── lib/         # Utility functions and shared code
│   │       ├── prisma.ts              # Prisma client singleton
│   │       ├── auth.ts                # Server-side auth utilities (JWT, bcrypt)
│   │       ├── api-auth.ts            # API auth middleware
│   │       ├── utils.ts               # General utilities (cn, etc.)
│   │       ├── categoria-helper.ts    # Category helpers
│   │       ├── payments/              # Payment utilities
│   │       └── validations/           # Zod schemas
│   ├── prisma/          # Prisma ORM files
│   │   ├── schema.prisma              # Database schema
│   │   ├── seed.ts                    # Database seeding script
│   │   └── dev.db                     # Legacy SQLite (not in use)
│   ├── tests/           # Test files
│   │   └── e2e/                       # Playwright E2E tests
│   ├── scripts/         # Utility scripts
│   │   └── backfill-potencias.ts      # Data backfill script
│   ├── public/          # Static assets
│   ├── DOCS/            # Original PRD and sprint docs
│   ├── .env             # Environment variables (DATABASE_URL, JWT_SECRET)
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── playwright.config.ts
│   └── package.json
├── DOCS/                # Organized project documentation
│   ├── README.md        # Documentation index
│   ├── Arquitetura.md   # Technical architecture
│   ├── DesignSystem.md  # UI/UX patterns and components
│   ├── Desenvolvimento.md # Development workflows
│   ├── Requisitos.md    # Functional requirements
│   └── Sprints.md       # Sprint planning and timeline
├── CLAUDE.md            # This file
└── slider_1/            # Legacy prototype (separate)
```

### Key Configuration Details

- **Path Aliases**: `@/*` maps to `./src/*` (configured in tsconfig.json)
- **Fonts**: Using Next.js `next/font` with Geist Sans and Geist Mono
- **ESLint**: Using Next.js core-web-vitals + TypeScript config
- **Target**: ES2017 with strict TypeScript
- **Working Directory**: All commands assume you're in the `app/` directory

## Product Context

This is a comprehensive lodge management system with the following core modules (see `app/DOCS/PRD_Loja_Maconica_RER.md` for full PRD or `DOCS/Requisitos.md` for organized documentation):

### MVP Modules

1. **Dashboard**: KPIs (active members, compliance %, revenue/expenses, balance, next meeting)
2. **Members (CRUD)**: Manage member data, status (active/inactive/admission), roles
3. **Attendance**: Track presence per session with reports
4. **Dues/Mensalidades**: Monthly payment tracking and compliance monitoring
5. **Financial**: Revenue/expenses by category with attachments and audit trail
6. **Reports/Balanços**: Monthly/quarterly/annual financial statements
7. **Library**: Document management (PDFs) with permissions
8. **Minutes/ATAs**: Session minutes management
9. **Inventory**: Material tracking with entries/exits and alerts
10. **Quiz**: Engagement tool with questions and ranking
11. **Communication**: Bulk emails and boleto (bank slip) generation

### Design System (from PRD)

**Visual Theme**: RER ritual colors
- **Green**: Primary actions
- **Gold**: CTAs and highlights
- **Red**: Danger/alerts
- **Base**: Dark elegant theme with high contrast

**UI Reference**: "Esfera NR6" pattern
- Fixed sidebar with icons + labels
- Top bar with search, quick actions, user menu
- KPI cards at top
- Strong CTA buttons ("+ Novo ...")
- Clean tables with icon actions (view/edit/delete/print)
- Mobile-first, touch-optimized

### Database Architecture

Multi-tenant ready with `tenantId` in all models. Core entities:

```
TENANT → USER, MEMBER, LOJA, POTENCIA, RITO, MEETING, ATTENDANCE,
         CATEGORIA, LANCAMENTO, MEMBER_PAYMENT, PAYMENT_PERIOD, PAYMENT_STATUS,
         INVENTORY_ITEM, INVENTORY_MOVEMENT
```

All tables require `createdAt` and `updatedAt` timestamps (note: Prisma uses camelCase).

## Development Guidelines

### Code Standards

- **Code**: English
- **UI/Content**: Portuguese (pt-BR)
- **Mobile-first**: Primary target is mobile devices
- **Performance**: Pages should load in <2s on 4G
- **Security**: JWT in httpOnly cookies, rate limiting on auth, audit logging

### Feature Implementation Pattern

When implementing features, follow this pattern (based on PRD requirements):

1. Database model with multi-tenant support (`tenantId`)
2. API routes (Next.js App Router route handlers)
3. UI components (shadcn/ui based)
4. CRUD operations following "Esfera NR6" pattern:
   - List view with search/filters/pagination
   - Create/Edit forms with validation
   - Actions: view, edit, delete (soft delete), print
   - Export CSV/Excel where applicable

### Key Dependencies

**Core Framework:**
- `next@16.0.10` - React framework
- `react@19.2.1` & `react-dom@19.2.1` - React library

**Database & ORM:**
- `@prisma/client@5.22.0` & `prisma@5.22.0` - ORM and migrations
- `tsx@4.21.0` - TypeScript execution for seed scripts

**Authentication:**
- `jose@6.1.3` - JWT token handling
- `bcryptjs@3.0.3` & `bcrypt@6.0.0` - Password hashing

**UI Components:**
- `@radix-ui/*` - Headless UI primitives (base for shadcn/ui)
- `lucide-react@0.561.0` - Icon library
- `recharts@3.6.0` - Charts for dashboard
- `class-variance-authority@0.7.1` - Component variant handling
- `tailwind-merge@3.4.0` - Tailwind class merging utility

**Forms & Validation:**
- `react-hook-form@7.68.0` - Form state management
- `@hookform/resolvers@5.2.2` - Form validation resolvers
- `zod@4.2.1` - Schema validation

**Styling:**
- `tailwindcss@4` - Utility-first CSS framework
- `@tailwindcss/postcss@4` - PostCSS integration

**Testing:**
- `@playwright/test@1.57.0` - E2E testing framework
- `playwright@1.57.0` - Browser automation

**Other:**
- `pdf-lib@1.17.1` - PDF generation
- `xlsx@0.18.5` - Excel file handling

### Sprint Planning

Current implementation status (see `DOCS/Sprints.md` for complete planning):

Sprint 0 tasks:
- [x] Create Next.js project with TypeScript + Tailwind
- [x] Integrate shadcn/ui base
- [x] Setup Prisma + PostgreSQL + migrations
- [x] Create seed data (default tenant + admin user)
- [x] Build AppShell (sidebar + topbar) + color tokens
- [x] Implement authentication (login/logout with JWT)

Current progress:
- **Completed**: Foundation, authentication, members CRUD, financial module (categories and transactions/lancamentos), payments module, attendance/meetings, inventory management, admin (lojas)
- **Database Models**: Tenant, User, Member, Loja, Potencia, Rito, Categoria, Lancamento, MemberPayment, PaymentPeriod, PaymentStatus, PaymentAuditLog, Meeting, Attendance, InventoryItem, InventoryMovement

## Implemented Features

### Authentication System
- **Location**: `src/app/api/auth/` and `src/lib/auth.ts`
- JWT tokens stored in httpOnly cookies (7-day expiry)
- Password hashing with bcryptjs
- Login/logout endpoints implemented
- Auth middleware for protected API routes (`src/lib/api-auth.ts`)
- User profile endpoint (`/api/auth/me`)
- Helper functions: `verifyAuth()`, `authenticateRequest()`, `getUserFromPayload()`

### Members Module (RF-02)
- **Pages**: `src/app/membros/`
- **API**: `src/app/api/membros/`
- Full member CRUD with detailed personal data, documents, and ritual milestones
- Member list view with search and filters
- New member registration form
- Individual member detail view with payment history
- Database model includes multi-tenant support and relationship to Loja
- Tracks RER classes: MESA, EN, CBCS with progression dates
- Integration with Potencia for ritual milestone tracking

### Financial Module (RF-05)
- **Pages**: `src/app/financeiro/`
- **API**: `src/app/api/categorias/` and `src/app/api/contas/`
- Categories (Categoria) management - income/expense classification
- Transactions (Lancamento) management with status tracking:
  - Status: ABERTO, PAGO, PARCIAL, ATRASADO, PREVISTO
  - Types: RECEITA (income), DESPESA (expense)
  - Payment methods: PIX, TRANSFERENCIA, DINHEIRO, BOLETO
- Dashboard with financial KPIs (total income, expenses, balance)
- File attachments support for receipts/invoices
- Date-based filtering and reporting

### Payments Module
- **Pages**: `src/app/pagamentos/`
- **API**: `src/app/api/payments/`
- Payment grid/table views for tracking member payments
- Mark payments as paid/pending
- Integration with Lancamento model
- MemberPayment model tracks: MENSALIDADE_LOJA, ANUIDADE_PRIORADO, EVENTO
- PaymentPeriod and PaymentStatus for organized payment tracking
- Audit logging via PaymentAuditLog

### Attendance/Meetings Module
- **Pages**: `src/app/presenca/`
- **API**: `src/app/api/sessoes/` and `src/app/api/presenca/`
- Meeting management (sessoes) with types: ORDINARIA, EXTRAORDINARIA, INICIACAO, INSTALACAO, MAGNA, LUTO
- Attendance tracking (presenca) per meeting
- Status: PRESENTE, FALTA, JUSTIFICADA
- Attendance reports and analytics

### Inventory Module (RF-09)
- **Pages**: `src/app/inventario/`
- **API**: `src/app/api/inventory/`
- Item management with SKU, category, location tracking
- Stock levels with min quantity and reorder point alerts
- Movement tracking: IN, OUT, ADJUST, ARCHIVE
- Cost tracking: average cost and last purchase cost
- Item assignment to members
- Export functionality
- Audit trail with user info and IP/user agent logging

### Admin Module
- **Pages**: `src/app/admin/lojas/`
- **API**: `src/app/api/lojas/`
- Lojas (Lodge) management with full CRUD
- Multi-tenant lodge administration
- Integration with Potencia (Masonic Power/Jurisdiction) and Rito (Masonic Rite)
- Contract and subscription tracking
- Password verification for sensitive operations

## Important Notes

### Security Requirements

- JWT stored in httpOnly cookies (not localStorage)
- Rate limiting on login endpoint
- Audit trail for critical operations (financial, member changes, inventory)
- LGPD compliance (minimal data collection)
- Password verification for admin operations (see `/api/admin/verify-password`)

### Multi-Tenant Architecture

Even though initial deployment is single-tenant, the architecture supports multi-tenant from day one:
- All models include `tenantId`
- Queries must filter by tenant context
- No hard-coded tenant assumptions
- API routes use `authenticateRequest()` to extract tenant from JWT

### External Integrations (Future)

- **Email provider**: TBD (simple provider for MVP)
- **Boleto provider**: Single provider initially (e.g., Asaas)
- **File storage**: Local for dev, S3/R2 for production

## Common Tasks

### Adding a New Feature Module

1. Review requirements in `DOCS/Requisitos.md` (or `app/DOCS/PRD_Loja_Maconica_RER.md` for full detail)
2. Check `DOCS/Arquitetura.md` for database modeling patterns
3. Consult `DOCS/DesignSystem.md` for UI/UX patterns
4. Follow workflow in `DOCS/Desenvolvimento.md`
5. Create database models with `tenantId`, `createdAt`, `updatedAt`
6. Generate migrations: `npm run db:migrate:create`
7. Run migrations: `npm run db:migrate`
8. Create API route handlers in `src/app/api/[module]/`
9. Build UI pages in `src/app/[module]/`
10. Follow shadcn/ui component patterns
11. Implement CRUD with standard actions (view/edit/delete/export)
12. Add mobile-responsive design
13. Include appropriate permissions checks

### API Route Patterns

API routes follow REST conventions and are located in `src/app/api/`:

```typescript
// Collection routes: /api/[resource]/route.ts
GET    /api/categorias      → List all (with tenant filtering)
POST   /api/categorias      → Create new

// Individual resource: /api/[resource]/[id]/route.ts
GET    /api/categorias/:id  → Get one
PUT    /api/categorias/:id  → Update
DELETE /api/categorias/:id  → Delete (soft delete preferred)

// Special endpoints: /api/[resource]/[action]/route.ts
GET    /api/contas/dashboard → Get financial dashboard data
POST   /api/payments/mark    → Mark payment as paid
```

**API Implementation Guidelines:**
- Always validate tenant context from JWT token using `authenticateRequest()`
- Use Zod schemas for request validation (see `src/lib/validations/`)
- Import auth utilities from `@/lib/api-auth`
- Return proper HTTP status codes (200, 201, 400, 401, 404, 500)
- Use Prisma client from `@/lib/prisma`
- Handle errors gracefully with try/catch

**Example API Route Structure:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import prisma from '@/lib/prisma';
import { myValidationSchema } from '@/lib/validations/my-resource';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await prisma.myModel.findMany({
    where: { tenantId: auth.tenantId }
  });

  return NextResponse.json(data);
}
```

### Styling with Tailwind 4

- Use `@theme inline` in CSS for custom properties (see `globals.css`)
- Leverage CSS variables for theming (`--background`, `--foreground`)
- Follow mobile-first responsive design
- Use shadcn/ui components for consistency
- RER color palette is defined in `globals.css`:
  - Green: Primary actions
  - Gold: Highlights and CTAs
  - Red: Danger/alerts

## Documentation Structure

This project has comprehensive documentation in the `DOCS/` directory:

- **`DOCS/README.md`**: Documentation index and project overview
- **`DOCS/Arquitetura.md`**: Complete technical architecture, stack, database modeling (ERD), security, and deployment
- **`DOCS/DesignSystem.md`**: UI/UX patterns, RER color palette (green/gold/red), component library, responsiveness, and accessibility
- **`DOCS/Desenvolvimento.md`**: Development workflows, coding standards, git conventions, troubleshooting, and best practices
- **`DOCS/Requisitos.md`**: All 15 functional requirements (RF-01 to RF-15), non-functional requirements, business rules, use cases, and diagrams
- **`DOCS/Sprints.md`**: Complete 11-sprint roadmap with tasks, timeline, DoD (Definition of Done), and risk mitigation

**When to consult:**
- Planning a feature → `Requisitos.md` + `Sprints.md`
- Implementing backend → `Arquitetura.md` + `Desenvolvimento.md`
- Designing UI → `DesignSystem.md` + `Desenvolvimento.md`
- Starting work → `README.md` for quick navigation

## Testing

### E2E Tests (Playwright)

- **Location**: `tests/e2e/`
- **Config**: `playwright.config.ts`
- **Run tests**: `npm run test:e2e`
- **Interactive mode**: `npm run test:e2e:ui`
- **View reports**: `npm run test:e2e:report`
- Tests target: `http://localhost:3000`
- Browser: Chromium (Desktop Chrome)
- Screenshots and videos on failure

## References

- Next.js 16 Docs: https://nextjs.org/docs
- Tailwind CSS 4: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
- Prisma: https://www.prisma.io/docs
- Playwright: https://playwright.dev/
- TypeScript Handbook: https://www.typescriptlang.org/docs/

## Repository Context

The **slider_1/** directory contains a legacy prototype and is separate from the main application. It uses vanilla HTML/CSS/JS and has its own git repository. It should not be modified as part of the main app development.

## Environment Variables

Required environment variables in `.env`:

```bash
# PostgreSQL database connection (Neon serverless)
DATABASE_URL="postgresql://..."

# JWT secret for authentication (change in production!)
JWT_SECRET="your-secret-key-change-in-production"
```
