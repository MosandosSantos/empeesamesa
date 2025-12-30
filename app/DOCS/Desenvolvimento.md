# Guia de Desenvolvimento

## Setup Inicial

### Pré-requisitos
- Node.js 20+ instalado
- npm ou yarn
- Git

### Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd EsferaORDO

# Instalar dependências
cd app
npm install
```

## Comandos de Desenvolvimento

### Servidor de Desenvolvimento
```bash
cd app
npm run dev
```
- Inicia em http://localhost:3000
- Hot reload ativado
- Útil para desenvolvimento diário

### Build de Produção
```bash
cd app
npm run build
```
- Gera build otimizado em `.next/`
- Valida TypeScript e lint
- Necessário antes de deploy

### Servidor de Produção
```bash
cd app
npm run start
```
- Inicia servidor de produção
- Requer `npm run build` antes

### Linting
```bash
cd app
npm run lint
```
- Verifica código com ESLint
- Configuração: Next.js + TypeScript

## Estrutura de Código

### Organização de Arquivos

```
app/src/app/
├── layout.tsx          # Layout raiz (comum a todas as páginas)
├── page.tsx            # Página inicial (/)
├── globals.css         # Estilos globais
├── dashboard/          # Módulo Dashboard
│   ├── page.tsx
│   └── components/
├── membros/            # Módulo Membros
│   ├── page.tsx        # Listagem
│   ├── novo/
│   │   └── page.tsx    # Criar
│   ├── [id]/
│   │   ├── page.tsx    # Visualizar
│   │   └── editar/
│   │       └── page.tsx # Editar
│   └── components/
└── api/                # API Routes
    └── membros/
        └── route.ts
```

### Convenção de Nomenclatura

**Arquivos**
- Componentes: `PascalCase.tsx` (ex: `MemberCard.tsx`)
- Páginas: `page.tsx` (padrão Next.js App Router)
- Layouts: `layout.tsx`
- Routes: `route.ts`

**Código**
- Variáveis/funções: `camelCase`
- Componentes: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase` com prefixo `I` para interfaces (opcional)

**Idioma**
- Código: **Inglês** (variáveis, funções, comentários)
- UI/Content: **Português** (textos, labels, mensagens)

```typescript
// ✅ Correto
const calculateMonthlyRevenue = (transactions: Transaction[]) => {
  return <div>Receita Mensal: {total}</div>
}

// ❌ Errado
const calcularReceitaMensal = (transacoes: Transacao[]) => {
  return <div>Monthly Revenue: {total}</div>
}
```

## Padrões de Código

### Componentes React

**Server Components (padrão)**
```typescript
// app/membros/page.tsx
export default async function MembersPage() {
  const members = await getMembers()

  return (
    <div>
      <h1>Membros</h1>
      <MemberList members={members} />
    </div>
  )
}
```

**Client Components**
```typescript
// components/MemberForm.tsx
'use client'

import { useState } from 'react'

export function MemberForm() {
  const [name, setName] = useState('')

  return (
    <form>
      <input value={name} onChange={(e) => setName(e.target.value)} />
    </form>
  )
}
```

### API Routes

```typescript
// app/api/membros/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const members = await db.member.findMany()
  return NextResponse.json(members)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const member = await db.member.create({ data: body })
  return NextResponse.json(member, { status: 201 })
}
```

### Tratamento de Erros

```typescript
try {
  const result = await dangerousOperation()
  return { success: true, data: result }
} catch (error) {
  console.error('Operation failed:', error)
  return { success: false, error: 'Erro ao processar operação' }
}
```

### Validação de Forms

```typescript
import { z } from 'zod' // (quando integrado)

const memberSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  status: z.enum(['Ativo', 'Inativo', 'Em admissão'])
})

// Uso
const result = memberSchema.safeParse(formData)
if (!result.success) {
  return { errors: result.error.flatten() }
}
```

## Estilização

### Tailwind CSS

**Classes Utilitárias**
```tsx
<div className="flex flex-col gap-4 p-6 bg-white dark:bg-black rounded-lg shadow">
  <h2 className="text-2xl font-semibold">Título</h2>
  <p className="text-lg text-gray-600 dark:text-gray-400">Descrição</p>
</div>
```

**Responsividade**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Mobile: 1 coluna, Tablet: 2, Desktop: 4 */}
</div>
```

**CSS Customizado** (quando necessário)
```css
/* globals.css */
@theme inline {
  --color-primary: #16a34a; /* verde */
  --color-accent: #d97706;  /* ouro */
  --color-danger: #dc2626;  /* vermelho */
}
```

### Componentes shadcn/ui

**Instalação** (após integração)
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table
```

**Uso**
```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function Example() {
  return (
    <Card>
      <Button>Clique aqui</Button>
    </Card>
  )
}
```

## Banco de Dados (quando configurado)

### Migrations

```bash
# Criar migration
npm run db:migrate:create

# Rodar migrations
npm run db:migrate

# Resetar banco (dev)
npm run db:reset
```

### Queries

```typescript
// Exemplo com Prisma
const activeMembers = await prisma.member.findMany({
  where: {
    tenant_id: tenantId,
    status: 'Ativo'
  },
  orderBy: { name: 'asc' }
})

// Exemplo com Drizzle
const activeMembers = await db
  .select()
  .from(members)
  .where(and(
    eq(members.tenantId, tenantId),
    eq(members.status, 'Ativo')
  ))
  .orderBy(asc(members.name))
```

### Multi-tenant

**Sempre filtrar por tenant_id:**
```typescript
// ✅ Correto
const members = await db.member.findMany({
  where: { tenant_id: currentTenantId }
})

// ❌ ERRADO - vaza dados de outros tenants
const members = await db.member.findMany()
```

## Workflow de Desenvolvimento

### Feature Nova

1. **Criar branch**
```bash
git checkout -b feature/nome-da-feature
```

2. **Desenvolver**
   - Criar modelos de dados (se necessário)
   - Implementar API routes
   - Criar componentes UI
   - Adicionar páginas

3. **Testar localmente**
```bash
npm run dev
# Testar no navegador
npm run build # Validar build
```

4. **Commit**
```bash
git add .
git commit -m "feat: adiciona módulo de membros"
```

5. **Push e PR**
```bash
git push origin feature/nome-da-feature
# Abrir Pull Request no GitHub
```

### Padrão de Commits

Usar Conventional Commits:
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação (não afeta código)
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas de manutenção

Exemplos:
```
feat: adiciona CRUD de membros
fix: corrige cálculo de adimplência
docs: atualiza README com comandos
```

## Debugging

### Next.js Dev Tools

```typescript
// Logs no servidor (terminal)
console.log('Server log:', data)

// Logs no cliente (browser console)
'use client'
console.log('Client log:', data)
```

### VS Code

**launch.json** (opcional)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

### Erros Comuns

**"Module not found"**
- Verificar import path
- Checar alias `@/` em tsconfig.json
- Rodar `npm install`

**"Hydration error"**
- Garantir que Server e Client Components retornem mesmo HTML
- Evitar `Date.now()` ou valores aleatórios em Server Components

**"API route not found"**
- Verificar estrutura de pastas em `app/api/`
- Arquivos devem ser `route.ts` (não `route.tsx`)

## Testes (futuro)

### Jest + React Testing Library

```bash
npm run test
npm run test:watch
npm run test:coverage
```

### Estrutura
```
app/
├── src/
│   └── app/
│       └── membros/
│           ├── page.tsx
│           └── page.test.tsx
```

## Deploy

### Variáveis de Ambiente

Criar `.env.local` (não commitar):
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
NODE_ENV="development"
```

### Build de Produção

```bash
# Validar build
npm run build

# Testar produção localmente
npm run start
```

### Vercel (recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Configurar variáveis de ambiente no dashboard Vercel.

## Recursos e Ferramentas

### Extensões VS Code Recomendadas
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

### Links Úteis
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Troubleshooting

### Limpar Cache

```bash
# Limpar .next
rm -rf .next

# Limpar node_modules
rm -rf node_modules package-lock.json
npm install
```

### Portas em Uso

```bash
# Matar processo na porta 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Type Errors

```bash
# Verificar tipos sem rodar servidor
npx tsc --noEmit
```

## Boas Práticas

1. **Server Components por padrão**: Só usar Client Components quando necessário (state, eventos, hooks)
2. **Tipagem forte**: Evitar `any`, preferir tipos explícitos
3. **Componentização**: Criar componentes reutilizáveis
4. **Nomes descritivos**: Funções e variáveis com nomes claros
5. **DRY**: Não repetir código, criar utilitários
6. **Commits pequenos**: Commits atômicos e descritivos
7. **Mobile-first**: Sempre testar em mobile
8. **Segurança**: Nunca commitar secrets (usar .env)
9. **Performance**: Otimizar imagens, usar lazy loading
10. **Acessibilidade**: Labels em inputs, alt em imagens
