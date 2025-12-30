# Sprint — Refatoração do Módulo de Pagamentos (Mensalidades e Anuidades)

## Objetivo da Sprint

Refatorar o módulo de pagamentos para alinhar com o PRD corrigido, implementando:
- Tabela de **Charges** (cobranças pré-geradas) para performance
- 4 KPIs úteis e leves (Previsto, Recebido, Em Aberto, Adimplência)
- APIs otimizadas e alinhadas à UI
- Multi-tenant com RBAC claro

---

## Subitem 1: Modelagem com Charges (Cobranças Pré-Geradas)

### 1.1 Objetivo

Criar tabela `BillingCharge` para armazenar **cobranças esperadas** (mensalidades e anuidades), eliminando a necessidade de "procurar ausências" (caro).

### 1.2 Schema Prisma

```prisma
// Cobrança prevista (mensalidade ou anuidade)
model BillingCharge {
  id          String   @id @default(uuid())
  tenantId    String
  lodgeId     String
  memberId    String

  type        BillingChargeType // MONTHLY, ANNUAL
  year        Int
  month       Int?      // null para anuidades, 1-12 para mensalidades

  expectedAmount Decimal @db.Decimal(10, 2)
  status         ChargeStatus @default(PENDING) // PENDING, PAID, CANCELED

  // Vínculo com pagamento realizado
  paymentId   String?   @unique
  payment     MemberPayment? @relation(fields: [paymentId], references: [id])

  // Beneficiário
  beneficiaryType BeneficiaryType // LOJA, POTENCIA
  beneficiaryId   String

  // Auditoria
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relações
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  lodge       Loja     @relation(fields: [lodgeId], references: [id])
  member      Member   @relation(fields: [memberId], references: [id])

  // Índices para performance
  @@unique([lodgeId, memberId, year, month, type]) // Anti-duplicidade
  @@index([tenantId, lodgeId, year, type])
  @@index([memberId, year, type])
}

enum BillingChargeType {
  MONTHLY   // Mensalidade
  ANNUAL    // Anuidade
}

enum ChargeStatus {
  PENDING   // Não pago
  PAID      // Pago (vinculado a payment)
  CANCELED  // Cancelado (ex: membro inativo)
}

enum BeneficiaryType {
  LOJA      // Mensalidade
  POTENCIA  // Anuidade
}
```

### 1.3 Migrations

```bash
npm run db:migrate:create
# Nome: add_billing_charges
npm run db:migrate
```

### 1.4 Script de Backfill (gerar charges para membros ativos)

**Arquivo**: `scripts/backfill-billing-charges.ts`

```typescript
import prisma from '../src/lib/prisma';

async function backfillBillingCharges() {
  const currentYear = new Date().getFullYear();

  // Buscar todas as lojas ativas
  const lodges = await prisma.loja.findMany({
    where: { active: true },
    include: {
      members: {
        where: { status: 'ATIVO' }
      },
      potencia: true
    }
  });

  for (const lodge of lodges) {
    console.log(`\n[Loja: ${lodge.nome}] - ${lodge.members.length} membros ativos`);

    // Valores padrão (ajustar conforme regra de negócio)
    const monthlyAmount = 150.00; // R$ 150/mês
    const annualAmount = 500.00;  // R$ 500/ano

    for (const member of lodge.members) {
      // MENSALIDADES: gerar 12 charges (ano atual)
      for (let month = 1; month <= 12; month++) {
        await prisma.billingCharge.upsert({
          where: {
            lodgeId_memberId_year_month_type: {
              lodgeId: lodge.id,
              memberId: member.id,
              year: currentYear,
              month,
              type: 'MONTHLY'
            }
          },
          create: {
            tenantId: lodge.tenantId,
            lodgeId: lodge.id,
            memberId: member.id,
            type: 'MONTHLY',
            year: currentYear,
            month,
            expectedAmount: monthlyAmount,
            status: 'PENDING',
            beneficiaryType: 'LOJA',
            beneficiaryId: lodge.id
          },
          update: {} // Não sobrescrever se já existe
        });
      }

      // ANUIDADES: gerar 7 charges (ano atual + próximos 6)
      for (let yearOffset = 0; yearOffset <= 6; yearOffset++) {
        const year = currentYear + yearOffset;

        await prisma.billingCharge.upsert({
          where: {
            lodgeId_memberId_year_month_type: {
              lodgeId: lodge.id,
              memberId: member.id,
              year,
              month: null,
              type: 'ANNUAL'
            }
          },
          create: {
            tenantId: lodge.tenantId,
            lodgeId: lodge.id,
            memberId: member.id,
            type: 'ANNUAL',
            year,
            month: null,
            expectedAmount: annualAmount,
            status: 'PENDING',
            beneficiaryType: 'POTENCIA',
            beneficiaryId: lodge.potenciaId || lodge.id // Fallback
          },
          update: {}
        });
      }

      console.log(`  ✓ ${member.nomeCompleto}: 12 mensalidades + 7 anuidades`);
    }
  }

  console.log('\n✅ Backfill concluído!');
}

backfillBillingCharges()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Executar**:
```bash
npm run db:backfill-charges
```

### 1.5 Critério de Aceite

- [ ] Tabela `BillingCharge` criada com índices
- [ ] Script de backfill gera 12 mensalidades + 7 anuidades por membro ativo
- [ ] Chave única `(lodgeId, memberId, year, month, type)` impede duplicação

---

## Subitem 2: APIs Otimizadas (4 Endpoints Essenciais)

### 2.1 Endpoint 1: Summary (KPIs)

**Rota**: `GET /api/billing/summary`

**Query Params**:
- `type`: `MONTHLY` | `ANNUAL`
- `year`: `2025`
- `month` (opcional, só para mensalidades): `1-12`
- `lodgeId` (opcional, Admin SaaS): `uuid` ou `all`

**Response**:
```typescript
{
  previsto: 108000.00,   // 60 membros * R$150 * 12
  recebido: 45000.00,    // SUM(payments confirmados)
  emAberto: 63000.00,    // previsto - recebido
  adimplencia: 41.67     // (recebido / previsto) * 100
}
```

**Implementação**: `src/app/api/billing/summary/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as 'MONTHLY' | 'ANNUAL';
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const lodgeId = searchParams.get('lodgeId');

  // Filtro multi-tenant
  const where: any = {
    tenantId: auth.tenantId,
    type,
    year
  };

  // Admin SaaS: pode filtrar por loja ou ver todas
  if (auth.role === 'ADMIN_SAAS') {
    if (lodgeId && lodgeId !== 'all') {
      where.lodgeId = lodgeId;
    }
  } else {
    // Admin Loja: só sua loja
    where.lodgeId = auth.user.lodgeId;
  }

  // KPI 1: Receita Prevista
  const charges = await prisma.billingCharge.findMany({
    where,
    select: { expectedAmount: true }
  });
  const previsto = charges.reduce((sum, c) => sum + Number(c.expectedAmount), 0);

  // KPI 2: Receita Recebida
  const payments = await prisma.billingCharge.findMany({
    where: { ...where, status: 'PAID' },
    include: { payment: true }
  });
  const recebido = payments.reduce((sum, c) => sum + (c.payment ? Number(c.payment.amount) : 0), 0);

  // KPI 3 e 4: calculados
  const emAberto = previsto - recebido;
  const adimplencia = previsto > 0 ? (recebido / previsto) * 100 : 0;

  return NextResponse.json({
    previsto: previsto.toFixed(2),
    recebido: recebido.toFixed(2),
    emAberto: emAberto.toFixed(2),
    adimplencia: adimplencia.toFixed(2)
  });
}
```

---

### 2.2 Endpoint 2: Matrix (Tabela Paginada)

**Rota**: `GET /api/billing/dues/matrix`

**Query Params**:
- `type`: `MONTHLY` | `ANNUAL`
- `year`: `2025`
- `page`: `1`
- `pageSize`: `20`
- `q` (busca): `nome do membro`
- `lodgeId` (Admin SaaS)

**Response**:
```typescript
{
  data: [
    {
      memberId: "uuid",
      memberName: "João Silva",
      months: {
        1: { status: 'PAID', amount: 150.00, paymentDate: '2025-01-10' },
        2: { status: 'PENDING', amount: null },
        // ... 3-12
      },
      total: 150.00
    }
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 60,
    totalPages: 3
  }
}
```

**Implementação**: `src/app/api/billing/dues/matrix/route.ts`

```typescript
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as 'MONTHLY' | 'ANNUAL';
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const search = searchParams.get('q') || '';
  const lodgeId = searchParams.get('lodgeId');

  const where: any = {
    tenantId: auth.tenantId,
    type,
    year
  };

  if (auth.role === 'ADMIN_SAAS') {
    if (lodgeId && lodgeId !== 'all') {
      where.lodgeId = lodgeId;
    }
  } else {
    where.lodgeId = auth.user.lodgeId;
  }

  if (search) {
    where.member = {
      nomeCompleto: { contains: search, mode: 'insensitive' }
    };
  }

  // Total de membros únicos
  const uniqueMembers = await prisma.billingCharge.findMany({
    where,
    distinct: ['memberId'],
    select: { memberId: true, member: true }
  });

  const total = uniqueMembers.length;
  const paginatedMembers = uniqueMembers.slice((page - 1) * pageSize, page * pageSize);

  // Buscar charges de cada membro
  const data = await Promise.all(
    paginatedMembers.map(async ({ memberId, member }) => {
      const charges = await prisma.billingCharge.findMany({
        where: { ...where, memberId },
        include: { payment: true },
        orderBy: type === 'MONTHLY' ? { month: 'asc' } : { year: 'asc' }
      });

      const periods: any = {};
      let totalPaid = 0;

      charges.forEach(charge => {
        const key = type === 'MONTHLY' ? charge.month! : charge.year;
        periods[key] = {
          status: charge.status,
          amount: charge.payment ? Number(charge.payment.amount) : null,
          paymentDate: charge.payment?.paidAt || null
        };
        if (charge.status === 'PAID') {
          totalPaid += Number(charge.payment?.amount || 0);
        }
      });

      return {
        memberId,
        memberName: member.nomeCompleto,
        periods,
        total: totalPaid
      };
    })
  );

  return NextResponse.json({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}
```

---

### 2.3 Endpoint 3: Register Payment

**Rota**: `POST /api/billing/payments`

**Body**:
```typescript
{
  chargeId: "uuid",
  amount: 150.00,
  paymentMethod: "PIX",
  paidAt: "2025-01-10T10:00:00Z",
  notes: "Pagamento via PIX"
}
```

**Response**:
```typescript
{
  success: true,
  paymentId: "uuid",
  chargeId: "uuid"
}
```

**Implementação**: `src/app/api/billing/payments/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { chargeId, amount, paymentMethod, paidAt, notes } = body;

  // Validação
  if (!chargeId || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Buscar charge
  const charge = await prisma.billingCharge.findUnique({
    where: { id: chargeId },
    include: { member: true, lodge: true }
  });

  if (!charge || charge.tenantId !== auth.tenantId) {
    return NextResponse.json({ error: 'Charge not found' }, { status: 404 });
  }

  if (charge.status === 'PAID') {
    return NextResponse.json({ error: 'Charge already paid' }, { status: 400 });
  }

  // Criar pagamento
  const payment = await prisma.memberPayment.create({
    data: {
      tenantId: auth.tenantId,
      memberId: charge.memberId,
      lodgeId: charge.lodgeId,
      type: charge.type === 'MONTHLY' ? 'MENSALIDADE_LOJA' : 'ANUIDADE_PRIORADO',
      amount,
      paymentMethod,
      status: 'CONFIRMED',
      referenceMonth: charge.month,
      referenceYear: charge.year,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      notes
    }
  });

  // Atualizar charge
  await prisma.billingCharge.update({
    where: { id: chargeId },
    data: {
      status: 'PAID',
      paymentId: payment.id
    }
  });

  // Criar audit log
  await prisma.paymentAuditLog.create({
    data: {
      tenantId: auth.tenantId,
      paymentId: payment.id,
      userId: auth.user.id,
      action: 'CREATED',
      details: `Pagamento registrado: ${charge.type} - ${charge.year}/${charge.month || 'anual'}`
    }
  });

  return NextResponse.json({
    success: true,
    paymentId: payment.id,
    chargeId: charge.id
  });
}
```

---

### 2.4 Endpoint 4: Payment History

**Rota**: `GET /api/billing/payments/history`

**Query Params**:
- `memberId`: `uuid`
- `type`: `MONTHLY` | `ANNUAL` (opcional)
- `from`: `2025-01-01` (opcional)
- `to`: `2025-12-31` (opcional)

**Response**:
```typescript
{
  data: [
    {
      id: "uuid",
      type: "MONTHLY",
      year: 2025,
      month: 1,
      amount: 150.00,
      paymentMethod: "PIX",
      paidAt: "2025-01-10T10:00:00Z",
      status: "CONFIRMED"
    }
  ]
}
```

### 2.5 Critério de Aceite

- [ ] API `/billing/summary` retorna os 4 KPIs corretos
- [ ] API `/billing/dues/matrix` retorna matriz paginada com performance (< 1s para 100 membros)
- [ ] API `/billing/payments` cria pagamento e atualiza charge atomicamente
- [ ] API `/billing/payments/history` retorna histórico paginado
- [ ] Multi-tenant: Admin Loja não vê dados de outra loja

---

## Subitem 3: Refatoração do Frontend (Cards + Tabela)

### 3.1 Cards KPI

**Arquivo**: `src/components/pagamentos/kpi-cards.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface KPICardsProps {
  summary: {
    previsto: string;
    recebido: string;
    emAberto: string;
    adimplencia: string;
  };
}

export function KPICards({ summary }: KPICardsProps) {
  const adimplencia = parseFloat(summary.adimplencia);
  const emAberto = parseFloat(summary.emAberto);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Receita Prevista */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Prevista</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {summary.previsto}</div>
          <p className="text-xs text-muted-foreground">Total esperado no período</p>
        </CardContent>
      </Card>

      {/* Card 2: Receita Recebida */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Recebida</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">R$ {summary.recebido}</div>
          <p className="text-xs text-muted-foreground">Pagamentos confirmados</p>
        </CardContent>
      </Card>

      {/* Card 3: Em Aberto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">R$ {summary.emAberto}</div>
          <p className="text-xs text-muted-foreground">
            {emAberto > 0 ? 'Pendente de recebimento' : 'Nenhuma pendência'}
          </p>
        </CardContent>
      </Card>

      {/* Card 4: Adimplência */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Adimplência</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            adimplencia >= 80 ? 'text-green-600' :
            adimplencia >= 50 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {summary.adimplencia}%
          </div>
          <p className="text-xs text-muted-foreground">
            {adimplencia >= 80 ? 'Excelente' :
             adimplencia >= 50 ? 'Atenção necessária' :
             'Crítico'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3.2 Integração na Página

**Arquivo**: `src/app/pagamentos/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { KPICards } from '@/components/pagamentos/kpi-cards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PagamentosPage() {
  const [type, setType] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState({
    previsto: '0.00',
    recebido: '0.00',
    emAberto: '0.00',
    adimplencia: '0.00'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      const res = await fetch(`/api/billing/summary?type=${type}&year=${year}`);
      const data = await res.json();
      setSummary(data);
      setLoading(false);
    }
    fetchSummary();
  }, [type, year]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Pagamentos</h1>
        <p className="text-muted-foreground">Controle de mensalidades, anuidades e eventos</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="border rounded px-3 py-2"
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Abas */}
      <Tabs value={type} onValueChange={(v) => setType(v as 'MONTHLY' | 'ANNUAL')}>
        <TabsList>
          <TabsTrigger value="MONTHLY">Mensalidades</TabsTrigger>
          <TabsTrigger value="ANNUAL">Anuidades</TabsTrigger>
          <TabsTrigger value="EVENTOS" disabled>Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="MONTHLY" className="space-y-4">
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <>
              <KPICards summary={summary} />
              {/* Tabela matriz aqui */}
            </>
          )}
        </TabsContent>

        <TabsContent value="ANNUAL" className="space-y-4">
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <>
              <KPICards summary={summary} />
              {/* Tabela anuidades aqui */}
            </>
          )}
        </TabsContent>

        <TabsContent value="EVENTOS">
          <div className="text-center py-12 text-muted-foreground">
            🚧 Em desenvolvimento
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 3.3 Critério de Aceite

- [ ] 4 cards exibem KPIs corretos (Previsto, Recebido, Em Aberto, Adimplência)
- [ ] Cards atualizam ao trocar aba (Mensalidade/Anuidade) ou ano
- [ ] Adimplência tem código de cores (verde >= 80%, amarelo >= 50%, vermelho < 50%)
- [ ] UI responsiva (mobile-first)

---

## Subitem 4: Testes e Documentação

### 4.1 Testes E2E (Playwright)

**Arquivo**: `tests/e2e/billing-module.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Billing Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login como Admin Loja
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@loja.com');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display 4 KPI cards', async ({ page }) => {
    await page.goto('/pagamentos');

    // Verificar cards
    await expect(page.getByText('Receita Prevista')).toBeVisible();
    await expect(page.getByText('Receita Recebida')).toBeVisible();
    await expect(page.getByText('Em Aberto')).toBeVisible();
    await expect(page.getByText('Adimplência')).toBeVisible();
  });

  test('should filter by year', async ({ page }) => {
    await page.goto('/pagamentos');

    // Trocar ano
    await page.selectOption('select', '2024');

    // Verificar atualização (esperar loading)
    await page.waitForTimeout(1000);

    // Verificar que dados mudaram (exemplo: previsto diferente)
    const previsto = await page.locator('text=R$ ').first();
    await expect(previsto).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/pagamentos');

    // Verificar aba Mensalidades ativa
    await expect(page.getByRole('tab', { name: 'Mensalidades' })).toHaveAttribute('data-state', 'active');

    // Trocar para Anuidades
    await page.getByRole('tab', { name: 'Anuidades' }).click();
    await expect(page.getByRole('tab', { name: 'Anuidades' })).toHaveAttribute('data-state', 'active');

    // Verificar que KPIs atualizaram
    await page.waitForTimeout(500);
    await expect(page.getByText('Receita Prevista')).toBeVisible();
  });
});
```

### 4.2 Documentação Atualizada

**Arquivo**: `DOCS/Pagamentos.md` (criar)

```markdown
# Módulo de Pagamentos — Documentação Técnica

## Visão Geral

Sistema de gestão de **mensalidades** (beneficiário: Loja) e **anuidades** (beneficiário: Potência) com:
- Cobranças pré-geradas (`BillingCharge`)
- 4 KPIs otimizados (Previsto, Recebido, Em Aberto, Adimplência)
- Matriz membro x período (paginada)
- Multi-tenant com RBAC

## Arquitetura

### Modelo de Dados

```
BillingCharge (cobrança esperada)
├── type: MONTHLY | ANNUAL
├── year, month (month = null para anuidades)
├── expectedAmount (valor esperado)
├── status: PENDING | PAID | CANCELED
└── payment (vínculo com MemberPayment quando pago)
```

### Regras de Negócio

1. **Anti-duplicidade**: `(lodgeId, memberId, year, month, type)` é único
2. **Beneficiário fixo**: Mensalidade → Loja, Anuidade → Potência
3. **Geração automática**: Script backfill cria charges para ano atual
4. **Performance**: Matriz lê charges (não procura ausências)

## APIs

### 1. Summary (KPIs)
GET `/api/billing/summary?type=MONTHLY&year=2025`

### 2. Matrix (Tabela)
GET `/api/billing/dues/matrix?type=MONTHLY&year=2025&page=1&pageSize=20`

### 3. Register Payment
POST `/api/billing/payments`
Body: `{ chargeId, amount, paymentMethod, paidAt }`

### 4. History
GET `/api/billing/payments/history?memberId=uuid`

## Scripts de Manutenção

### Gerar Charges (Backfill)
```bash
npm run db:backfill-charges
```

Gera:
- 12 mensalidades (ano atual) por membro ativo
- 7 anuidades (ano atual + 6) por membro ativo

### Quando executar
- Após adicionar novo membro
- No início de cada ano (gerar próximo ano)
- Após migração de dados

## UI/UX

### Cards KPI
- **Verde**: Adimplência >= 80%
- **Amarelo**: 50-79%
- **Vermelho**: < 50%

### Tabela Matriz
- Paginação: 20 membros/página
- Ordenação: Por nome (alfabética)
- Filtro: Busca por nome

## Permissões (RBAC)

| Ação | Admin SaaS | Admin Loja | Membro |
|------|------------|------------|--------|
| Ver todas as lojas | ✅ | ❌ | ❌ |
| Filtrar por loja | ✅ | N/A | N/A |
| Ver matriz completa | ✅ | ✅ (só sua loja) | ❌ |
| Registrar pagamento | ✅ | ✅ | ❌ |
| Ver próprio histórico | ✅ | ✅ | ✅ |

## Performance

### Benchmarks Esperados
- Summary: < 200ms (agregação de ~720 charges)
- Matrix: < 1s (60 membros x 12 meses)
- Register Payment: < 300ms (transação atômica)

### Otimizações
- Índices: `(tenantId, lodgeId, year, type)`
- Paginação: 20 registros/página
- Cache (futuro): Redis para summary (TTL 5min)
```

### 4.3 Critério de Aceite

- [ ] 3 testes E2E passando (cards, filtros, tabs)
- [ ] Documentação técnica criada em `DOCS/Pagamentos.md`
- [ ] README atualizado com comando `npm run db:backfill-charges`

---

## Definition of Done (Sprint Completa)

- [ ] **Subitem 1**: Tabela `BillingCharge` criada + backfill executado
- [ ] **Subitem 2**: 4 APIs implementadas e testadas manualmente
- [ ] **Subitem 3**: Frontend com 4 cards KPI + abas funcionais
- [ ] **Subitem 4**: Testes E2E passando + documentação completa
- [ ] **Performance**: Matrix carrega em < 1s para 100 membros
- [ ] **Multi-tenant**: Admin Loja só vê dados da própria loja
- [ ] **Code Review**: PR aprovado com checklist de segurança

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Performance ruim na matriz | Alto | Índices + paginação + charges pré-geradas |
| Duplicação de charges | Médio | Constraint único no DB + upsert no backfill |
| Multi-tenant vazamento | Crítico | Teste E2E específico + code review rigoroso |
| Backfill lento (muitos membros) | Baixo | Rodar em batch + progress bar |

---

## Próximas Melhorias (Fora do Escopo)

- [ ] Cache Redis para KPIs
- [ ] Export CSV da matriz
- [ ] Gráficos de tendência (últimos 12 meses)
- [ ] Notificação automática de pendências (WhatsApp/Email)
- [ ] Integração Pix/Boleto (checkout online)
