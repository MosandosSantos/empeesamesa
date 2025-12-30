## Sprint — Pagamentos (Mensalidade • Anuidade • Eventos) — Next.js + Prisma (SaaS multi-tenant)

### Objetivo do sprint

Entregar uma tela **única** de acompanhamento de pagamentos, com **3 modos (abas)**:

1. **Mensalidade** → mostra **ano corrente** (12 meses)
2. **Anuidade** → mostra **próximos 6 anos**
3. **Eventos** → **placeholder “Em desenvolvimento”** (estrutura pronta para evoluir)

**Regras de acesso (SaaS):**

* **Admin da Loja**: vê e gerencia pagamentos **da sua loja**
* **Membro**: vê **apenas os próprios pagamentos**
* **Admin do SaaS** (por enquanto): vê tudo (mas já deixando preparado o futuro bloqueio)

---

# 1) Revisão DBA (modelo, índices, integridade)

## 1.1 Entidades mínimas (Prisma)

A ideia é **não salvar “12x meses x N membros” como colunas**, e sim registrar **status por período** (mês/ano). Isso escala e fica auditável.

### Tabelas

* **Lodge** (tenant)
* **User** (auth) + **MemberProfile** (vínculo com loja e dados maçônicos)
* **PaymentPeriod** (um “período cobravel”: mensalidade de 2025-01, anuidade 2027, etc.)
* **PaymentStatus** (status do membro naquele período: PENDING/PAID + metadados)
* **PaymentAuditLog** (log imutável de alterações)

## 1.2 Prisma (sugestão de schema)

```prisma
enum Role {
  SAAS_ADMIN
  LODGE_ADMIN
  MEMBER
}

enum PeriodType {
  MONTHLY
  ANNUAL
  EVENT
}

enum PayStatus {
  PENDING
  PAID
  CANCELED
}

model Lodge {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())

  members   MemberProfile[]
  periods   PaymentPeriod[]
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(MEMBER)

  member    MemberProfile?
}

model MemberProfile {
  id        String   @id @default(cuid())
  lodgeId   String
  userId    String   @unique
  fullName  String
  active    Boolean  @default(true)
  createdAt DateTime @default(now())

  lodge     Lodge    @relation(fields: [lodgeId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  statuses  PaymentStatus[]

  @@index([lodgeId])
  @@index([fullName])
}

model PaymentPeriod {
  id        String     @id @default(cuid())
  lodgeId   String
  type      PeriodType
  year      Int
  month     Int?       // 1..12 somente se MONTHLY
  eventId   String?    // futuro (EVENT)
  label     String?    // ex: "Mensalidade Jan/2025" ou "Anuidade 2027"
  createdAt DateTime   @default(now())

  lodge     Lodge      @relation(fields: [lodgeId], references: [id])
  statuses  PaymentStatus[]

  @@unique([lodgeId, type, year, month, eventId])
  @@index([lodgeId, type, year])
}

model PaymentStatus {
  id          String     @id @default(cuid())
  lodgeId     String
  memberId    String
  periodId    String
  status      PayStatus  @default(PENDING)

  amount      Decimal?   // opcional (caso queira registrar)
  method      String?    // PIX, Dinheiro, Cartão, Convênio etc (texto por enquanto)
  paidAt      DateTime?
  notes       String?

  updatedById String?
  updatedAt   DateTime   @updatedAt
  createdAt   DateTime   @default(now())

  member      MemberProfile @relation(fields: [memberId], references: [id])
  period      PaymentPeriod @relation(fields: [periodId], references: [id])

  @@unique([lodgeId, memberId, periodId])
  @@index([lodgeId, memberId])
  @@index([lodgeId, periodId])
  @@index([status, paidAt])
}

model PaymentAuditLog {
  id          String   @id @default(cuid())
  lodgeId     String
  memberId    String
  periodId    String

  action      String   // MARK_PAID | MARK_PENDING | EDIT_META | CANCEL
  before      Json?
  after       Json?
  actorUserId String?
  createdAt   DateTime @default(now())

  @@index([lodgeId, memberId])
  @@index([lodgeId, periodId])
}
```

## 1.3 Índices/constraints críticos (DBA checklist)

* `PaymentPeriod @@unique(lodgeId,type,year,month,eventId)` evita duplicar “Jan/2025” na mesma loja.
* `PaymentStatus @@unique(lodgeId,memberId,periodId)` evita dois status para o mesmo membro/período.
* Logs **imutáveis**: nunca atualizar/deletar `PaymentAuditLog`.
* (Opcional futuro) **soft delete** para Member/Period.

---

# 2) Revisão Backend (Next.js + Prisma)

## 2.1 Estratégia: “gerar períodos se não existirem”

Quando o usuário abre:

* Aba **Mensalidade** → garantir (upsert) os 12 períodos do **ano corrente**
* Aba **Anuidade** → garantir (upsert) os **6 anos** (ano atual + próximos 5)
* Aba **Eventos** → só placeholder (mas já preparar endpoint e tabela futura)

Isso evita cron/seed e mantém tudo consistente.

## 2.2 Endpoints (Route Handlers /api)

Sugestão usando App Router:

### (A) GET `/api/payments/table?type=MONTHLY|ANNUAL`

Retorna estrutura pronta para a tabela:

* `members[]` (id, nome, ativo)
* `periods[]` (id, year, month, label)
* `statuses` (map por memberId+periodId → status, paidAt, method)

**Filtro por tenant**:

* Se role = `LODGE_ADMIN` → lodgeId do usuário
* Se role = `MEMBER` → restringe a `memberId = do usuário`
* Se role = `SAAS_ADMIN` → permite lodgeId via query (por enquanto)

### (B) POST `/api/payments/mark`

Body:

```json
{
  "memberId":"...",
  "periodId":"...",
  "status":"PAID",
  "amount":"95.00",
  "method":"PIX",
  "paidAt":"2025-12-19T12:00:00.000Z",
  "notes":"..."
}
```

Ação:

* `upsert PaymentStatus` (transaction)
* escreve `PaymentAuditLog` com before/after

### (C) POST `/api/payments/ensure-periods`

Chamada interna (server) para garantir períodos do tipo/ano range.

## 2.3 Regras de negócio (backend)

* Mensalidade: `type=MONTHLY`, `year=currentYear`, `month=1..12`
* Anuidade: `type=ANNUAL`, `year=currentYear..currentYear+5`, `month=null`
* Evento: `type=EVENT` (somente quando existir EventId)
* Se marcar como **PAID**, exigir `paidAt` (default now) e opcional `method`.
* Se voltar para **PENDING**, limpar `paidAt/method/amount` (ou manter em “notes”, você decide — recomendo limpar).
* Toda alteração gera `PaymentAuditLog`.

## 2.4 Segurança / multi-tenant

* Middleware/guard em todas rotas:

  * `LODGE_ADMIN`: só dados do `session.lodgeId`
  * `MEMBER`: só `session.userId` → resolve `memberProfile.id` e filtra
  * `SAAS_ADMIN`: permitido, mas já encapsular num `canViewLodge(lodgeId)` para travar no futuro

---

# 3) Revisão Frontend (UI/UX responsivo)

## 3.1 Layout (padrão “tabela de loja/membros/inventário”)

Página: **Financeiro → Pagamentos**

* Header: Título + filtros
* **Tabs** (shadcn/ui): Mensalidade | Anuidade | Eventos
* Busca por nome (Input)
* Toggle: **Somente pendentes** / **Somente pagos**
* Ações rápidas: Exportar CSV (opcional no sprint, mas deixo no backlog)

## 3.2 Comportamento por aba

### Mensalidade

* Colunas: `Membro | Jan | Fev | ... | Dez | % Pago (opcional)`
* Célula do mês:

  * **Pago** → badge/check (verde)
  * **Pendente** → ponto/círculo (cinza/vermelho)
* Clique na célula abre **Modal/Popover**:

  * Marcar como pago / pendente
  * Método (select simples)
  * Data (date picker)
  * Observação

### Anuidade

* Colunas: `Membro | 2025 | 2026 | 2027 | 2028 | 2029 | 2030`
* Mesma interação da mensalidade.

### Eventos

* Aba visível, conteúdo:

  * Card com ícone + texto **“Em desenvolvimento”**
  * (Opcional) lista vazia com “sem eventos cadastrados”

## 3.3 Mobile-first (90% no celular)

Tabela grande em celular quebra fácil. Solução prática:

* Em telas pequenas:

  * Trocar para **“cards por membro”**
  * Cada card mostra chips (Jan–Dez / anos) roláveis horizontalmente
  * Tocar num chip abre o mesmo modal de pagamento

Isso reduz dor no uso real.

---

# 4) Revisão Engenheiro de Software (arquitetura, qualidade, testes)

## 4.1 Camadas sugeridas

* `lib/auth/` → helpers de permissão (`requireRole`, `getSessionLodgeId`, etc.)
* `lib/payments/` → serviços:

  * `ensureMonthlyPeriods(lodgeId, year)`
  * `ensureAnnualPeriods(lodgeId, startYear, count=6)`
  * `getPaymentsTable(...)`
  * `markPayment(...)` (transação + audit)
* `app/(dashboard)/finance/payments/page.tsx` → tela
* `app/api/payments/*` → rotas

## 4.2 Concorrência e consistência

* `markPayment` sempre dentro de `prisma.$transaction`
* `upsert` em `PaymentStatus` usando unique `(lodgeId,memberId,periodId)`
* Audit log sempre grava (mesmo se “não mudou”, pode evitar spam comparando before/after)

## 4.3 Testes obrigatórios (mínimo)

### Unit (services)

* garante criação de 12 períodos mensais no ano atual
* garante criação dos 6 anos de anuidade
* `markPayment` cria/atualiza status e escreve audit log
* member não consegue marcar pagamento de outro member

### Integração (API)

* `GET table` retorna períodos corretos
* `POST mark` funciona e respeita tenant

### E2E (Playwright)

* Admin da loja abre Mensalidade e marca um mês como pago
* Membro loga e vê apenas os próprios pagamentos
* Troca para Anuidade e marca ano como pago

---

# 5) Sprint Backlog (tarefas com ordem de implementação)

## Semana 1 — Fundação (DB + serviços + API)

* [ ] **S1.1 Prisma migrations** (PaymentPeriod, PaymentStatus, AuditLog)
  **Aceite:** migração aplicada, constraints e índices ok.
* [ ] **S1.2 Seed mínimo (dev)**: 1 Lodge, 1 admin, 3 membros
  **Aceite:** ambiente local sobe com dados.
* [ ] **S1.3 Payment Services** (`ensure*`, `getTable`, `markPayment`)
  **Aceite:** testes unit passando.
* [ ] **S1.4 Rotas API** (`/table`, `/mark`, `/ensure-periods`) + guards
  **Aceite:** Postman/ThunderClient valida 200/403 corretamente.
* [ ] **S1.5 Auditoria**: gravar before/after em JSON
  **Aceite:** cada mudança gera 1 log.

## Semana 2 — UI + Responsividade + E2E

* [ ] **S2.1 Tela Pagamentos (Tabs + filtros)**
  **Aceite:** alterna Mensalidade/Anuidade/Eventos.
* [ ] **S2.2 Tabela Mensalidade (desktop)** com 12 meses
  **Aceite:** mostra status por célula, busca por nome.
* [ ] **S2.3 Tabela Anuidade (desktop)** com 6 anos
  **Aceite:** anos corretos e clique marca pago.
* [ ] **S2.4 Modal/Popover “Marcar Pagamento”** (reutilizável)
  **Aceite:** marca pago/pendente, salva method/date/notes.
* [ ] **S2.5 Mobile UI (cards por membro + chips)**
  **Aceite:** uso confortável no celular (rolagem sem quebrar).
* [ ] **S2.6 Eventos placeholder**
  **Aceite:** aba pronta com mensagem e estrutura futura.
* [ ] **S2.7 Testes E2E (Playwright)**
  **Aceite:** 3 cenários principais passando.
* [ ] **S2.8 Hardening**: loading states, empty states, erros friendly
  **Aceite:** sem “quebras” quando não há membros ou períodos.

---

# 6) Entregáveis finais

* Migrações Prisma + schema versionado
* Serviços de pagamentos (com testes)
* APIs seguras multi-tenant
* Página Pagamentos responsiva
* Modal de marcação de pagamento
* Auditoria imutável (PaymentAuditLog)
* Suite mínima: unit + integração + e2e

---

# 7) Backlog pós-sprint (não bloquear entrega)

* Eventos “de verdade” (CRUD de eventos + cobrança por evento)

* Resumo por membro (total pago no ano, pendências)
* Integração PIX/boleto (Mercado Pago etc.) quando você decidir o provedor

Se você quiser, no próximo passo eu já te devolvo **a estrutura de pastas + código base (services + rotas + componentes shadcn)** no padrão do teu projeto, para você só copiar e adaptar.
