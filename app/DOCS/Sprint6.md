Sprint 6: Módulo de Contas a Pagar e Receber
Este documento descreve o plano técnico para o desenvolvimento do módulo de Contas a Pagar e a Receber na aplicação SaaS (Loja Maçônica), incluindo modelagem de dados, APIs, interface e relatórios, em substituição do Sprint 6 anterior. O módulo deve permitir CRUD completo de lançamentos financeiros (receitas e despesas) com campos como tipo (Receita/Despesa), categoria (vinculada ao tenant), valor previsto/pago, datas de vencimento/pagamento, status (Aberto/Pago/Parcial/Atrasado/Previsto), descrição, forma de pagamento (PIX, Transferência, Dinheiro, Boleto) e um anexo de comprovante (upload mock). Também contemplamos multi-tenant, relatórios filtráveis, painel financeiro com KPIs e gráficos, e uso de componentes de UI modernos (Next.js 16, TypeScript, Tailwind CSS, shadcn/ui).
1. Modelagem de Dados e Multi-Tenancy
A base do módulo será um modelo de dados que reflita os campos obrigatórios. Por exemplo, uma tabela Lancamentos (ou accounts) pode conter colunas: id, tenant_id, tipo (enum [Receita, Despesa]), categoria_id (FK), valor_previsto, valor_pago, data_vencimento, data_pagamento, status (enum), descricao, forma_pagamento (enum), anexo (URL do comprovante), além de timestamps. Esses campos coincidem com sistemas financeiros típicos
gmpe.com.br
. A coluna tenant_id em cada registro assegura isolamento: cada loja só vê seus lançamentos. Segundo boas práticas de multi-tenant, adotamos banco compartilhado + schema compartilhado, diferenciando dados por um campo tenant_id e filtrando todas as queries por ele
workos.com
. Isso atende ao requisito de visualização restrita por lojista e permite que o superadmin (role específica) acesse todos os tenant_id. Também definimos uma tabela Categorias vinculada a tenant_id, para classificar receitas e despesas. Opcionalmente, um modelo Tenant e relacionamentos de usuário/tenant podem existir (ex.: tabela usuarios e membros conforme arquitetura típica de SaaS
workos.com
workos.com
). A migração inicial do banco (Prisma ou Drizzle) deve criar essas tabelas e índices (incluindo index sobre tenant_id e constraints compostas para integridade)
workos.com
.
2. Back-end e APIs
No back-end (Next.js API Routes ou uma estrutura similar), implementaremos endpoints para CRUD de lançamentos e categorias, sempre filtrando por tenant_id. Por exemplo, GET /api/contas?filtros… para listar, POST /api/contas para criar, etc. Adicionamos validação e tratamento (por exemplo com Zod) para garantir dados coerentes. O framework Next.js 16 permite criar rotas API facilmente e a nova template já inclui TypeScript e Tailwind CSS por padrão
nextjs.org
, alinhando-se ao nosso stack. Para acessar o banco usamos um ORM TypeScript, como o Prisma. Prisma é conhecido como “um toolkit ORM poderoso e type-safe para Node.js e TypeScript”
dev.to
, facilitando consultas e migrações. (Poderíamos também usar Drizzle ORM, mas citaremos Prisma a título de exemplo.) Configuramos dois datasources: SQLite para desenvolvimento local e PostgreSQL para produção. As credenciais vêm do .env. Usamos o cliente Prisma/Drizzle em cada rota, aplicando tenant_id automaticamente (via middleware ou injeção de contexto do usuário) para isolar dados. As rotas de relatório/dashboard podem agregar dados: somatórios de valor_previsto, valor_pago e saldos, agrupamentos mensais e por categoria. Em alguns casos, podem retornar dados pré-agrupados para alimentar gráficos. Por exemplo, um endpoint /api/dashboard/metrics pode calcular KPIs financeiros básicos (total a pagar, a receber, etc.) com base nos lançamentos do tenant_id
blog.coupler.io
.
3. Interface de Usuário (Front-end) e UX
No front-end, usamos Next.js 16 com App Router, TypeScript e Tailwind CSS (configuração já simplificada no template padrão
nextjs.org
). Para os componentes visuais, empregamos shadcn/ui, que fornece UI components personalizáveis e acessíveis construídos em Tailwind
ui.shadcn.com
. Isso inclui tabelas, formulários, botões, badges etc.
CRUD de Contas: Teremos página de listagem de lançamentos em tabela responsiva. Usaremos <Table> do shadcn/ui, que suporta legendas e pode ser combinado com TanStack Table para ordenação/paginação/filtros avançados
ui.shadcn.com
. As linhas exibem colunas como data, descrição, categoria, valor e status, usando badges de cores para destacar o estado. Por exemplo, <Badge variant="destructive"> pode sinalizar contas atrasadas (vermelho)
ui.shadcn.com
, enquanto badges verdes e cinzas representam outros status. Botões de ação (novo, editar, excluir) usam ícones e classes de cor (verde para ações positivas, vermelho para destruição).
Formulários: A página de criar/editar conta usa <Form> do shadcn, com campos agrupados logicamente (ex.: grupo de datas, de valores, seleção de status). Os campos obrigatórios e enums (tipo, status, forma de pagamento) são implementados como seletores. Um botão de upload simulado (“mock”) permite anexar comprovante (guardamos apenas nome/URL por enquanto). Utilizamos validação inline em TypeScript/Zod para garantir dados obrigatórios. Em telas mobile, exibimos itens em formato de card stacked, mantendo os mesmos dados de forma mais vertical (shadcn facilita responsividade).
Componentes visuais: Criamos componentes reutilizáveis (p.ex. StatusBadge, IconButton, Select, DatePicker) baseados em shadcn/ui. Isso garante consistência na UI (ex.: botões btn-success, btn-danger do Tailwind, badges coloridas) e acelera desenvolvimento. Gráficos são feitos com os Chart Components do shadcn (que usam Recharts por baixo)
ui.shadcn.com
. Por exemplo, usamos <BarChart> para comparativo mensal de contas pagas vs a pagar, e <PieChart> para distribuição por categoria, conforme exemplos de gráficos financeiros
blog.coupler.io
ui.shadcn.com
.
4. Relatórios e Dashboard Financeiro
O módulo inclui uma visão de dashboard com KPIs e filtros interativos. São fornecidos filtros (tipo, status, período, categoria), que atualizam a lista de lançamentos e os gráficos. Predefinimos “visões” úteis: contas vencidas, a vencer, pagas e inadimplentes (status atrasado). As métricas financeiras incluem somas de total a pagar/receber, total pagos, e saldos líquido previsto e realizado. Essas informações ajudam o lojista a priorizar cobranças e pagamentos – por exemplo, saber “quanto devo no momento, quantos dias de atraso existem” etc., como sugere um dashboard de contas a pagar
blog.coupler.io
. O painel financeiro exibe, em cards de destaque, esses KPIs. Em seguida há gráficos: por exemplo, um gráfico de barras mostrando valores pagos vs a pagar por mês (facilitando comparação de fluxo de caixa mensal) e um gráfico de pizza mostrando a participação de cada categoria nas receitas/despesas. Esses componentes utilizam dados agregados da API e podem ser atualizados em tempo real ou via cache. O layout do dashboard segue o estilo visual (shadcn/ui, Tailwind) já padronizado nas demais telas.
5. Multi-Tenancy e Segurança
Como cada Loja (tenant) deve ver apenas seus dados, implementamos controle de tenant em cada consulta. Toda operação de leitura/escrita inclui WHERE tenant_id = currentTenantId. A identificação do tenant atual pode vir de um contexto de autenticação, token ou subdomínio. O usuário superadmin (função especial) poderá, se autorizado, consultar dados de todos os tenants (por exemplo via dropdown de seleção de loja). Isso exige cuidado: falhas no filtro tenant_id podem vazar dados entre clientes, por isso aplicamos middleware ou hooks para automatizar o escopo de tenant nas rotas
workos.com
. Políticas de autenticação/permiso (ex.: só allow deletar se for administrador da loja) também serão aplicadas em lógica de back-end.
6. Futuras Expansões
Upload real de anexos: Por enquanto incluímos apenas um mock no front-end. Futuramente integraremos armazenamento de arquivos (ex.: AWS S3 ou base64 no banco) para salvar PDFs e comprovantes. Isso envolve criar endpoint seguro para upload e armazenar URL no campo anexo.
Integração com boletos: Após v1.0, planejamos conectar a serviços como Asaas (API brasileira de pagamentos) para emissão/controle automático de boletos. A Asaas fornece endpoints REST para criar cobranças via boleto/Pix
docs.asaas.com
. Esse trabalho ficaria em sprint futuro.
7. Stack Tecnológico
Usamos o stack padronizado do projeto: Next.js 16 (React + App Router) com TypeScript, Tailwind CSS 4 e shadcn/ui para componentes. Conforme o blog do Next.js 16, o create-next-app já configura TS e Tailwind por padrão
nextjs.org
, acelerando o setup. No back-end, escolheremos Prisma (ou Drizzle); ambos suportam SQLite para desenvolvimento local e PostgreSQL em produção. Prisma, por exemplo, usa schema.prisma para definir o modelo e gerar migrations facilmente
dev.to
. A conexão com o banco é via URL no .env: para dev, um arquivo SQLite local; para prod, string do Postgres. Para gráficos e tabelas, usamos bibliotecas suportadas pelo shadcn: os Chart Components (baseados em Recharts)
ui.shadcn.com
 e o <Table> integrado ao TanStack/Table para recursos avançados
ui.shadcn.com
. Badge e botões vêm do shadcn/ui, mantendo a identidade visual. Esta combinação de Next.js + TypeScript + Tailwind + shadcn/ui fornece alta produtividade e boas práticas de design e acessibilidade.
8. Exemplo de Schema e Migração
Abaixo, um exemplo simplificado de modelo Prisma para a tabela de lançamentos e categorias (arquivo schema.prisma):
enum TipoLancamento { RECEITA, DESPESA }
enum StatusLancamento { ABERTO, PAGO, PARCIAL, ATRASADO, PREVISTO }
enum FormaPagamento   { PIX, TRANSFERENCIA, DINHEIRO, BOLETO }

model Categoria {
  id        Int      @id @default(autoincrement())
  nome      String
  tenantId  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // Relações:
  lancamentos Lancamento[]
}

model Lancamento {
  id             Int               @id @default(autoincrement())
  tenantId       Int
  tipo           TipoLancamento
  categoriaId    Int
  descricao      String?
  valorPrevisto  Float
  valorPago      Float?
  dataVencimento DateTime
  dataPagamento  DateTime?
  status         StatusLancamento
  formaPagamento FormaPagamento
  anexo          String?           // URL ou caminho do comprovante
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  // Relações:
  categoria      Categoria         @relation(fields: [categoriaId], references: [id])
  
  @@index([tenantId])           // índice por tenant
  @@index([categoriaId])
}
Após definir o schema, executamos prisma migrate dev (SQLite) para gerar a migração inicial e criar as tabelas. Em produção, usamos prisma migrate deploy apontando para o Postgres.
9. Tarefas Técnicas
A sprint será dividida em tarefas técnicas identificadas por códigos S6.x.y. A seguir, listamos as principais tarefas por área:
S6.1 Modelagem de Dados:
S6.1.1: Definir e implementar modelos Prisma/Drizzle (tabelas de lançamentos e categorias, com campos obrigatórios e tenant_id).
S6.1.2: Criar migração inicial e seeds de categoria padrão.
S6.2 API / Backend:
S6.2.1: Desenvolver endpoints CRUD para lançamentos (GET, POST, PUT, DELETE).
S6.2.2: Desenvolver endpoints CRUD para categorias.
S6.2.3: Implementar filtros nos endpoints (por tipo, status, período, categoria) e visão das contas vencidas/adiantadas.
S6.2.4: Agregar endpoints para cálculos de KPIs (totais a pagar/receber, saldos) e dados para gráficos.
S6.2.5: Implementar lógica de multi-tenant (middleware ou hooks) garantindo que tenant_id seja aplicado a todas as consultas e mutações
workos.com
.
S6.3 Front-end (UI/UX):
S6.3.1: Página de listagem de contas (tabela responsiva com filtros laterais ou em cabeçalho). Uso de <Table> do shadcn e Badge para status
ui.shadcn.com
ui.shadcn.com
.
S6.3.2: Página de criação/edição de conta (formulário com campos agrupados). Validação de inputs e máscara de campos (datas, moeda). Botões com ícones coloridos. Upload simulador de comprovante.
S6.3.3: Dashboard financeiro (cards de KPI e gráficos). Implementar gráfico de barras (Contas pagas x a pagar) e gráfico de pizza (distribuição por categoria) usando os Chart Components do shadcn
ui.shadcn.com
.
S6.3.4: Componentes visuais auxiliares: criar componentes reutilizáveis (StatusBadge, IconButton, etc.), garantindo consistência visual (cores do tema).
S6.4 Multi-Tenant e Permissões:
S6.4.1: Configurar sistema de autenticação/identificação de tenant atual (por usuário ou subdomínio) e bloquear acesso indevido.
S6.4.2: Habilitar “superadmin” para visualizar múltiplos tenants quando necessário.
S6.5 Infra e Configuração:
S6.5.1: Ajustar configuração do projeto (Next.js) para SQLite (dev) e PostgreSQL (prod).
S6.5.2: Instalar dependências necessárias (Prisma/Drizzle, Bibliotecas de gráficos).
S6.6 Qualidade e Documentação:
S6.6.1: Criar testes unitários e de integração para APIs críticas (ex.: criação de conta e escopo por tenant).
S6.6.2: Escrever documentação técnica (detalhes da API, modelo de dados, guias rápidos).
10. Tabela de Tarefas Prioritárias
Tarefa	Descrição	Prioridade	Tipo	Duração Estimada
S6.1.1	Modelagem de dados: criar esquema de Contas e Categorias (Prisma).	Alta	Back-end	8h (1 dia)
S6.1.2	Migrações iniciais (SQLite e PostgreSQL) e seeds de categorias.	Média	Back-end	4h
S6.2.1	API CRUD de Contas (endpoints REST/GraphQL).	Alta	Back-end	16h (2 dias)
S6.2.2	API CRUD de Categorias.	Média	Back-end	8h
S6.2.3	Filtros e relatórios (endpoints para views específicas e KPIs).	Média	Back-end	8h
S6.2.5	Implementar multi-tenancy (middleware de tenant_id).	Alta	Back-end	8h
S6.3.1	Interface de listagem de Contas (tabela responsiva, filtros).	Alta	Front-end	16h (2 dias)
S6.3.2	Formulário de Contas (criar/editar).	Alta	Front-end	16h (2 dias)
S6.3.3	Dashboard financeiro (cards KPI + gráficos de barras/pizza).	Média	Front-end	24h (3 dias)
S6.3.4	Componentes UI (badges de status, botões com ícones, componentes Chart).	Média	Front-end	8h
S6.4.1	Autenticação/perm. (identificação de tenant e superadmin).	Alta	Back-end	8h
S6.6.1	Testes (unitários e integração de APIs críticas).	Média	Testes/QA	8h
S6.6.2	Documentação técnica (API, diagramas, exemplos de código).	Média	Documentação	4h
Cada tarefa listada deve ser detalhada nos subtarefas acima (por exemplo, S6.2.1 inclui também validações e tratamento de erros). A estimativa de duração considera um desenvolvedor experiente. Prioridades “Alta” contemplam funcionalidades críticas (como CRUD básico e isolamento de dados), enquanto “Média” ou “Baixa” correspondem a melhorias e documentação. Fontes: A modelagem e filtragem por tenant_id seguem recomendações de arquiteturas multi-tenant
workos.com
. Os componentes de UI e dashboard utilizam exemplos da biblioteca shadcn/ui
ui.shadcn.com
ui.shadcn.com
ui.shadcn.com
 e práticas comuns em dashboards financeiros
blog.coupler.io
gmpe.com.br
. As configurações de stack acompanham as novidades do Next.js 16 (TS e Tailwind por padrão)
nextjs.org
. O ORM Prisma (TypeScript-safe) foi citado como referência para modelagem e migrações
dev.to
.
Citações
Financeiro | GMPE

https://gmpe.com.br/como-funciona/financeiro.html

The developer’s guide to SaaS multi-tenant architecture — WorkOS

https://workos.com/blog/developers-guide-saas-multi-tenant-architecture

The developer’s guide to SaaS multi-tenant architecture — WorkOS

https://workos.com/blog/developers-guide-saas-multi-tenant-architecture

The developer’s guide to SaaS multi-tenant architecture — WorkOS

https://workos.com/blog/developers-guide-saas-multi-tenant-architecture

The developer’s guide to SaaS multi-tenant architecture — WorkOS

https://workos.com/blog/developers-guide-saas-multi-tenant-architecture

Next.js 16 | Next.js

https://nextjs.org/blog/next-16

Using Prisma ORM with Next.js 15, TypeScript, and PostgreSQL - DEV Community

https://dev.to/mihir_bhadak/using-prisma-orm-with-nextjs-15-typescript-and-postgresql-2b96

Top 19 Exemplos e Templates de Dashboards Financeiros

https://blog.coupler.io/pt/dashboards-financeiros/

The Foundation for your Design System - shadcn/ui

https://ui.shadcn.com/

Table - shadcn/ui

https://ui.shadcn.com/docs/components/table

Badge - shadcn/ui

https://ui.shadcn.com/docs/components/badge

Beautiful Charts & Graphs - shadcn/ui

https://ui.shadcn.com/charts/area

Payments

https://docs.asaas.com/docs/payments-1
Todas as fontes