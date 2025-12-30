
> Premissa: **sprints de 2 semanas** (média).  
> Duração total do MVP: **~10 a 12 sprints** (20 a 24 semanas).

### Sprint 0 — Fundação (1 semana)

- [x] S0.1 Criar projeto Next.js (TS) + Tailwind
- [x] S0.2 Integrar shadcn/ui (base)
- [x] S0.3 ORM + SQLite + migrations (Tenant, User)
- [x] S0.4 Seed (tenant default + admin)
- [x] S0.5 AppShell (sidebar + topbar) + tokens de cor

### Sprint 1 — Dashboard (2 semanas)

- [ ] S1.1 `/dashboard` com AppShell
- [ ] S1.2 KPIs mockados
- [ ] S1.3 Gráficos mockados
- [ ] S1.4 Responsividade (drawer mobile)

### Sprint 2 — Auth JWT (2 semanas)

- [x] S2.1 Login por e-mail + senha hash
- [x] S2.2 JWT 7 dias em cookie httpOnly
- [x] S2.3 Middleware de proteção
- [x] S2.4 Tela `/login` + logout

### Sprint 3 — Membros (2 semanas)

- [x] S3.1 Tabela Member + CRUD
- [x] S3.2 Lista com filtros/busca/paginação
- [x] S3.3 Form novo/editar + validações
- [ ] S3.4 Perfil do membro (abas)

### Sprint 4 — Presença (2 semanas)

- [ ] S4.1 Meeting + Attendance
- [ ] S4.2 Criar sessão + listar
- [ ] S4.3 Marcação rápida (mobile)
- [ ] S4.4 Relatórios + CSV

### Sprint 5 — Mensalidades (2 semanas)

- [x] S5.1 DuesPeriod + DuesPayment
- [x] S5.2 Competência mês/ano
- [x] S5.3 Registrar pagamento
- [x] S5.4 Inadimplentes + CSV

### Sprint 6 — Financeiro (3 semanas)

- [x] S6.1 Category + Transaction
- [x] S6.2 CRUD Receitas
- [x] S6.3 CRUD Despesas
- [x] S6.4 Balanços (mensal/trimestral/anual) + CSV
- [x] S6.5 Dashboard com dados reais

### Sprint 7 — Biblioteca + ATAs (2 semanas)

- [ ] S7.1 LibraryItem + Minutes
- [ ] S7.2 Upload/consulta biblioteca
- [ ] S7.3 ATAs por sessão + permissões

### Sprint 8 — Quiz + Ranking (2 semanas)

- [ ] S8.1 Quiz + QuizQuestion + QuizAttempt
- [ ] S8.2 CRUD quiz (admin)
- [ ] S8.3 Responder (membro) + regras
- [ ] S8.4 Ranking mensal + geral

### Sprint 9 — Inventário (2 semanas)

- [x] S9.1 InventoryItem + InventoryLog
- [x] S9.2 CRUD itens
- [x] S9.3 Entrada/saída + validações
- [x] S9.4 Histórico + CSV + alerta de mínimo (opcional)

### Sprint 10 — E-mails + Boletos (2 semanas)

- [ ] S10.1 E-mails (provider simples) + EmailLog
- [ ] S10.2 Boletos (1 provedor) + status + link/PDF

### Sprint 11 — Produção e QA (2 semanas)

- [ ] S11.1 Neon Postgres + migrations
- [ ] S11.2 Deploy + envs
- [ ] S11.3 Testes mínimos (auth, mensalidades, transações)
- [ ] S11.4 Ajustes finais UX mobile

---

## 14) Estimativas de preço (Brasil)

> Valores de referência para orientar estratégia comercial. Ajuste conforme escopo final, equipe, prazo e nível de acabamento.

### 14.1 Desenvolvimento sob encomenda (site/sistema)

- **MVP profissional (1 loja):** **R$ 80.000 a R$ 180.000**
- **Mais robusto (multi-tenant + boletos + docs + inventário + refinamentos):** **R$ 180.000 a R$ 350.000**

### 14.2 SaaS (assinatura mensal)

Sugestão de planos (por Loja/tenant):

- **Básico (Membros + Presença + Mensalidades):** **R$ 149 a R$ 249/mês**
- **Pro (Básico + Financeiro + Documentos):** **R$ 299 a R$ 449/mês**
- **Premium (Pro + Boletos + E-mails + Inventário + Quiz):** **R$ 449 a R$ 699/mês**

Add-ons:
- **Implantação/onboarding:** R$ 1.500 a R$ 5.000
- **Suporte premium / SLA:** +R$ 150 a R$ 400/mês
- **White-label:** sob proposta

---

## 15) Links de referência (opcionais)

- Next.js Authentication Guide: https://nextjs.org/docs/pages/guides/authentication
- Neon Connection Pooling: https://neon.com/docs/connect/connection-pooling
- Asaas API: https://docs.asaas.com/docs/visao-geral
