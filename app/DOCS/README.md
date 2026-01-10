# Documentação EsferaORDO

Bem-vindo à documentação do projeto **EsferaORDO** - Sistema de Gestão para Loja Maçônica (Rito Escocês Retificado).

## Índice

1. **[Requisitos](./Requisitos.md)** - Especificação completa do produto e requisitos funcionais
2. **[Arquitetura](./Arquitetura.md)** - Stack técnica, estrutura do projeto e banco de dados
3. **[Design System](./DesignSystem.md)** - Padrões visuais, cores e componentes UI
4. **[Desenvolvimento](./Desenvolvimento.md)** - Comandos, workflows e guidelines de código
5. **[Sprints](./Sprints.md)** - Planejamento e cronograma de entregas

## Sobre o Projeto

Sistema web SaaS para gestão administrativa e financeira de Lojas Maçônicas, com foco em uso mobile, simplicidade e organização.

### Objetivo

Substituir controles manuais e planilhas por uma plataforma centralizada que gerencia:
- Membros e presença
- Mensalidades e inadimplência
- Receitas e despesas
- Documentos (biblioteca e atas)
- Inventário de materiais
- Comunicação e engajamento

### Stack Principal

- **Frontend + Backend**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS 4 + shadcn/ui
- **Banco de Dados**: SQLite (dev) → Neon PostgreSQL (prod)
- **Autenticação**: JWT (7 dias)

## Status do Projeto

**Sprint Atual**: Sprint Amanhã - Membros e Presenca

O projeto está em fase inicial de desenvolvimento. Consulte [Sprints.md](./Sprints.md) para detalhes do planejamento.

## Estrutura da Documentação

Cada arquivo de documentação cobre um aspecto específico do projeto:

- **Requisitos.md**: O que o sistema deve fazer (funcionalidades e casos de uso)
- **Arquitetura.md**: Como o sistema é construído (tecnologias e estrutura)
- **DesignSystem.md**: Como o sistema deve parecer (UI/UX)
- **Desenvolvimento.md**: Como trabalhar no projeto (comandos e padrões)
- **Sprints.md**: Quando cada funcionalidade será desenvolvida (cronograma)

## Links Úteis

- Código-fonte: `app/` (aplicação principal)
- Documentação original: `app/DOCS/` (PRD e Sprint Planning originais)
- CLAUDE.md: Guia para Claude Code na raiz do projeto
