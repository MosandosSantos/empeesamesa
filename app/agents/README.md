# Agentes de IA - EsferaORDO

Este diretório contém agentes especializados de IA para desenvolvimento do projeto EsferaORDO. Cada agente é um especialista em uma área específica da stack tecnológica.

## 📋 Índice de Agentes

### 1. [Next.js Fullstack Developer](./nextjs-fullstack-dev.md)
**Especialidade:** Next.js 16, App Router, TypeScript, Server Actions, API Routes

**Use quando precisar:**
- Criar ou modificar páginas e layouts do Next.js
- Implementar Server Components e Client Components
- Desenvolver API routes e Server Actions
- Configurar roteamento e middleware
- Otimizar performance com SSR/SSG
- Integrar autenticação JWT

**MCP Servers:** context7 (para documentação atualizada do Next.js 16)

---

### 2. [Tailwind UI Designer](./tailwind-ui-designer.md)
**Especialidade:** Tailwind CSS 4, shadcn/ui, Design System RER, Responsividade

**Use quando precisar:**
- Implementar componentes do design system
- Criar layouts responsivos mobile-first
- Aplicar paleta de cores RER (verde/ouro/vermelho)
- Integrar componentes shadcn/ui
- Desenvolver interfaces acessíveis
- Adaptar tabelas para mobile (cards)

**MCP Servers:** context7 (para documentação do Tailwind CSS 4 e shadcn/ui)

---

### 3. [Database Architect](./database-architect.md)
**Especialidade:** PostgreSQL, Prisma/Drizzle, Modelagem Multi-tenant, Migrations

**Use quando precisar:**
- Modelar novas entidades do banco de dados
- Criar e gerenciar migrations
- Implementar queries otimizadas
- Garantir isolamento multi-tenant
- Implementar soft deletes e auditoria
- Otimizar performance de queries

**MCP Servers:** context7 (para documentação do Prisma/Drizzle e PostgreSQL)

---

### 4. [QA Tester](./qa-tester.md)
**Especialidade:** Playwright, Testes E2E, Validação de Design, Acessibilidade

**Use quando precisar:**
- Criar testes end-to-end automatizados
- Validar funcionalidades em diferentes browsers
- Verificar responsividade mobile
- Testar fluxos de usuário completos
- Validar conformidade com design system
- Testar acessibilidade (WCAG)

**MCP Servers:** playwright (para automação de testes)

---

### 5. [Security Specialist](./security-specialist.md)
**Especialidade:** JWT, Autenticação, LGPD, Rate Limiting, Auditoria

**Use quando precisar:**
- Implementar ou revisar autenticação JWT
- Configurar middleware de segurança
- Implementar rate limiting
- Criar logs de auditoria
- Validar conformidade LGPD
- Revisar código para vulnerabilidades (XSS, SQL injection, etc.)

**MCP Servers:** context7 (para documentação de segurança)

---

## 🎯 Quando Usar Cada Agente

### Implementando Nova Feature
1. **Database Architect** - Modele as entidades necessárias
2. **Next.js Fullstack Developer** - Implemente backend (API routes) e frontend (pages)
3. **Tailwind UI Designer** - Estilize componentes seguindo design system
4. **Security Specialist** - Revise permissões e segurança
5. **QA Tester** - Crie testes E2E para a feature

### Corrigindo Bug
1. **QA Tester** - Reproduza o bug com teste E2E
2. **Agente específico da área** - Corrija o problema
3. **QA Tester** - Valide a correção

### Otimizando Performance
1. **Database Architect** - Otimize queries e índices
2. **Next.js Fullstack Developer** - Implemente SSR/SSG, code splitting
3. **QA Tester** - Valide métricas de performance

### Revisão de Código
1. **Security Specialist** - Verifique vulnerabilidades
2. **Database Architect** - Revise queries e migrations
3. **Tailwind UI Designer** - Valide conformidade com design system
4. **QA Tester** - Execute suite de testes

## 📚 Convenções

Todos os agentes seguem estas convenções:
- **Código:** Inglês
- **UI/Conteúdo:** Português (pt-BR)
- **Mobile-first:** Sempre
- **Multi-tenant:** `tenant_id` obrigatório em todas as tabelas
- **Auditoria:** `created_at` e `updated_at` em todas as entidades
- **Segurança:** Validação de inputs, proteção contra XSS/SQL injection

## 🔧 MCP Servers Utilizados

### context7
Fornece documentação atualizada das tecnologias da stack:
- Next.js 16
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui
- Prisma/Drizzle
- PostgreSQL

### playwright
Automação de testes end-to-end:
- Navegação e interação com UI
- Testes multi-browser
- Screenshots e vídeos
- Testes de responsividade
- Validação de acessibilidade

## 📖 Documentação do Projeto

Consulte sempre:
- `DOCS/Arquitetura.md` - Stack e modelagem
- `DOCS/DesignSystem.md` - Padrões de UI/UX
- `DOCS/Requisitos.md` - Requisitos funcionais
- `DOCS/Desenvolvimento.md` - Workflows e padrões
- `DOCS/Sprints.md` - Planejamento e roadmap
