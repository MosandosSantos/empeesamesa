# Planejamento de Sprints

## Premissas

- **Duração**: 2 semanas por sprint (média)
- **Total MVP**: ~10 a 12 sprints (20 a 24 semanas)
- **Metodologia**: Incremental - cada sprint entrega valor

## Roadmap

```
Sprint 0: Fundação (1 semana)
Sprint 1-2: Dashboard + Auth (4 semanas)
Sprint 3-5: Membros + Presença + Mensalidades (6 semanas)
Sprint 6: Financeiro (3 semanas)
Sprint 7-9: Biblioteca + ATAs + Quiz + Inventário (6 semanas)
Sprint 10-11: E-mails + Boletos + QA + Deploy (4 semanas)
```

---

## Sprint 0 — Fundação

**Duração**: 1 semana
**Status**: 🟡 Em andamento

### Objetivos
Preparar base técnica do projeto para desenvolvimento dos módulos.

### Tarefas

- [x] S0.1 Criar projeto Next.js (TypeScript) + Tailwind
- [x] S0.2 Integrar shadcn/ui (instalação base)
- [ ] S0.3 Escolher e configurar ORM (Prisma ou Drizzle)
- [ ] S0.4 Criar modelos iniciais: Tenant, User
- [ ] S0.5 Configurar SQLite + migrations
- [ ] S0.6 Criar seed (tenant default + usuário admin)
- [ ] S0.7 Implementar AppShell (Sidebar + Topbar)
- [ ] S0.8 Definir tokens de cor (RER: verde, ouro, vermelho)

### Entregável
Projeto base funcionando com AppShell e autenticação mockada.

---

## Sprint 1 — Dashboard

**Duração**: 2 semanas
**Status**: 🔵 Planejado

### Objetivos
Criar tela central do sistema com KPIs e gráficos mockados.

### Tarefas

- [ ] S1.1 Criar rota `/dashboard`
- [ ] S1.2 Implementar layout com AppShell
- [ ] S1.3 Criar componentes de KPI cards
  - Membros ativos
  - % Adimplência
  - Receita/Despesa do mês
  - Saldo
- [ ] S1.4 Implementar gráficos mockados
  - Receitas vs Despesas (linha)
  - Adimplentes vs Inadimplentes (donut)
- [ ] S1.5 Implementar responsividade (drawer mobile)
- [ ] S1.6 Adicionar filtro de período (mês/trimestre/ano)

### Entregável
Dashboard funcional com dados mockados, acessível e responsivo.

---

## Sprint 2 — Autenticação JWT

**Duração**: 2 semanas
**Status**: 🔵 Planejado

### Objetivos
Implementar autenticação segura com JWT em cookies.

### Tarefas

- [ ] S2.1 Criar model User (email, password_hash, role)
- [ ] S2.2 Implementar hash de senha (bcrypt)
- [ ] S2.3 Criar API route `/api/auth/login`
  - Validar credenciais
  - Gerar JWT (validade: 7 dias)
  - Armazenar em cookie httpOnly
- [ ] S2.4 Criar API route `/api/auth/logout`
- [ ] S2.5 Implementar middleware de proteção de rotas
- [ ] S2.6 Criar tela `/login`
- [ ] S2.7 Adicionar rate limiting no login
- [ ] S2.8 Testar fluxo completo (login → dashboard → logout)

### Entregável
Autenticação funcional com login/logout e proteção de rotas.

---

## Sprint 3 — Membros (CRUD)

**Duração**: 2 semanas
**Status**: 🔵 Planejado

### Objetivos
Implementar gestão completa de membros.

### Tarefas

- [ ] S3.1 Criar model Member (tenant_id, name, email, status, grade)
- [ ] S3.2 Criar API routes CRUD (`/api/members`)
- [ ] S3.3 Criar página de listagem (`/membros`)
  - Tabela com busca
  - Filtros (status, grau)
  - Paginação
  - CTA "+ Novo Membro"
- [ ] S3.4 Criar formulário de cadastro/edição
  - Validação de campos
  - Toast de confirmação
- [ ] S3.5 Implementar visualização de perfil (abas)
- [ ] S3.6 Implementar exclusão (soft delete) com confirmação
- [ ] S3.7 Adicionar exportação CSV
- [ ] S3.8 Responsividade (cards no mobile)

### Entregável
CRUD completo de membros com interface padrão "Esfera NR6".

---

## Sprint 4 — Presença

**Duração**: 2 semanas
**Status**: 🔵 Planejado

### Objetivos
Controlar presença em sessões.

### Tarefas

- [ ] S4.1 Criar models Meeting, Attendance
- [ ] S4.2 Criar API routes para sessões e presença
- [ ] S4.3 Criar página de sessões (`/presenca`)
  - Listagem de sessões
  - "+ Nova Sessão"
- [ ] S4.4 Criar interface de marcação de presença
  - Lista de membros
  - Checkboxes/toggles (Presente/Falta/Justificada)
  - Otimizado para mobile
- [ ] S4.5 Implementar relatórios
  - Presença por período
  - Presença por membro
  - Ranking de assiduidade
- [ ] S4.6 Adicionar exportação CSV

### Entregável
Controle de presença funcional com relatórios.

---

## Sprint 5 — Mensalidades

**Duração**: 2 semanas
**Status**: 🔵 Planejado

### Objetivos
Controlar mensalidades e inadimplência.

### Tarefas

- [ ] S5.1 Criar models DuesPeriod, DuesPayment
- [ ] S5.2 Criar API routes para competências e pagamentos
- [ ] S5.3 Criar página de mensalidades (`/mensalidades`)
  - Criar competência (mês/ano)
  - Listagem de membros por competência
  - Status: Pago/Parcial/Em aberto
- [ ] S5.4 Implementar registro de pagamento
  - Valor, data, meio de pagamento
  - Anexo (opcional)
- [ ] S5.5 Criar visão por membro (histórico)
- [ ] S5.6 Criar relatório de inadimplentes
- [ ] S5.7 Adicionar exportação CSV
- [ ] S5.8 Atualizar KPI de adimplência no dashboard

### Entregável
Controle de mensalidades completo com histórico e inadimplência.

---

## Sprint 6 — Financeiro

**Duração**: 3 semanas
**Status**: 🔵 Planejado

### Objetivos
Implementar controle de receitas, despesas e balanços.

### Tarefas

- [ ] S6.1 Criar models Category, Transaction
- [ ] S6.2 Criar API routes para categorias e transações
- [ ] S6.3 Implementar CRUD de Receitas (`/financeiro/receitas`)
  - Categorias configuráveis
  - Anexos de comprovantes
- [ ] S6.4 Implementar CRUD de Despesas (`/financeiro/despesas`)
  - Categorias configuráveis
  - Anexos (notas, recibos)
- [ ] S6.5 Criar relatórios por período e categoria
- [ ] S6.6 Implementar balanços (`/financeiro/balancos`)
  - Mensal, trimestral, anual
  - Comparativo com período anterior
- [ ] S6.7 Adicionar exportações CSV
- [ ] S6.8 Atualizar dashboard com dados reais de financeiro

### Entregável
Módulo financeiro completo com receitas, despesas e balanços.

---

## Sprint 7 — Biblioteca e ATAs

**Duração**: 2 semanas
**Status**: 🔵 Planejado

### Objetivos
Organizar documentos da Loja.

### Tarefas

- [ ] S7.1 Criar models LibraryItem, Minutes
- [ ] S7.2 Criar API routes para biblioteca e atas
- [ ] S7.3 Implementar Biblioteca (`/documentos/biblioteca`)
  - Upload de PDFs
  - Busca e filtros (título, tema, tags)
  - Download/visualização
  - Permissões (admin sobe, membros leem)
- [ ] S7.4 Implementar ATAs (`/documentos/atas`)
  - Vinculadas a sessões
  - CRUD com permissões (admin)
  - Busca por período/tags
  - Download

### Entregável
Módulos de biblioteca e atas funcionais.

---

## Sprint 8 — Quiz e Ranking

**Duração**: 2 semanas
**Status**: 🔵 Planejado

### Objetivos
Engajamento através de quizzes.

### Tarefas

- [ ] S8.1 Criar models Quiz, QuizQuestion, QuizAttempt
- [ ] S8.2 Criar API routes para quiz
- [ ] S8.3 Implementar CRUD de quiz (admin) (`/quiz/admin`)
  - Criar quiz
  - Adicionar perguntas (múltipla escolha)
  - Gabarito
- [ ] S8.4 Implementar interface de resposta (membro) (`/quiz`)
  - Mobile-first
  - Pontuação automática
  - Anti-fraude (1 tentativa/dia)
- [ ] S8.5 Criar ranking (`/quiz/ranking`)
  - Por período
  - Geral

### Entregável
Sistema de quiz funcional com ranking.

---

## Sprint 9 — Inventário

**Duração**: 2 semanas
**Status**: 🔵 Planejado

### Objetivos
Controlar materiais da Loja.

### Tarefas

- [ ] S9.1 Criar models InventoryItem, InventoryLog
- [ ] S9.2 Criar API routes para inventário
- [ ] S9.3 Implementar CRUD de itens (`/inventario`)
  - Nome, categoria, quantidade, unidade
  - Localização, estoque mínimo
- [ ] S9.4 Implementar registro de entrada
  - Quantidade, data, origem
- [ ] S9.5 Implementar registro de saída
  - Quantidade, data, destino/uso
  - Validação (não negativar estoque)
- [ ] S9.6 Criar histórico de movimentações
- [ ] S9.7 Implementar alerta de estoque mínimo
- [ ] S9.8 Adicionar exportação CSV

### Entregável
Módulo de inventário completo com rastreabilidade.

---

## Sprint 10 — E-mails e Boletos

**Duração**: 2 semanas
**Status**: 🔵 Planejado

### Objetivos
Implementar comunicação e boletos (fluxo mínimo).

### Tarefas

- [ ] S10.1 Integrar provider de e-mail (SendGrid/Resend)
- [ ] S10.2 Criar model EmailLog
- [ ] S10.3 Implementar envio de e-mails (`/comunicacao/emails`)
  - Destinatários: Todos/Inadimplentes/Ativos/Grupo
  - Log de envios
- [ ] S10.4 Integrar provider de boletos (ex: Asaas)
- [ ] S10.5 Criar model Boleto
- [ ] S10.6 Implementar emissão manual de boletos (`/comunicacao/boletos`)
  - Geração por membro
  - Link/PDF
  - Status (pendente/pago/cancelado)

### Entregável
Módulos de e-mails e boletos funcionais (fluxo básico).

---

## Sprint 11 — Produção e QA

**Duração**: 2 semanas
**Status**: 🔵 Planejado

### Objetivos
Preparar sistema para produção.

### Tarefas

- [ ] S11.1 Migrar para Neon PostgreSQL
- [ ] S11.2 Configurar variáveis de ambiente (produção)
- [ ] S11.3 Deploy em Vercel (ou servidor)
- [ ] S11.4 Implementar testes mínimos
  - Autenticação
  - Mensalidades (cálculo de adimplência)
  - Transações financeiras
- [ ] S11.5 QA completo (mobile + desktop)
- [ ] S11.6 Ajustes finais de UX
- [ ] S11.7 Documentação de deploy
- [ ] S11.8 Treinamento do usuário (documentação)

### Entregável
Sistema em produção, testado e documentado.

---

## Sprints Futuras (Pós-MVP)

### Sprint 12+ — Melhorias e Novas Features

**Candidatos:**
- Troca de senha por e-mail
- Templates de comunicação
- Webhooks de boletos (pagamento automático)
- Admissão de candidatos (fluxo completo)
- Multi-idioma (i18n)
- White-label (SaaS)
- Analytics avançado
- Notificações push
- Integração WhatsApp (comunicação)
- Módulo de eventos (além de sessões)

---

## Cronograma Visual

```
Semana  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
Sprint  0  |  1  |  2  |  3  |  4  |  5  |    6    |  7  |  8  |  9  | 10  | 11  |
        F  D  D  A  A  M  M  P  P  Me Me    Fi  Fi  Bi Li Qz Qz Iv Iv Em Bo Pr Pr
```

**Legenda:**
- F: Fundação
- D: Dashboard
- A: Auth
- M: Membros
- P: Presença
- Me: Mensalidades
- Fi: Financeiro
- Bi: Biblioteca
- Li: Atas (Minutes)
- Qz: Quiz
- Iv: Inventário
- Em: E-mails
- Bo: Boletos
- Pr: Produção/QA

---

## Métricas de Progresso

### Por Sprint
- [ ] Todas as tarefas concluídas
- [ ] Código revisado (PR)
- [ ] Testes manuais realizados
- [ ] Deploy em staging/dev

### Geral (MVP)
- [ ] Todos os RF Must Have implementados
- [ ] Dashboard funcional com dados reais
- [ ] Sistema em produção
- [ ] Documentação completa
- [ ] Treinamento realizado

---

## Riscos e Mitigações

### Risco 1: Over-engineering
**Mitigação**: Seguir princípio YAGNI (You Aren't Gonna Need It) - implementar apenas o necessário.

### Risco 2: Prazo
**Mitigação**: Priorizar Must Have. Should/Could Have podem ser pós-MVP.

### Risco 3: Integrações (boletos/e-mails)
**Mitigação**: Escolher 1 provider com boa documentação. Fluxo mínimo no MVP.

### Risco 4: Complexidade multi-tenant
**Mitigação**: Implementar mínimo necessário (tenant_id em queries). Billing e admin multi-tenant podem ser futuro.

---

## Definição de Pronto (DoD)

Para considerar uma tarefa/sprint completa:

1. ✅ Código implementado e funcionando
2. ✅ Responsivo (mobile + desktop)
3. ✅ Dados validados (server-side)
4. ✅ Erros tratados com feedback claro
5. ✅ Filtrado por tenant (multi-tenant)
6. ✅ Testado manualmente (fluxo completo)
7. ✅ Código revisado (quando aplicável)
8. ✅ Documentação atualizada (se necessário)

---

## Referências

- Planejamento completo: `app/DOCS/Sprint_MESA.md`
- Requisitos funcionais: `DOCS/Requisitos.md`
- Arquitetura técnica: `DOCS/Arquitetura.md`
